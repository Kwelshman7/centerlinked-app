import { supabase } from "@/integrations/supabase/client";

export type BillingPlan = "membership" | "done_for_you";

export type OrgBilling = {
  subscription_status: string;
  subscription_current_period_end: string | null;
  setup_package: string | null;
  stripe_customer_id: string | null;
  billing_email: string | null;
};

export type BillingInvoice = {
  id: string;
  number: string;
  status: string | null;
  created: string | null;
  amount_paid: number | null;
  amount_due: number | null;
  currency: string;
  amount_label: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string | null;
};

export type BillingOverview = {
  organization: OrgBilling & {
    id: string;
    name: string;
    subscription_price_id?: string | null;
    stripe_subscription_id?: string | null;
  };
  subscription: {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
    price_id: string | null;
    product_name: string;
    unit_amount: number | null;
    currency: string;
    interval: string;
    amount_label: string | null;
  } | null;
  payment_method: {
    brand: string;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
  } | null;
  invoices: BillingInvoice[];
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

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to manage billing.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function postBillingJson(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: await authHeaders(),
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
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ plan }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
    code?: string;
  };
  if (json.code === "use_portal") {
    return openBillingPortal();
  }
  if (!res.ok) {
    throw new Error(json.error || `Billing request failed (${res.status})`);
  }
  if (!json.url) {
    throw new Error("Billing response missing redirect URL");
  }
  return json.url;
}

/** Open the Stripe Customer Portal (update card, invoices, cancel). */
export async function openBillingPortal() {
  return postBillingJson("/api/create-portal-session", {});
}

/** Load subscription snapshot + invoice history for org admins. */
export async function fetchBillingOverview(): Promise<BillingOverview> {
  const res = await fetch("/api/billing-overview", {
    method: "GET",
    headers: await authHeaders(),
  });
  const json = (await res.json().catch(() => ({}))) as BillingOverview & { error?: string };
  if (!res.ok) {
    throw new Error(json.error || `Could not load billing (${res.status})`);
  }
  return json;
}
