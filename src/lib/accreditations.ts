/** Canonical public label for Joint Commission / JCAHO aliases. */
export const JOINT_COMMISSION_LABEL = "Joint Commission";

function normalizeAccreditationKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()./,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isJointCommission(value: string): boolean {
  const key = normalizeAccreditationKey(value);
  return (
    key === "jcaho" ||
    key === "joint commission" ||
    key === "the joint commission" ||
    key === "jcaho joint commission" ||
    key === "joint commission jcaho" ||
    key.includes("joint commission")
  );
}

export function accreditationKey(value: string): string {
  if (isJointCommission(value)) return "joint-commission";
  return normalizeAccreditationKey(value);
}

export function accreditationDisplayLabel(value: string): string {
  if (isJointCommission(value)) return JOINT_COMMISSION_LABEL;
  return value.trim();
}

/** Drop blanks, exact dupes, and JCAHO / Joint Commission aliases. */
export function uniqueAccreditations(items: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items ?? []) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = accreditationKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key === "joint-commission" ? JOINT_COMMISSION_LABEL : trimmed);
  }
  return out;
}
