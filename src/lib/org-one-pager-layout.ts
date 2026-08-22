export type OrgOnePagerLayout = "feature" | "split" | "trio" | "grid" | "rows";

const LOC_SHORT: Record<string, string> = {
  "medical detox": "Detox",
  detox: "Detox",
  residential: "Residential",
  php: "PHP",
  iop: "IOP",
  outpatient: "OP",
  "sober living": "Sober Living",
  mat: "MAT",
  "dual diagnosis": "Dual Diagnosis",
  "mental health residential": "MH Residential",
  "mental health php/iop": "MH PHP/IOP",
  "holistic treatment": "Holistic",
};

export function layoutForFacilityCount(count: number): OrgOnePagerLayout {
  if (count <= 1) return "feature";
  if (count === 2) return "split";
  if (count === 3) return "trio";
  if (count <= 6) return "grid";
  return "rows";
}

export function shortenLevelOfCare(level: string): string {
  const key = level.trim().toLowerCase();
  return LOC_SHORT[key] ?? level.trim();
}

export function uniquePreserve(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** True when every facility lists the same in-network payers (order-independent). */
export function payerSetsAreShared(sets: string[][]): boolean {
  if (sets.length < 2) return false;
  const first = uniquePreserve(sets[0]);
  if (first.length === 0) return false;
  return sets.every((set) => {
    const next = uniquePreserve(set);
    if (next.length !== first.length) return false;
    const left = [...first].map((x) => x.toLowerCase()).sort();
    const right = [...next].map((x) => x.toLowerCase()).sort();
    return left.every((v, i) => v === right[i]);
  });
}

export function referralOverviewFilename(orgName: string): string {
  const slug =
    orgName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "organization";
  const titled = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
  return `${titled}-Referral-Overview.pdf`;
}
