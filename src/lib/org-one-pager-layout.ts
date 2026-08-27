export type OrgPrintDensity = "generous" | "standard" | "directory";
export type OrgPrintPageKind = "cover" | "directory";

export type OrgPrintPageSlice = {
  kind: OrgPrintPageKind;
  start: number;
  end: number;
};

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

/** 1–3 roomy cards, 4–8 compact pages, 9+ cover then a dense insurance directory. */
export function densityForFacilityCount(count: number): OrgPrintDensity {
  if (count <= 3) return "generous";
  if (count <= 8) return "standard";
  return "directory";
}

export function rowsPerDirectoryPage(density: OrgPrintDensity): number {
  if (density === "generous") return 3;
  if (density === "standard") return 4;
  return 9;
}

export function payerCapForDensity(density: OrgPrintDensity): number {
  if (density === "generous") return 24;
  if (density === "standard") return 18;
  return 14;
}

export function paginateOrgFacilities(count: number): OrgPrintPageSlice[] {
  const n = Math.max(0, count);
  const density = densityForFacilityCount(n);
  if (n === 0) return [{ kind: "cover", start: 0, end: 0 }];

  if (density === "directory") {
    const per = rowsPerDirectoryPage(density);
    const pages: OrgPrintPageSlice[] = [{ kind: "cover", start: 0, end: 0 }];
    for (let i = 0; i < n; i += per) {
      pages.push({ kind: "directory", start: i, end: Math.min(n, i + per) });
    }
    return pages;
  }

  const per = rowsPerDirectoryPage(density);
  const pages: OrgPrintPageSlice[] = [];
  for (let i = 0; i < n; i += per) {
    pages.push({ kind: "directory", start: i, end: Math.min(n, i + per) });
  }
  return pages;
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
