import type { FacilityContractDraft, FacilityDraft } from "../components/app/facility/facility-types.ts";
import { emptyFacility } from "../components/app/facility/facility-types.ts";
import { buildFacilityContractDrafts, normalizePayerName } from "./match-payer.ts";
import type { PayerMatchInput } from "./match-payer.ts";
import { sanitizePlanTypes } from "./plan-types.ts";
import { importGaps } from "./data-quality.ts";

export { importGaps };

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
  self_pay_only?: boolean | null;
}

export interface ExistingContractRow {
  facility_id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
  plan_types?: string[] | null;
  contract_status?: string | null;
  original_imported_value?: string | null;
  verified_at?: string | null;
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
    contract_status: row.contract_status ?? null,
    original_imported_value: row.original_imported_value ?? null,
    verified_at: row.verified_at ?? null,
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
    contract_status: c.contract_status ?? null,
    original_imported_value: c.original_imported_value ?? null,
    verified_at: c.verified_at ?? null,
  }));

  for (const next of extracted) {
    if (!next.payer_name.trim()) continue;
    if (merged.some((row) => samePayer(row, next))) continue;
    merged.push({
      payer_id: next.payer_id,
      payer_name: next.payer_name.trim(),
      in_network: !!next.in_network,
      plan_types: sanitizePlanTypes(next.plan_types),
      contract_status: next.contract_status ?? null,
      original_imported_value: next.original_imported_value ?? next.payer_name.trim(),
      verified_at: next.verified_at ?? null,
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

function draftFromImportedName(
  raw: string,
  inNetwork: boolean,
  payers: PayerMatchInput[],
): FacilityContractDraft | null {
  const original = raw.trim();
  if (!original) return null;
  const [base] = buildFacilityContractDrafts([original], inNetwork, payers);
  if (!base) return null;
  return {
    ...base,
    contract_status: inNetwork ? "active" : "out_of_network",
    original_imported_value: original,
    verified_at: null,
  };
}

export function parsedFacilityContractDrafts(
  facility: ParsedFacility,
  payers: PayerMatchInput[],
): FacilityContractDraft[] {
  const drafts: FacilityContractDraft[] = [];
  const inNetworkNames = facility.payers_in_network ?? [];
  const seenInNetwork = new Set(
    inNetworkNames.map((raw) => normalizePayerName(raw)).filter(Boolean),
  );

  for (const raw of inNetworkNames) {
    const draft = draftFromImportedName(raw, true, payers);
    if (draft) drafts.push(draft);
  }
  for (const raw of facility.payers_out_of_network ?? []) {
    if (seenInNetwork.has(normalizePayerName(raw))) continue;
    const draft = draftFromImportedName(raw, false, payers);
    if (draft) drafts.push(draft);
  }
  return drafts;
}

function photoPlaceholders(count: number): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => `assigned-${i + 1}`);
}

/** Gaps that will remain after this import if the user does not fill them. */
export function reviewImportGaps(args: {
  parsed: ParsedFacility;
  extractedContracts: FacilityContractDraft[];
  assignedPhotoCount: number;
  existing?: ExistingFacilityRow | null;
  existingContracts?: FacilityContractDraft[];
}): string[] {
  if (args.existing) {
    const merged = mergeContractDrafts(args.existingContracts ?? [], args.extractedContracts);
    const images = [...(args.existing.image_urls ?? []), ...photoPlaceholders(args.assignedPhotoCount)];
    return importGaps({
      address_line1: args.existing.address_line1,
      city: args.existing.city,
      state: args.existing.state,
      zip: args.existing.zip,
      phone: args.existing.phone,
      website: args.existing.website,
      image_urls: images,
      bd_contact_name: args.existing.bd_contact_name,
      bd_contact_phone: args.existing.bd_contact_phone,
      bd_contact_email: args.existing.bd_contact_email,
      self_pay_only: args.existing.self_pay_only,
      contract_count: merged.length,
    });
  }

  return importGaps({
    address_line1: args.parsed.address_line1,
    city: args.parsed.city,
    state: args.parsed.state,
    zip: args.parsed.zip,
    phone: args.parsed.phone,
    website: args.parsed.website,
    image_urls: photoPlaceholders(args.assignedPhotoCount),
    bd_contact_name: args.parsed.bd_contact_name,
    bd_contact_phone: args.parsed.bd_contact_phone,
    bd_contact_email: args.parsed.bd_contact_email,
    contract_count: args.extractedContracts.length,
  });
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
