/** Public membership catalog. Amounts must stay in sync with `server/stripe/pricing.mjs`. */

export type MembershipTierId = "profile" | "network" | "group";
export type BillingInterval = "month" | "year";

export const MEMBERSHIP_INCLUDED = [
  "Organization dashboard",
  "Public shareable profile",
  "Unlimited team seats",
  "Unlimited profile updates",
  "Monthly verification",
  "Insurance & level of care listings",
  "Referral contact management",
  "Authenticated Search",
] as const;

export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  facilityLabel: string;
  facilityMin: number;
  facilityMax: number;
  monthlyCents: number;
  annualCents: number;
  description: string;
  featured: boolean;
  badge: string | null;
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "profile",
    name: "1 facility",
    facilityLabel: "1 facility",
    facilityMin: 1,
    facilityMax: 1,
    monthlyCents: 9900,
    annualCents: 99_000,
    description: "One location. One live link your BD team can share.",
    featured: false,
    badge: null,
  },
  {
    id: "network",
    name: "2–5 facilities",
    facilityLabel: "2–5 facilities",
    facilityMin: 2,
    facilityMax: 5,
    monthlyCents: 24_900,
    annualCents: 249_000,
    description: "A few sites under one org link — still easy to keep current.",
    featured: true,
    badge: "Most orgs",
  },
  {
    id: "group",
    name: "6–15 facilities",
    facilityLabel: "6–15 facilities",
    facilityMin: 6,
    facilityMax: 15,
    monthlyCents: 49_900,
    annualCents: 499_000,
    description: "Multi-site organizations that need one source of truth across locations.",
    featured: false,
    badge: null,
  },
];

export type DfyPackage = {
  id: MembershipTierId;
  name: string;
  facilityLabel: string;
  amountCents: number;
};

export const DFY_PACKAGES: DfyPackage[] = [
  { id: "profile", name: "Done For You", facilityLabel: "1 facility", amountCents: 49_900 },
  { id: "network", name: "Done For You", facilityLabel: "2–5 facilities", amountCents: 120_000 },
  { id: "group", name: "Done For You", facilityLabel: "6–15 facilities", amountCents: 250_000 },
];

export const ENTERPRISE = {
  name: "16+ facilities",
  facilityLabel: "16+ facilities",
  monthlyFromCents: 79_900,
  description: "Custom membership and Done For You.",
} as const;

export const PRICING_HEADING = {
  titleBefore: "One live link,",
  titleAccent: "any size",
  summary:
    "Whether you operate one facility or a nationwide organization, CenterLinked makes it easy to keep every location, contract, and referral contact current — no matter how big or small you are.",
} as const;

export const PRICING_SUMMARY =
  "1 facility $99/month, then the monthly rate rises with each added facility up to $499 for 15. 16+ is quoted. Annual billing includes two months free. We’ll build your profile from $499. Referral partners are not billed.";

/**
 * Monthly membership (cents) by live facility count.
 * Bookends stay published: 1 = $99, 5 = $249, 15 = $499. Each step up costs more.
 * Index 0 unused. 16+ is quoted (ENTERPRISE).
 */
export const MEMBERSHIP_MONTHLY_CENTS_BY_COUNT = [
  0, 9900, 14_900, 18_900, 21_900, 24_900, 27_900, 30_900, 33_900, 36_900, 39_900, 42_900, 44_900,
  46_900, 48_900, 49_900,
] as const;

/** One-time Done For You (cents). 1 = $499, 5 = $1,200, 15 = $2,500. */
export const DFY_CENTS_BY_COUNT = [
  0, 49_900, 67_500, 85_000, 102_500, 120_000, 133_000, 146_000, 159_000, 172_000, 185_000, 198_000,
  211_000, 224_000, 237_000, 250_000,
] as const;

export function getMembershipTier(id: string | null | undefined) {
  return MEMBERSHIP_TIERS.find((tier) => tier.id === id) ?? null;
}

