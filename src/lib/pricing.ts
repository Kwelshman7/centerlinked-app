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
    name: "Small",
    facilityLabel: "1 live facility",
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
    name: "Medium",
    facilityLabel: "2–5 live facilities",
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
    name: "Large",
    facilityLabel: "6–15 live facilities",
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
  name: "Enterprise",
  facilityLabel: "16+ live facilities",
  monthlyFromCents: 79_900,
  description: "Nationwide platforms. Custom membership and Done For You — request access.",
} as const;

export const PRICING_HEADING = {
  titleBefore: "One live link,",
  titleAccent: "any size",
  summary:
    "Whether you operate one facility or a nationwide organization, CenterLinked makes it easy to keep every location, contract, and referral contact current — no matter how big or small you are.",
} as const;

export const PRICING_SUMMARY =
  "Small $99/month (1 facility). Medium $249 (2–5). Large $499 (6–15). Annual billing includes two months free. We’ll build your profile from $499. Referral partners are not billed.";

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
