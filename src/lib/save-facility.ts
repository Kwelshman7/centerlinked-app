import { supabase } from "@/integrations/supabase/client";
import type { FacilityContractDraft, FacilityDraft } from "@/components/app/facility/facility-types";

export type ContractsMode = "all" | "in_network" | "none";

function draftToFacilityPayload(
  draft: Pick<
    FacilityDraft,
    | "name"
    | "tagline"
    | "address_line1"
    | "city"
    | "state"
    | "zip"
    | "phone"
    | "website"
    | "description"
    | "capacity"
    | "levels_of_care"
    | "highlights"
    | "population_served"
    | "specializations"
    | "accreditations"
    | "image_urls"
    | "bd_contact_name"
    | "bd_contact_phone"
    | "bd_contact_email"
    | "hidden_from_org_page"
  >,
  options?: { includeHidden?: boolean },
) {
  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    tagline: draft.tagline || null,
    address_line1: draft.address_line1 || null,
    city: draft.city || null,
    state: draft.state || null,
    zip: draft.zip || null,
    phone: draft.phone || null,
    website: draft.website || null,
    description: draft.description || null,
    capacity: draft.capacity ? Number(draft.capacity) || null : null,
    levels_of_care: draft.levels_of_care ?? [],
    highlights: draft.highlights ?? [],
    population_served: draft.population_served ?? [],
    specializations: draft.specializations ?? [],
    accreditations: draft.accreditations ?? [],
    image_urls: draft.image_urls ?? [],
    bd_contact_name: draft.bd_contact_name || null,
    bd_contact_phone: draft.bd_contact_phone || null,
    bd_contact_email: draft.bd_contact_email || null,
  };

  if (options?.includeHidden) {
    payload.hidden_from_org_page = !!draft.hidden_from_org_page;
  }

  return payload;
}

function contractsPayload(contracts: FacilityContractDraft[]) {
  return contracts
    .filter((c) => c.payer_name.trim())
    .map((c) => ({
      payer_id: c.payer_id,
      payer_name: c.payer_name.trim(),
      in_network: !!c.in_network,
    }));
}

export async function saveFacilityWithContracts(args: {
  organizationId: string;
  facilityId?: string | null;
  draft: FacilityDraft;
  includeHidden?: boolean;
  contractsMode?: ContractsMode;
}): Promise<{ ok: true; facilityId: string; slug: string | null } | { ok: false; error: string }> {
  const { organizationId, facilityId, draft, includeHidden, contractsMode = "all" } = args;

  if (!draft.name.trim()) {
    return { ok: false, error: "Facility name is required" };
  }

  const { data, error } = await supabase.rpc("save_facility_with_contracts", {
    _organization_id: organizationId,
    _facility_id: facilityId ?? null,
    _facility: draftToFacilityPayload(draft, { includeHidden }),
    _contracts: contractsPayload(draft.contracts),
    _contracts_mode: contractsMode,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const id = String(data);
  const { data: row } = await supabase.from("facilities").select("slug").eq("id", id).maybeSingle();
  return { ok: true, facilityId: id, slug: row?.slug ?? null };
}

export async function replaceInNetworkContracts(args: {
  organizationId: string;
  facilityId: string;
  /** Current facility fields required by the RPC (name at minimum). */
  facilityName: string;
  contracts: FacilityContractDraft[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: facility, error: loadError } = await supabase
    .from("facilities")
    .select(
      "name,tagline,address_line1,city,state,zip,phone,website,description,capacity,levels_of_care,highlights,population_served,specializations,accreditations,image_urls,bd_contact_name,bd_contact_phone,bd_contact_email,hidden_from_org_page",
    )
    .eq("id", args.facilityId)
    .maybeSingle();

  if (loadError || !facility) {
    return { ok: false, error: loadError?.message || "Facility not found" };
  }

  const draft: FacilityDraft = {
    name: facility.name || args.facilityName,
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
    population_served: facility.population_served ?? [],
    specializations: facility.specializations ?? [],
    accreditations: facility.accreditations ?? [],
    custom_highlight: "",
    image_urls: facility.image_urls ?? [],
    bd_contact_name: facility.bd_contact_name ?? "",
    bd_contact_phone: facility.bd_contact_phone ?? "",
    bd_contact_email: facility.bd_contact_email ?? "",
    hidden_from_org_page: !!facility.hidden_from_org_page,
    contracts: args.contracts,
  };

  const result = await saveFacilityWithContracts({
    organizationId: args.organizationId,
    facilityId: args.facilityId,
    draft,
    contractsMode: "in_network",
  });

  return result.ok ? { ok: true } : result;
}
