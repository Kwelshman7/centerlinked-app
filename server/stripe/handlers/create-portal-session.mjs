import { getStripe, appSiteUrl } from "../client.mjs";
import { assertOrgBillingAdmin, supabaseAdmin } from "../supabase.mjs";

/** Open the Stripe Customer Portal for the caller's organization. */
export async function handleCreatePortalSession(_body, accessToken) {
  const auth = await assertOrgBillingAdmin(accessToken);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { status: 500, json: { error: "STRIPE_SECRET_KEY is not configured" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return { status: 500, json: { error: "SUPABASE_SERVICE_ROLE is not configured" } };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id,stripe_customer_id")
    .eq("id", auth.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { status: 404, json: { error: "Organization not found" } };
  }

  if (!org.stripe_customer_id) {
    return {
      status: 400,
      json: { error: "No billing account yet. Subscribe first." },
    };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appSiteUrl()}/app/billing`,
  });

  return { status: 200, json: { url: session.url } };
}
