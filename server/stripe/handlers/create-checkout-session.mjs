import { getStripe, stripePrices, appSiteUrl, randomSuffix } from "../client.mjs";
import { assertOrgBillingAdmin, supabaseAdmin } from "../supabase.mjs";
import { membershipCheckoutDecision } from "../membership-checkout.mjs";
import {
  checkoutLineItems,
  checkoutMetadata,
  parseCheckoutRequest,
} from "../checkout-request.mjs";

/**
 * Create a Stripe Checkout Session for org membership.
 * Body: { membershipTier?, interval?, doneForYou? }
 * Legacy: { plan?: "membership" | "done_for_you" }
 */
export async function handleCreateCheckoutSession(body, accessToken) {
  const auth = await assertOrgBillingAdmin(accessToken);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("[create-checkout-session] STRIPE_SECRET_KEY is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const request = parseCheckoutRequest(body);
  if (!request.ok) {
    return { status: request.status, json: { error: request.error } };
  }

  const prices = stripePrices();
  if (request.membershipTier === "profile" && request.interval === "month" && !prices.membership) {
    console.error("[create-checkout-session] STRIPE_PRICE_MEMBERSHIP is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }
  if (
    request.doneForYou &&
    request.membershipTier === "profile" &&
    !prices.setup
  ) {
    console.error("[create-checkout-session] STRIPE_PRICE_SETUP is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[create-checkout-session] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select(
      "id,name,stripe_customer_id,stripe_subscription_id,subscription_status,setup_package,billing_email",
    )
    .eq("id", auth.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { status: 404, json: { error: "Organization not found" } };
  }

  const decision = membershipCheckoutDecision(org);
  const alreadySubscribed = decision.alreadyActive;
  const wantsMembership = !alreadySubscribed;
  const wantsDfyOnly = alreadySubscribed && request.doneForYou;

  if (!decision.allowMembershipCheckout) {
    if (wantsMembership && !request.doneForYou && !decision.usePortal) {
      return {
        status: 400,
        json: { error: "Organization already has an active membership. Manage it in Billing." },
      };
    }
    if (!alreadySubscribed) {
      return {
        status: 409,
        json: {
          error: "This organization already has a membership. Update payment details in Billing.",
          code: "use_portal",
        },
      };
    }
  }

  if (alreadySubscribed) {
    if (!request.doneForYou) {
      return {
        status: 400,
        json: { error: "Organization already has an active membership. Manage it in Billing." },
      };
    }
    if (org.setup_package === "done_for_you") {
      return {
        status: 400,
        json: { error: "Done For You setup was already purchased for this organization." },
      };
    }
  }

  let customerId = org.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: auth.email || org.billing_email || undefined,
        name: org.name,
        metadata: {
          organization_id: org.id,
        },
      },
      { idempotencyKey: `cl_cust_${org.id}` },
    );
    customerId = customer.id;
    const { error: customerUpdateError } = await admin
      .from("organizations")
      .update({
        stripe_customer_id: customerId,
        billing_email: auth.email || org.billing_email || null,
      })
      .eq("id", org.id);

    // Concurrent checkout may have won the unique customer index — re-read.
    if (customerUpdateError) {
      const { data: refreshed } = await admin
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", org.id)
        .maybeSingle();
      if (refreshed?.stripe_customer_id) {
        customerId = refreshed.stripe_customer_id;
      } else {
        console.error("[create-checkout-session] failed to persist stripe_customer_id", customerUpdateError.message);
        return { status: 500, json: { error: "Could not start checkout" } };
      }
    }
  }

  const site = appSiteUrl();
  const integrationId = request.doneForYou
    ? `centerlinked_dfy_${randomSuffix()}`
    : `centerlinked_membership_${randomSuffix()}`;

  const checkoutIdempotencyKey = `cl_cs_${org.id}_${request.membershipTier}_${request.interval}_${
    request.doneForYou ? "dfy" : "mem"
  }_${alreadySubscribed ? "add" : "new"}_${Math.floor(Date.now() / 30_000)}`;

  async function createSession(sessionParams) {
    try {
      return await stripe.checkout.sessions.create(sessionParams, {
        idempotencyKey: checkoutIdempotencyKey,
      });
    } catch (err) {
      if (String(err?.message || "").includes("integration_identifier")) {
        delete sessionParams.integration_identifier;
        return await stripe.checkout.sessions.create(sessionParams, {
          idempotencyKey: `${checkoutIdempotencyKey}_noid`,
        });
      }
      throw err;
    }
  }

  const meta = {
    ...checkoutMetadata(request, { setupOnly: wantsDfyOnly }),
    organization_id: org.id,
  };

  /** Already on membership — charge setup fee only as a one-time payment. */
  if (wantsDfyOnly) {
    const sessionParams = {
      mode: "payment",
      customer: customerId,
      client_reference_id: org.id,
      line_items: checkoutLineItems(prices, request, { setupOnly: true }),
      success_url: `${site}/app/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/app/billing`,
      allow_promotion_codes: true,
      // CenterLinked is merchant of record — Managed Payments (Stripe MoR) needs product tax codes.
      managed_payments: { enabled: false },
      metadata: meta,
      integration_identifier: integrationId,
    };

    const session = await createSession(sessionParams);
    return { status: 200, json: { url: session.url, id: session.id } };
  }

  const sessionParams = {
    mode: "subscription",
    customer: customerId,
    client_reference_id: org.id,
    line_items: checkoutLineItems(prices, request),
    success_url: `${site}/app/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/app/billing`,
    allow_promotion_codes: true,
    // CenterLinked is merchant of record — Managed Payments (Stripe MoR) needs product tax codes.
    managed_payments: { enabled: false },
    metadata: meta,
    subscription_data: {
      metadata: {
        organization_id: org.id,
        membership_tier: request.membershipTier,
        billing_interval: request.interval,
        setup_package: meta.setup_package,
      },
    },
    integration_identifier: integrationId,
  };

  const session = await createSession(sessionParams);
  return { status: 200, json: { url: session.url, id: session.id } };
}
