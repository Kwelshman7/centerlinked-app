import { getStripe, stripePrices, appSiteUrl, randomSuffix } from "../client.mjs";
import { assertOrgBillingAdmin, supabaseAdmin } from "../supabase.mjs";

/**
 * Create a Stripe Checkout Session for org membership.
 * Body: { plan?: "membership" | "done_for_you" }
 */
export async function handleCreateCheckoutSession(body, accessToken) {
  const auth = await assertOrgBillingAdmin(accessToken);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { status: 500, json: { error: "STRIPE_SECRET_KEY is not configured" } };
  }

  const prices = stripePrices();
  if (!prices.membership) {
    return { status: 500, json: { error: "STRIPE_PRICE_MEMBERSHIP is not configured" } };
  }

  const plan = String(body?.plan || "membership").trim() === "done_for_you"
    ? "done_for_you"
    : "membership";

  if (plan === "done_for_you" && !prices.setup) {
    return { status: 500, json: { error: "STRIPE_PRICE_SETUP is not configured" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return { status: 500, json: { error: "SUPABASE_SERVICE_ROLE is not configured" } };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select(
      "id,name,stripe_customer_id,subscription_status,setup_package,billing_email",
    )
    .eq("id", auth.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { status: 404, json: { error: "Organization not found" } };
  }

  const alreadySubscribed =
    org.subscription_status === "active" || org.subscription_status === "trialing";

  if (alreadySubscribed) {
    if (plan === "membership") {
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
    const customer = await stripe.customers.create({
      email: auth.email || org.billing_email || undefined,
      name: org.name,
      metadata: {
        organization_id: org.id,
      },
    });
    customerId = customer.id;
    await admin
      .from("organizations")
      .update({
        stripe_customer_id: customerId,
        billing_email: auth.email || org.billing_email || null,
      })
      .eq("id", org.id);
  }

  const site = appSiteUrl();
  const integrationId =
    plan === "done_for_you"
      ? `centerlinked_dfy_${randomSuffix()}`
      : `centerlinked_membership_${randomSuffix()}`;

  /** Already on membership — charge setup fee only as a one-time payment. */
  if (alreadySubscribed && plan === "done_for_you") {
    const sessionParams = {
      mode: "payment",
      customer: customerId,
      client_reference_id: org.id,
      line_items: [{ price: prices.setup, quantity: 1 }],
      success_url: `${site}/app/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/app/settings#billing`,
      allow_promotion_codes: true,
      metadata: {
        organization_id: org.id,
        plan: "done_for_you",
        setup_package: "done_for_you",
        setup_only: "true",
      },
      integration_identifier: integrationId,
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (err) {
      if (String(err?.message || "").includes("integration_identifier")) {
        delete sessionParams.integration_identifier;
        session = await stripe.checkout.sessions.create(sessionParams);
      } else {
        throw err;
      }
    }
    return { status: 200, json: { url: session.url, id: session.id } };
  }

  const line_items = [{ price: prices.membership, quantity: 1 }];
  if (plan === "done_for_you") {
    line_items.push({ price: prices.setup, quantity: 1 });
  }

  const sessionParams = {
    mode: "subscription",
    customer: customerId,
    client_reference_id: org.id,
    line_items,
    success_url: `${site}/app/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#pricing`,
    allow_promotion_codes: true,
    metadata: {
      organization_id: org.id,
      plan,
      setup_package: plan === "done_for_you" ? "done_for_you" : "self_serve",
    },
    subscription_data: {
      metadata: {
        organization_id: org.id,
        plan,
        setup_package: plan === "done_for_you" ? "done_for_you" : "self_serve",
      },
    },
    integration_identifier: integrationId,
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    // Older accounts / API versions may reject integration_identifier.
    if (String(err?.message || "").includes("integration_identifier")) {
      delete sessionParams.integration_identifier;
      session = await stripe.checkout.sessions.create(sessionParams);
    } else {
      throw err;
    }
  }

  return { status: 200, json: { url: session.url, id: session.id } };
}
