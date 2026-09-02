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

/** Must stay in sync with `MEMBERSHIP_MONTHLY_CENTS_BY_COUNT` in `src/lib/pricing.ts`. */
export const MEMBERSHIP_MONTHLY_CENTS_BY_COUNT = [
  0, 9900, 14_900, 18_900, 21_900, 24_900, 27_900, 30_900, 33_900, 36_900, 39_900, 42_900, 44_900,
  46_900, 48_900, 49_900,
];

/** Must stay in sync with `DFY_CENTS_BY_COUNT` in `src/lib/pricing.ts`. */
export const DFY_CENTS_BY_COUNT = [
  0, 49_900, 67_500, 85_000, 102_500, 120_000, 133_000, 146_000, 159_000, 172_000, 185_000, 198_000,
  211_000, 224_000, 237_000, 250_000,
];

export function membershipMonthlyCentsForCount(count) {
  const n = Math.floor(Number(count) || 0);
  if (n < 1 || n > 15) return null;
  return MEMBERSHIP_MONTHLY_CENTS_BY_COUNT[n] ?? null;
}

export function membershipAnnualCentsForCount(count) {
  const monthly = membershipMonthlyCentsForCount(count);
  return monthly == null ? null : monthly * 10;
}

export function dfyCentsForCount(count) {
  const n = Math.floor(Number(count) || 0);
  if (n < 1 || n > 15) return null;
  return DFY_CENTS_BY_COUNT[n] ?? null;
}

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
