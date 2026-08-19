import {
  CONDITION_OPTIONS,
  HIGHLIGHT_OPTIONS,
  POPULATION_OPTIONS,
  THERAPY_OPTIONS,
} from "@/components/app/facility/facility-types";

export type ProgramTagKind = "conditions" | "therapies" | "whoWeTreat" | "amenities";

export type ProgramTagBuckets = Record<ProgramTagKind, string[]>;

export const PROGRAM_SECTIONS: { kind: ProgramTagKind; title: string }[] = [
  { kind: "conditions", title: "Conditions we treat" },
  { kind: "therapies", title: "Therapies" },
  { kind: "whoWeTreat", title: "Who we treat" },
  { kind: "amenities", title: "Amenities" },
];

export const PROGRAM_OPTIONS: Record<ProgramTagKind, readonly string[]> = {
  conditions: CONDITION_OPTIONS,
  therapies: THERAPY_OPTIONS,
  whoWeTreat: POPULATION_OPTIONS,
  amenities: HIGHLIGHT_OPTIONS,
};

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()/,]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIASES: Record<string, string> = {
  adults: "Adults (18+)",
  "holistic approach": "Holistic Therapies",
  "borderline personality disorder": "BPD",
  "borderline": "BPD",
  "bipolar disorder": "Bipolar",
  "post traumatic stress disorder": "PTSD",
  "obsessive compulsive disorder": "OCD",
  "substance use disorder": "Substance Use",
  "substance abuse": "Substance Use",
  "co occurring": "Co-Occurring Disorders",
  "co-occurring": "Co-Occurring Disorders",
  "dual diagnosis": "Dual Diagnosis",
  "eating disorder": "Eating Disorders",
};

type CatalogEntry = { kind: ProgramTagKind; label: string };

function catalog(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();
  const add = (kind: ProgramTagKind, label: string) => {
    map.set(norm(label), { kind, label });
  };
  CONDITION_OPTIONS.forEach((label) => add("conditions", label));
  THERAPY_OPTIONS.forEach((label) => add("therapies", label));
  POPULATION_OPTIONS.forEach((label) => add("whoWeTreat", label));
  HIGHLIGHT_OPTIONS.forEach((label) => add("amenities", label));
  for (const [alias, label] of Object.entries(ALIASES)) {
    const entry = map.get(norm(label));
    if (entry) map.set(norm(alias), entry);
  }
  return map;
}

const CATALOG = catalog();

export const emptyProgramTagBuckets = (): ProgramTagBuckets => ({
  conditions: [],
  therapies: [],
  whoWeTreat: [],
  amenities: [],
});

/** Split stored facility arrays into the four public/settings groups. */
export function categorizeFacilityTags(facility: {
  highlights?: string[] | null;
  quick_highlights?: string[] | null;
  specializations?: string[] | null;
  population_served?: string[] | null;
}): ProgramTagBuckets {
  const buckets = emptyProgramTagBuckets();
  const seen = new Set<string>();

  const sources: { items: string[] | null | undefined; fallback: ProgramTagKind }[] = [
    { items: facility.quick_highlights, fallback: "amenities" },
    { items: facility.highlights, fallback: "amenities" },
    { items: facility.specializations, fallback: "therapies" },
    { items: facility.population_served, fallback: "whoWeTreat" },
  ];

  for (const { items, fallback } of sources) {
    for (const raw of items ?? []) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const found = CATALOG.get(norm(trimmed));
      const kind = found?.kind ?? fallback;
      const label = found?.label ?? trimmed;
      const key = norm(label);
      if (seen.has(key)) continue;
      seen.add(key);
      buckets[kind].push(label);
    }
  }

  return buckets;
}

export function persistProgramTags(buckets: ProgramTagBuckets): {
  highlights: string[];
  population_served: string[];
  specializations: string[];
} {
  return {
    highlights: buckets.amenities,
    population_served: buckets.whoWeTreat,
    specializations: [...buckets.therapies, ...buckets.conditions],
  };
}

function canonicalKey(item: string): string {
  const found = CATALOG.get(norm(item));
  return norm(found?.label ?? item);
}

export function hasProgramTag(list: string[], item: string): boolean {
  const target = canonicalKey(item);
  return list.some((x) => canonicalKey(x) === target);
}

export function extraProgramTags(selected: string[], options: readonly string[]): string[] {
  const optionKeys = new Set(options.map((opt) => canonicalKey(opt)));
  return selected.filter((item) => !optionKeys.has(canonicalKey(item)));
}

export function toggleProgramTag(list: string[], item: string): string[] {
  const found = CATALOG.get(norm(item));
  const label = found?.label ?? item.trim();
  if (hasProgramTag(list, label)) {
    const target = canonicalKey(label);
    return list.filter((x) => canonicalKey(x) !== target);
  }
  return [...list, label];
}
