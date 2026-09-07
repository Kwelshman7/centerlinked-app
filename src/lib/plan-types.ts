/** Known insurance plan families stored on `insurance_contracts.plan_types`. */

export const PLAN_TYPES = [
  { slug: "ppo", label: "Commercial PPO", shortLabel: "PPO" },
  { slug: "hmo", label: "Commercial HMO", shortLabel: "HMO" },
  { slug: "epo", label: "Commercial EPO", shortLabel: "EPO" },
  { slug: "pos", label: "Commercial POS", shortLabel: "POS" },
  { slug: "marketplace", label: "Marketplace / individual", shortLabel: "Marketplace" },
  { slug: "medicare_advantage", label: "Medicare Advantage", shortLabel: "Medicare Advantage" },
  { slug: "medicare_traditional", label: "Original Medicare", shortLabel: "Original Medicare" },
  { slug: "medicaid_mco", label: "Medicaid managed care", shortLabel: "Medicaid MCO" },
  { slug: "medicaid_ffs", label: "Medicaid FFS", shortLabel: "Medicaid FFS" },
  { slug: "tricare_prime", label: "TRICARE Prime", shortLabel: "TRICARE Prime" },
  { slug: "tricare_select", label: "TRICARE Select", shortLabel: "TRICARE Select" },
] as const;

export type PlanTypeSlug = (typeof PLAN_TYPES)[number]["slug"];

export const PLAN_TYPE_SLUGS: readonly PlanTypeSlug[] = PLAN_TYPES.map((p) => p.slug);

export const PLAN_TYPE_HELPER =
  "Only check what you actually accept. Leave blank if you are not sure.";

const SLUG_SET = new Set<string>(PLAN_TYPE_SLUGS);

export function isPlanTypeSlug(value: string): value is PlanTypeSlug {
  return SLUG_SET.has(value);
}

/** Drop blanks, unknown slugs, and duplicates. Empty means “not specified.” */
export function sanitizePlanTypes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const slug = item.trim().toLowerCase();
    if (!isPlanTypeSlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

export function parsePlanTypeParam(raw: string | null | undefined): PlanTypeSlug | "" {
  const slug = (raw ?? "").trim().toLowerCase();
  return isPlanTypeSlug(slug) ? slug : "";
}

export function planTypeLabel(slug: string): string {
  return PLAN_TYPES.find((p) => p.slug === slug)?.label ?? slug;
}

export function planTypeShortLabel(slug: string): string {
  return PLAN_TYPES.find((p) => p.slug === slug)?.shortLabel ?? slug;
}

export function formatPlanTypeList(slugs: string[] | null | undefined): string {
  return sanitizePlanTypes(slugs).map(planTypeShortLabel).join(", ");
}

/**
 * Typed search: a named plan type matches only when the contract claimed it.
 * Empty `plan_types` never matches. No filter → keep the row.
 */
export function contractMatchesPlanType(
  planTypes: string[] | null | undefined,
  planType: string | null | undefined,
): boolean {
  const wanted = parsePlanTypeParam(planType);
  if (!wanted) return true;
  return sanitizePlanTypes(planTypes).includes(wanted);
}
