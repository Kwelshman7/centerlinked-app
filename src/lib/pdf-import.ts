import type { FacilityContractDraft, FacilityDraft } from "@/components/app/facility/facility-types";
import { emptyFacility } from "@/components/app/facility/facility-types";
import { buildFacilityContractDrafts, normalizePayerName } from "@/lib/match-payer";
import type { PayerMatchInput } from "@/lib/match-payer";
import { sanitizePlanTypes } from "@/lib/plan-types";

export interface ParsedFacility {
  name: string;
  tagline?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  capacity?: number | null;
  levels_of_care?: string[];
  highlights?: string[];
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  payers_in_network?: string[];
  payers_out_of_network?: string[];
}

export interface ParsedPdfPayload {
  organization: {
    name: string;
    website?: string | null;
    description?: string | null;
    phone?: string | null;
    hq_city?: string | null;
    hq_state?: string | null;
  };
  facilities: ParsedFacility[];
}

export interface ExistingFacilityRow {
  id: string;
  name: string;
  tagline: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  capacity: number | null;
  levels_of_care: string[] | null;
  highlights: string[] | null;
  population_served: string[] | null;
  specializations: string[] | null;
  accreditations: string[] | null;
  image_urls: string[] | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  hidden_from_org_page: boolean | null;
}

export interface ExistingContractRow {
  facility_id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
  plan_types?: string[] | null;
}

/** Null = create a new facility. */
export type FacilityImportTarget = string | null;

function normalizeFacilityPart(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function facilityCommitKey(f: Pick<ParsedFacility, "name" | "city" | "address_line1">): string {
  return [f.name, f.city, f.address_line1]
    .map((part) => (part ?? "").trim().toLowerCase())
    .join("|");
}

/**
 * Suggest an existing facility to merge into.
 * Prefer unique name+city; if the name is unique in the org, match on name.
 */
export function matchParsedFacility(
  parsed: Pick<ParsedFacility, "name" | "city">,
  existing: Array<Pick<ExistingFacilityRow, "id" | "name" | "city">>,
): string | null {
  const name = normalizeFacilityPart(parsed.name);
  if (!name) return null;

  const city = normalizeFacilityPart(parsed.city);
  if (city) {
    const cityHits = existing.filter(
      (row) =>
        normalizeFacilityPart(row.name) === name && normalizeFacilityPart(row.city) === city,
    );
    if (cityHits.length === 1) return cityHits[0].id;
    if (cityHits.length > 1) return null;
  }

  const nameHits = existing.filter((row) => normalizeFacilityPart(row.name) === name);
  return nameHits.length === 1 ? nameHits[0].id : null;
}

export function suggestedImportTargets(
  parsed: ParsedFacility[],
  existing: Array<Pick<ExistingFacilityRow, "id" | "name" | "city">>,
): FacilityImportTarget[] {
  return parsed.map((facility) => matchParsedFacility(facility, existing));
}

function samePayer(a: FacilityContractDraft, b: FacilityContractDraft): boolean {
  if (a.payer_id && b.payer_id && a.payer_id === b.payer_id) return true;
  const left = normalizePayerName(a.payer_name);
  const right = normalizePayerName(b.payer_name);
  return !!left && left === right;
}

export function contractRowToDraft(row: ExistingContractRow): FacilityContractDraft {
  return {
    payer_id: row.payer_id,
    payer_name: row.payer_name,
    in_network: !!row.in_network,
    plan_types: sanitizePlanTypes(row.plan_types),
  };
}

/** Union extracted payers onto existing ones. Never drops an existing contract. */
export function mergeContractDrafts(
  existing: FacilityContractDraft[],
  extracted: FacilityContractDraft[],
): FacilityContractDraft[] {
  const merged = existing.map((c) => ({
    payer_id: c.payer_id,
    payer_name: c.payer_name,
    in_network: !!c.in_network,
    plan_types: sanitizePlanTypes(c.plan_types),
  }));

  for (const next of extracted) {
    if (!next.payer_name.trim()) continue;
    if (merged.some((row) => samePayer(row, next))) continue;
    merged.push({
      payer_id: next.payer_id,
      payer_name: next.payer_name.trim(),
      in_network: !!next.in_network,
      plan_types: sanitizePlanTypes(next.plan_types),
    });
  }

  return merged;
}

export function countNewContracts(
  existing: FacilityContractDraft[],
  extracted: FacilityContractDraft[],
): { newCount: number; alreadyCount: number } {
  let newCount = 0;
  let alreadyCount = 0;
  for (const next of extracted) {
    if (!next.payer_name.trim()) continue;
    if (existing.some((row) => samePayer(row, next))) alreadyCount += 1;
    else newCount += 1;
  }
  return { newCount, alreadyCount };
}

export function parsedFacilityContractDrafts(
  facility: ParsedFacility,
  payers: PayerMatchInput[],
): FacilityContractDraft[] {
  return [
    ...buildFacilityContractDrafts(facility.payers_in_network ?? [], true, payers),
    ...buildFacilityContractDrafts(facility.payers_out_of_network ?? [], false, payers),
  ];
}

/** Full draft so an update cannot wipe live facility fields. */
export function existingFacilityToDraft(
  row: ExistingFacilityRow,
  contracts: FacilityContractDraft[],
  extraImageUrls: string[] = [],
): FacilityDraft {
  const images = [...(row.image_urls ?? [])];
  for (const url of extraImageUrls) {
    if (url && !images.includes(url)) images.push(url);
  }

  return {
    ...emptyFacility(),
    name: row.name ?? "",
    tagline: row.tagline ?? "",
    address_line1: row.address_line1 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    description: row.description ?? "",
    capacity: row.capacity != null ? String(row.capacity) : "",
    levels_of_care: row.levels_of_care ?? [],
    highlights: row.highlights ?? [],
    population_served: row.population_served ?? [],
    specializations: row.specializations ?? [],
    accreditations: row.accreditations ?? [],
    image_urls: images,
    bd_contact_name: row.bd_contact_name ?? "",
    bd_contact_phone: row.bd_contact_phone ?? "",
    bd_contact_email: row.bd_contact_email ?? "",
    hidden_from_org_page: !!row.hidden_from_org_page,
    contracts,
  };
}

export function parsedFacilityToDraft(
  facility: ParsedFacility,
  contracts: FacilityContractDraft[],
  imageUrls: string[] = [],
): FacilityDraft {
  return {
    ...emptyFacility(),
    name: facility.name,
    tagline: facility.tagline ?? "",
    address_line1: facility.address_line1 ?? "",
    city: facility.city ?? "",
    state: facility.state ?? "",
    zip: facility.zip ?? "",
    phone: facility.phone ?? "",
    website: facility.website ?? "",
    description: facility.description ?? "",
    capacity: facility.capacity != null ? String(facility.capacity) : "",
    levels_of_care: facility.levels_of_care ?? [],
    highlights: facility.highlights ?? [],
    bd_contact_name: facility.bd_contact_name ?? "",
    bd_contact_phone: facility.bd_contact_phone ?? "",
    bd_contact_email: facility.bd_contact_email ?? "",
    image_urls: imageUrls,
    contracts,
  };
}
