/**
 * Server copy of the public membership catalog.
 * Amounts / facility bands must stay in sync with `src/lib/pricing.ts`.
 */

export const MEMBERSHIP_TIERS = {
  profile: {
    id: "profile",
    productName: "CenterLinked Small",
    facilityLabel: "1 live facility",
    facilityMin: 1,
    facilityMax: 1,
    monthlyCents: 9900,
    annualCents: 99_000,
  },
  network: {
    id: "network",
    productName: "CenterLinked Medium",
    facilityLabel: "2–5 live facilities",
    facilityMin: 2,
    facilityMax: 5,
    monthlyCents: 24_900,
    annualCents: 249_000,
  },
  group: {
    id: "group",
    productName: "CenterLinked Large",
    facilityLabel: "6–15 live facilities",
    facilityMin: 6,
    facilityMax: 15,
    monthlyCents: 49_900,
    annualCents: 499_000,
  },
};

export const DFY_PACKAGES = {
  profile: {
    id: "profile",
    productName: "CenterLinked Done For You · 1 facility",
    amountCents: 49_900,
  },
  network: {
    id: "network",
    productName: "CenterLinked Done For You · 2–5 facilities",
    amountCents: 120_000,
  },
  group: {
    id: "group",
    productName: "CenterLinked Done For You · 6–15 facilities",
    amountCents: 250_000,
  },
};

export const MEMBERSHIP_TIER_IDS = new Set(Object.keys(MEMBERSHIP_TIERS));

const TIER_RANK = { profile: 1, network: 2, group: 3 };

/** Minimum self-serve tier for a live facility count. 0–1 → profile. */
export function requiredTierForFacilityCount(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n <= 1) return "profile";
  if (n <= 5) return "network";
  if (n <= 15) return "group";
  return "enterprise";
}

/**
 * Allow same tier or higher (upsell). Reject underpay and 16+ self-serve.
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function assertTierMatchesFacilityCount(membershipTier, facilityCount) {
  const required = requiredTierForFacilityCount(facilityCount);
  if (required === "enterprise") {
    return {
      ok: false,
      status: 400,
      error:
        "Organizations with 16+ facilities need Enterprise pricing. Request access and we’ll follow up.",
    };
  }
  const have = TIER_RANK[membershipTier] || 0;
  const need = TIER_RANK[required] || 0;
  if (have < need) {
    const label = MEMBERSHIP_TIERS[required]?.productName || required;
    return {
      ok: false,
      status: 400,
      error: `This organization has ${facilityCount} live facilities and requires ${label} (or higher).`,
    };
  }
  return { ok: true };
}

/** Stripe subscription statuses that block opening a second membership Checkout. */
export const STRIPE_BLOCKING_SUB_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);
