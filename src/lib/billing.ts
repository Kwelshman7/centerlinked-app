import { supabase } from "@/integrations/supabase/client";

export type BillingPlan = "membership" | "done_for_you";

export type OrgBilling = {
  subscription_status: string;
  subscription_current_period_end: string | null;
  setup_package: string | null;
  stripe_customer_id: string | null;
  billing_email: string | null;
};

export function isSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function formatSubscriptionStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trialing";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "incomplete":
      return "Incomplete";
    case "unpaid":
      return "Unpaid";
    case "none":
    case null:
    case undefined:
    case "":
      return "Not subscribed";
    default:
      return status;
  }
}

export function formatSetupPackage(pkg: string | null | undefined) {
  if (pkg === "done_for_you") return "Done For You";
  if (pkg === "self_serve") return "Build It Yourself";
  return "—";
}

async function postBillingJson(path: string, body: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to manage billing.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
  if (!res.ok) {
    throw new Error(json.error || `Billing request failed (${res.status})`);
  }
  if (!json.url) {
    throw new Error("Billing response missing redirect URL");
  }
  return json.url;
}

/** Start Stripe Checkout for membership or Done For You. */
export async function startCheckout(plan: BillingPlan) {
  return postBillingJson("/api/create-checkout-session", { plan });
}

/** Open the Stripe Customer Portal. */
export async function openBillingPortal() {
  return postBillingJson("/api/create-portal-session", {});
}
