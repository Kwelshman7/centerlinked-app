/**
 * Pure membership Checkout rules (audit P1).
 * Idle = no subscription id and status none/canceled.
 * past_due / unpaid / incomplete go to the Customer Portal, not a second subscription.
 */

const IDLE_STATUSES = new Set(["none", "canceled", ""]);
const PORTAL_STATUSES = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function normalizeSubscriptionStatus(status) {
  return String(status ?? "none").trim().toLowerCase();
}

export function membershipCheckoutDecision(org) {
  const status = normalizeSubscriptionStatus(org?.subscription_status);
  const hasSubId = Boolean(org?.stripe_subscription_id);
  const idle = IDLE_STATUSES.has(status) && !hasSubId;

  if (idle || status === "canceled") {
    return {
      allowMembershipCheckout: true,
      usePortal: false,
      alreadyActive: false,
    };
  }

  return {
    allowMembershipCheckout: false,
    usePortal: PORTAL_STATUSES.has(status) || (!ACTIVE_STATUSES.has(status) && hasSubId),
    alreadyActive: ACTIVE_STATUSES.has(status),
  };
}
