/** Canonical accreditation / license / membership labels with aliases. */

export type AccreditationKind = "accreditation" | "license" | "membership" | "other";

export interface AccreditationBody {
  slug: string;
  canonicalName: string;
  kind: AccreditationKind;
  aliases: string[];
  formOption?: boolean;
}

export const ACCREDITATION_CATALOG: AccreditationBody[] = [
  {
    slug: "joint-commission",
    canonicalName: "Joint Commission",
    kind: "accreditation",
    formOption: true,
    aliases: [
      "JCAHO",
      "The Joint Commission",
      "Joint Commission (JCAHO)",
      "JCAHO (Joint Commission)",
      "JCAHO Joint Commission",
      "Joint Commission JCAHO",
      "Joint Commission (TJC)",
      "TJC",
      "Joint Commission Gold Seal",
      "The Joint Commission (Gold Seal)",
      "The Joint Commission (Gold Seal of Approval)",
      "Joint Commission (Gold Seal of Approval)",
    ],
  },
  {
    slug: "carf",
    canonicalName: "CARF",
    kind: "accreditation",
    formOption: true,
    aliases: ["CARF Accredited", "CARF International", "CARF (3-year)"],
  },
  {
    slug: "legitscript",
    canonicalName: "LegitScript",
    kind: "accreditation",
    formOption: true,
    aliases: ["LegitScript Certified"],
  },
  {
    slug: "farr",
    canonicalName: "FARR",
    kind: "accreditation",
    formOption: true,
    aliases: ["FARR Certified"],
  },
  {
    slug: "naatp",
    canonicalName: "NAATP",
    kind: "membership",
    formOption: true,
    aliases: ["NAATP Member"],
  },
  {
    slug: "dcf",
    canonicalName: "DCF",
    kind: "license",
    formOption: true,
    aliases: ["DCF Licensed", "Florida DCF"],
  },
  {
    slug: "narr",
    canonicalName: "NARR",
    kind: "accreditation",
    formOption: true,
    aliases: ["National Alliance of Recovery Residences"],
  },
  {
    slug: "state-licensed",
    canonicalName: "State licensed",
    kind: "license",
    formOption: true,
    aliases: ["State-licensed", "State Licensed"],
  },
  {
    slug: "dhcs",
    canonicalName: "DHCS",
    kind: "license",
    aliases: ["DHCS Licensed"],
  },
  {
    slug: "ahca",
    canonicalName: "AHCA",
    kind: "license",
    aliases: [],
  },
  {
    slug: "psych-armor",
    canonicalName: "Psych Armor",
    kind: "other",
    aliases: ["Psych Armor (Veteran-Ready)"],
  },
  {
    slug: "naadac",
    canonicalName: "NAADAC",
    kind: "membership",
    aliases: [],
  },
  {
    slug: "natsap",
    canonicalName: "NATSAP",
    kind: "membership",
    aliases: [],
  },
];

export const JOINT_COMMISSION_LABEL = "Joint Commission";

export const ACCREDITATION_OPTIONS = ACCREDITATION_CATALOG.filter((body) => body.formOption).map(
  (body) => body.canonicalName,
);

function normalizeAccreditationKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()./,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function catalogKeys(body: AccreditationBody): string[] {
  return [body.canonicalName, ...body.aliases].map(normalizeAccreditationKey).filter(Boolean);
}

const CATALOG_BY_KEY = new Map<string, AccreditationBody>();
for (const body of ACCREDITATION_CATALOG) {
  for (const key of catalogKeys(body)) {
    if (!CATALOG_BY_KEY.has(key)) CATALOG_BY_KEY.set(key, body);
  }
}

export function resolveAccreditationBody(value: string): AccreditationBody | null {
  const key = normalizeAccreditationKey(value);
  if (!key) return null;
  const exact = CATALOG_BY_KEY.get(key);
  if (exact) return exact;

  if (key.includes("joint commission") || key === "jcaho" || key === "tjc") {
    return CATALOG_BY_KEY.get("joint commission") ?? null;
  }
  if (key.startsWith("carf")) return CATALOG_BY_KEY.get("carf") ?? null;
  if (key.startsWith("legitscript")) return CATALOG_BY_KEY.get("legitscript") ?? null;
  if (key.startsWith("farr")) return CATALOG_BY_KEY.get("farr") ?? null;
  if (key.startsWith("naatp")) return CATALOG_BY_KEY.get("naatp") ?? null;
  if (key.startsWith("dhcs")) return CATALOG_BY_KEY.get("dhcs") ?? null;
  if (key === "florida dcf" || key === "dcf licensed" || key === "dcf") {
    return CATALOG_BY_KEY.get("dcf") ?? null;
  }
  if (key.includes("national alliance of recovery residences") || key === "narr") {
    return CATALOG_BY_KEY.get("narr") ?? null;
  }
  if (key === "state licensed" || key === "state-licensed") {
    return CATALOG_BY_KEY.get("state licensed") ?? null;
  }
  if (key.startsWith("psych armor")) return CATALOG_BY_KEY.get("psych armor") ?? null;
  return null;
}

export function accreditationKey(value: string): string {
  return resolveAccreditationBody(value)?.slug ?? normalizeAccreditationKey(value);
}

export function accreditationDisplayLabel(value: string): string {
  return resolveAccreditationBody(value)?.canonicalName ?? value.trim();
}

/**
 * Drop blanks and alias duplicates. Keeps the first original imported string.
 * Does not rewrite stored text to a canonical label.
 */
export function uniqueAccreditations(items: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items ?? []) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = accreditationKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Public/search display: one canonical label per resolved body. */
export function displayAccreditations(items: string[] | null | undefined): string[] {
  return uniqueAccreditations(items).map(accreditationDisplayLabel);
}

const LEVEL_OF_CARE_ACCREDITATION = /^(asam(?:\s+\d+(\.\d+)?)?|loc\s+\d)/i;

export function accreditationReviewReason(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (resolveAccreditationBody(trimmed)) return null;
  if (LEVEL_OF_CARE_ACCREDITATION.test(trimmed)) {
    return "Looks like a level of care, not an accreditation";
  }
  if (/^\d+\s+(licenses|licenses & certifications|licenses and certifications)/i.test(trimmed)) {
    return "Count of licenses, not a named body";
  }
  if (/psychology today/i.test(trimmed)) return "Directory listing, not an accreditation";
  return "No canonical match";
}

export function isUncertainAccreditationLabel(value: string): boolean {
  return accreditationReviewReason(value) !== null;
}
