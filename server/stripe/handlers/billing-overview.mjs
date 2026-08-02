import { getStripe } from "../client.mjs";
import { assertOrgBillingAdmin, supabaseAdmin } from "../supabase.mjs";

function formatMoney(amount, currency = "usd") {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

/**
 * Billing overview for org admins — subscription snapshot + invoice history.
 */
export async function handleBillingOverview(accessToken) {
  const auth = await assertOrgBillingAdmin(accessToken);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("[billing-overview] STRIPE_SECRET_KEY is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[billing-overview] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 500, json: { error: "Billing is temporarily unavailable" } };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select(
      "id,name,billing_email,subscription_status,subscription_current_period_end,subscription_price_id,setup_package,stripe_customer_id,stripe_subscription_id",
    )
    .eq("id", auth.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { status: 404, json: { error: "Organization not found" } };
  }

  let subscription = null;
  let invoices = [];
  let paymentMethod = null;

  if (org.stripe_customer_id) {
    try {
      if (org.stripe_subscription_id) {
        const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id, {
          expand: ["default_payment_method", "items.data.price.product"],
        });
        const item = sub.items?.data?.[0];
        const product = item?.price?.product;
        const pm = sub.default_payment_method;
        subscription = {
          id: sub.id,
          status: sub.status,
          cancel_at_period_end: !!sub.cancel_at_period_end,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          price_id: item?.price?.id || org.subscription_price_id || null,
          product_name:
            typeof product === "object" && product?.name
              ? product.name
              : "CenterLinked Membership",
          unit_amount: item?.price?.unit_amount ?? null,
          currency: item?.price?.currency || "usd",
          interval: item?.price?.recurring?.interval || "month",
          amount_label: formatMoney(item?.price?.unit_amount, item?.price?.currency),
        };
        if (pm && typeof pm === "object" && pm.card) {
          paymentMethod = {
            brand: pm.card.brand || "card",
            last4: pm.card.last4 || null,
            exp_month: pm.card.exp_month || null,
            exp_year: pm.card.exp_year || null,
          };
        }
      }

      const invoiceList = await stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: 24,
      });
      invoices = invoiceList.data.map((inv) => ({
        id: inv.id,
        number: inv.number || inv.id,
        status: inv.status,
        created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        amount_paid: inv.amount_paid,
        amount_due: inv.amount_due,
        currency: inv.currency || "usd",
        amount_label: formatMoney(
          inv.status === "paid" ? inv.amount_paid : inv.amount_due,
          inv.currency,
        ),
        hosted_invoice_url: inv.hosted_invoice_url || null,
        invoice_pdf: inv.invoice_pdf || null,
        description:
          inv.lines?.data?.[0]?.description ||
          (inv.billing_reason === "subscription_create" ? "Subscription start" : "Invoice"),
      }));
    } catch (err) {
      console.error("[billing-overview] stripe fetch", err?.message || err);
      return {
        status: 500,
        json: { error: "Could not load billing details" },
      };
    }
  }

  return {
    status: 200,
    json: {
      organization: {
        id: org.id,
        name: org.name,
        billing_email: org.billing_email,
        subscription_status: org.subscription_status || "none",
        subscription_current_period_end: org.subscription_current_period_end,
        subscription_price_id: org.subscription_price_id,
        setup_package: org.setup_package,
        stripe_customer_id: org.stripe_customer_id,
        stripe_subscription_id: org.stripe_subscription_id,
      },
      subscription,
      payment_method: paymentMethod,
      invoices,
    },
  };
}