export function getDfyPackage(id: string | null | undefined) {
  return DFY_PACKAGES.find((pkg) => pkg.id === id) ?? null;
}

export function membershipAmountCents(tier: MembershipTier, interval: BillingInterval) {
  return interval === "year" ? tier.annualCents : tier.monthlyCents;
}

export function formatUsdFromCents(cents: number) {
  if (cents % 100 === 0) {
    return `$${(cents / 100).toLocaleString("en-US")}`;
  }
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function membershipPriceLabel(tier: MembershipTier, interval: BillingInterval) {
  return formatUsdFromCents(membershipAmountCents(tier, interval));
}

export function dfyPriceLabel(pkg: DfyPackage) {
  return formatUsdFromCents(pkg.amountCents);
}

/** Map an org’s facility count to the Done For You package they should buy. */
export function dfyPackageForFacilityCount(count: number): DfyPackage | "enterprise" {
  const n = Math.max(0, Math.floor(count));
  if (n <= 1) return DFY_PACKAGES[0];
  if (n <= 5) return DFY_PACKAGES[1];
  if (n <= 15) return DFY_PACKAGES[2];
  return "enterprise";
}

export function suggestedTierForFacilityCount(count: number): MembershipTierId | "enterprise" {
  const n = Math.max(0, Math.floor(count));
  if (n <= 1) return "profile";
  if (n <= 5) return "network";
  if (n <= 15) return "group";
  return "enterprise";
}

/** Landing slider: 1–15 self-serve, 16 means 16+ (quoted). */
export const PRICING_SLIDER_MAX = 16;

export type MembershipQuote =
  | {
      facilityCount: number;
      facilityLabel: string;
      isEnterprise: false;
      tier: MembershipTier;
      monthlyCents: number;
      annualCents: number;
      dfyCents: number;
    }
  | {
      facilityCount: number;
      facilityLabel: string;
      isEnterprise: true;
      tier: null;
      monthlyCents: null;
      annualCents: null;
      dfyCents: null;
    };

export function membershipMonthlyCentsForCount(count: number) {
  const n = Math.floor(Number(count) || 0);
  if (n < 1 || n > 15) return null;
  return MEMBERSHIP_MONTHLY_CENTS_BY_COUNT[n] ?? null;
}

export function membershipAnnualCentsForCount(count: number) {
  const monthly = membershipMonthlyCentsForCount(count);
  return monthly == null ? null : monthly * 10;
}

export function dfyCentsForCount(count: number) {
  const n = Math.floor(Number(count) || 0);
  if (n < 1 || n > 15) return null;
  return DFY_CENTS_BY_COUNT[n] ?? null;
}

/** Published membership quote for a live facility count (slider / checkout). */
export function membershipQuoteForFacilityCount(count: number): MembershipQuote {
  const n = Math.min(PRICING_SLIDER_MAX, Math.max(1, Math.floor(Number(count) || 1)));
  const tierId = suggestedTierForFacilityCount(n);
  if (tierId === "enterprise") {
    return {
      facilityCount: n,
      facilityLabel: ENTERPRISE.facilityLabel,
      isEnterprise: true,
      tier: null,
      monthlyCents: null,
      annualCents: null,
      dfyCents: null,
    };
  }
  const tier = getMembershipTier(tierId);
  const monthlyCents = membershipMonthlyCentsForCount(n);
  const annualCents = membershipAnnualCentsForCount(n);
  const dfyCents = dfyCentsForCount(n);
  if (!tier || monthlyCents == null || annualCents == null || dfyCents == null) {
    return {
      facilityCount: n,
      facilityLabel: ENTERPRISE.facilityLabel,
      isEnterprise: true,
      tier: null,
      monthlyCents: null,
      annualCents: null,
      dfyCents: null,
    };
  }
  return {
    facilityCount: n,
    facilityLabel: n === 1 ? "1 facility" : `${n} facilities`,
    isEnterprise: false,
    tier,
    monthlyCents,
    annualCents,
    dfyCents,
  };
}
