/**
 * Server copy of the public membership catalog.
 * Amounts must stay in sync with `src/lib/pricing.ts`.
 */

export const MEMBERSHIP_TIERS = {
  profile: {
    id: "profile",
    productName: "CenterLinked Profile",
    facilityLabel: "1 live facility",
    monthlyCents: 9900,
    annualCents: 99_000,
  },
  network: {
    id: "network",
    productName: "CenterLinked Network",
    facilityLabel: "2–5 live facilities",
    monthlyCents: 24_900,
    annualCents: 249_000,
  },
  group: {
    id: "group",
    productName: "CenterLinked Group",
    facilityLabel: "6–15 live facilities",
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
