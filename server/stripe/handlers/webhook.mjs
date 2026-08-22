import { getStripe } from "../client.mjs";
import { supabaseAdmin } from "../supabase.mjs";
import { sendEmail } from "../../email/send.mjs";
import { ADMIN_NOTIFY_EMAIL } from "../../email/config.mjs";
import { doneForYouAdminEmail } from "../../email/templates.mjs";

function periodEndIso(subscription) {
  const itemEnd = subscription?.items?.data?.[0]?.current_period_end;
  const end = itemEnd ?? subscription?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

function primaryPriceId(subscription) {
  return subscription?.items?.data?.[0]?.price?.id || null;
}

async function findOrgId({ admin, organizationId, customerId, subscription }) {
  if (organizationId) return organizationId;
  const fromMeta = subscription?.metadata?.organization_id;
  if (fromMeta) return fromMeta;

  if (customerId) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (subscription?.id) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

async function applySubscription(admin, orgId, subscription, extras = {}) {
  const status = subscription?.status || "none";
  const patch = {
    stripe_subscription_id: subscription?.id || null,
    subscription_status: status,
    subscription_price_id: primaryPriceId(subscription),
    subscription_current_period_end: periodEndIso(subscription),
    ...extras,
  };
  if (subscription?.customer) {
    patch.stripe_customer_id =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
  }
  const { error } = await admin.from("organizations").update(patch).eq("id", orgId);
  if (error) throw new Error(error.message);
}

async function notifyDoneForYouPurchase({ orgName, orgId, email, membershipTier }) {
  const template = doneForYouAdminEmail({ orgName, orgId, email, membershipTier });
  const result = await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: template.subject,
    text: template.text,
    html: template.html,
    replyTo: email || undefined,
  });
  if (!result.ok) {
    console.warn("[stripe-webhook] DFY notify failed:", result.error);
  }
}

async function handleCheckoutCompleted(admin, session) {
  const organizationId =
    session.client_reference_id || session.metadata?.organization_id || null;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const orgId = await findOrgId({
    admin,
    organizationId,
    customerId,
    subscription: subscriptionId ? { id: subscriptionId, metadata: session.metadata } : null,
  });
  if (!orgId) {
    throw new Error(`checkout.session.completed: organization not found (${session.id})`);
  }

  const setupPackage =
    session.metadata?.setup_package === "done_for_you" ? "done_for_you" : "self_serve";
  const setupOnly = session.metadata?.setup_only === "true";

  const patch = {
    stripe_customer_id: customerId || undefined,
    setup_package: setupPackage,
    billing_email: session.customer_details?.email || session.customer_email || undefined,
  };

  if (subscriptionId) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await applySubscription(admin, orgId, subscription, {
      setup_package: setupPackage,
      billing_email: patch.billing_email,
    });
  } else {
    // One-time Done For You add-on (or payment-mode checkout without subscription)
    const clean = Object.fromEntries(
      Object.entries({
        ...patch,
        ...(setupOnly ? { setup_package: "done_for_you" } : {}),
      }).filter(([, v]) => v !== undefined),
    );
    const { error } = await admin.from("organizations").update(clean).eq("id", orgId);
    if (error) throw new Error(error.message);
  }

  if (setupPackage === "done_for_you") {
    const { data: org } = await admin
      .from("organizations")
      .select("name,billing_email")
      .eq("id", orgId)
      .maybeSingle();
    await notifyDoneForYouPurchase({
      orgName: org?.name || orgId,
      orgId,
      membershipTier: session.metadata?.membership_tier || null,
      email: org?.billing_email || session.customer_details?.email,
    });
  }
}

async function handleSubscriptionEvent(admin, subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  const orgId = await findOrgId({
    admin,
    organizationId: subscription.metadata?.organization_id,
    customerId,
    subscription,
  });
  if (!orgId) {
    throw new Error(`subscription event: organization not found (${subscription.id})`);
  }

  if (subscription.status === "canceled") {
    await applySubscription(admin, orgId, subscription, {
      subscription_status: "canceled",
    });
    return;
  }

  await applySubscription(admin, orgId, subscription);
}

async function handleInvoicePaymentFailed(admin, invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  const orgId = await findOrgId({
    admin,
    customerId,
    subscription: subscriptionId ? { id: subscriptionId } : null,
  });
  if (!orgId) return;

  const { error } = await admin
    .from("organizations")
    .update({ subscription_status: "past_due" })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}

/**
 * Claim an event for processing. Returns false when already processed (duplicate delivery).
 * On handler failure the claim is released so Stripe can retry.
 */
async function claimWebhookEvent(admin, event) {
  const { error } = await admin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    livemode: !!event.livemode,
  });

  if (!error) return true;

  // Unique violation = already claimed/processed
  if (error.code === "23505") {
    return false;
  }

  throw new Error(error.message || "Failed to claim webhook event");
}

async function releaseWebhookEvent(admin, eventId) {
  const { error } = await admin.from("stripe_webhook_events").delete().eq("id", eventId);
  if (error) {
    console.error("[stripe-webhook] failed to release event claim", eventId, error.message);
  }
}

/**
 * @param {Buffer|string} rawBody
 * @param {string|string[]|undefined} signatureHeader
 */
export async function handleStripeWebhook(rawBody, signatureHeader) {
  const stripe = getStripe();
  if (!stripe) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    return { status: 400, json: { error: "Missing Stripe-Signature header" } };
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err?.message);
    return { status: 400, json: { error: "Invalid webhook signature" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[stripe-webhook] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  let claimed = false;
  try {
    claimed = await claimWebhookEvent(admin, event);
    if (!claimed) {
      return { status: 200, json: { received: true, duplicate: true } };
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(admin, event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(admin, event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(admin, event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error", event.type, err?.message || err);
    if (claimed) {
      await releaseWebhookEvent(admin, event.id);
    }
    return { status: 500, json: { error: "Webhook handler failed" } };
  }

  return { status: 200, json: { received: true } };
}
