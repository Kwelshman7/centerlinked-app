import { supabase } from "@/integrations/supabase/client";
import type { OrgSheetData } from "@/components/public/OrganizationSheetView";
import type { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import {
  isMissingOptionalOrgColumn,
  orgProgramSelect,
  orgProgramSelectFallback,
  orgSheetSelect,
  orgSheetSelectFallback,
} from "@/lib/org-public-select";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseWhyRefer(raw: unknown): { title: string; body: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is { title: string; body: string } =>
      !!x && typeof x === "object" && "title" in x && "body" in x,
  );
}

function isMissingRpc(error: { message?: string; code?: string } | null) {
  if (!error?.message && !error?.code) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    (msg.includes("function") && msg.includes("does not exist"))
  );
}

export interface PublicOrgSheetPayload {
  org: OrgSheetData;
  facilities: ShowcaseFacility[];
  contracts: { facility_id: string; payer_name: string; in_network: boolean }[];
}

export interface PublicProgramSheetPayload {
  facility: FacilitySheetData & {
    organization_id: string;
    verification_status: string;
    verification_frozen?: boolean;
    phone?: string | null;
    website?: string | null;
    capacity?: number | null;
    highlights?: string[];
    accreditations?: string[];
    contracts_verified_at?: string | null;
  };
  org: (SheetOrg & {
    cover_image_url?: string | null;
    verified?: boolean | null;
    updated_at?: string | null;
    favicon_url?: string | null;
  }) | null;
  contracts: (SheetContract & { payer_id?: string | null })[];
}

export async function fetchPublicOrgSheet(slug: string): Promise<PublicOrgSheetPayload | null> {
  const { data, error } = await supabase.rpc("get_public_org_sheet", { _slug: slug });
  if (error && isMissingRpc(error)) return fetchPublicOrgSheetLegacy(slug);
  if (error || data == null) return null;
  const root = asRecord(data);
  const orgRow = asRecord(root?.org);
  if (!orgRow?.id || !orgRow.name) return null;

  const org: OrgSheetData = {
    id: String(orgRow.id),
    name: String(orgRow.name),
    slug: asString(orgRow.slug),
    logo_url: asString(orgRow.logo_url),
    favicon_url: asString(orgRow.favicon_url),
    footer_image_url: asString(orgRow.footer_image_url),
    social_facebook_url: asString(orgRow.social_facebook_url),
    social_instagram_url: asString(orgRow.social_instagram_url),
    social_linkedin_url: asString(orgRow.social_linkedin_url),
    social_x_url: asString(orgRow.social_x_url),
    description: asString(orgRow.description),
    tagline: asString(orgRow.tagline),
    website: asString(orgRow.website),
    hq_city: asString(orgRow.hq_city),
    hq_state: asString(orgRow.hq_state),
    bd_contact_name: asString(orgRow.bd_contact_name),
    bd_contact_phone: asString(orgRow.bd_contact_phone),
    bd_contact_email: asString(orgRow.bd_contact_email),
    brand_color: asString(orgRow.brand_color),
    accent_color: asString(orgRow.accent_color),
    cover_image_url: asString(orgRow.cover_image_url),
    image_urls: asStringArray(orgRow.image_urls),
    verified: orgRow.verified === true,
    created_at: asString(orgRow.created_at),
    updated_at: asString(orgRow.updated_at),
    program_badges: asStringArray(orgRow.program_badges),
    announcement: asString(orgRow.announcement),
    why_refer: parseWhyRefer(orgRow.why_refer),
  };

  const facilities = (Array.isArray(root?.facilities) ? root.facilities : [])
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => !!row?.id && !!row.name)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: asString(row.slug),
      city: asString(row.city),
      state: asString(row.state),
      address_line1: asString(row.address_line1),
      zip: asString(row.zip),
      image_urls: asStringArray(row.image_urls),
      levels_of_care: asStringArray(row.levels_of_care),
      population_served: asStringArray(row.population_served),
      specializations: asStringArray(row.specializations),
      highlights: asStringArray(row.highlights),
      accreditations: asStringArray(row.accreditations),
      short_description: asString(row.short_description),
      description: asString(row.description),
      tagline: asString(row.tagline),
      insurance_status: asString(row.insurance_status),
      featured_payer: asString(row.featured_payer),
      updated_at: asString(row.updated_at),
      contracts_verified_at: asString(row.contracts_verified_at),
      hidden_from_org_page: row.hidden_from_org_page === true,
    }));

  const contracts = (Array.isArray(root?.contracts) ? root.contracts : [])
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => !!row?.facility_id)
    .map((row) => ({
      facility_id: String(row.facility_id),
      payer_name: asString(row.payer_name) ?? "",
      in_network: row.in_network !== false,
    }));

  return { org, facilities, contracts };
}

export async function fetchPublicProgramSheet(
  slug: string,
  orgSlug?: string | null,
): Promise<PublicProgramSheetPayload | null> {
  const { data, error } = await supabase.rpc("get_public_program_sheet", {
    _slug: slug,
    _org_slug: orgSlug ?? undefined,
  });
  if (error && isMissingRpc(error)) return fetchPublicProgramSheetLegacy(slug);
  if (error || data == null) return null;
  const root = asRecord(data);
  const facRow = asRecord(root?.facility);
  if (!facRow?.id || !facRow.name || !facRow.organization_id) return null;

  const orgRow = asRecord(root?.org);
  const org = orgRow?.id
    ? {
        id: String(orgRow.id),
        name: String(orgRow.name ?? ""),
        slug: asString(orgRow.slug),
        logo_url: asString(orgRow.logo_url),
        favicon_url: asString(orgRow.favicon_url),
        footer_image_url: asString(orgRow.footer_image_url),
        social_facebook_url: asString(orgRow.social_facebook_url),
        social_instagram_url: asString(orgRow.social_instagram_url),
        social_linkedin_url: asString(orgRow.social_linkedin_url),
        social_x_url: asString(orgRow.social_x_url),
        bd_contact_name: asString(orgRow.bd_contact_name),
        bd_contact_phone: asString(orgRow.bd_contact_phone),
        bd_contact_email: asString(orgRow.bd_contact_email),
        website: asString(orgRow.website),
        tagline: asString(orgRow.tagline),
        brand_color: asString(orgRow.brand_color),
        accent_color: asString(orgRow.accent_color),
        cover_image_url: asString(orgRow.cover_image_url),
        verified: orgRow.verified === true,
        updated_at: asString(orgRow.updated_at),
      }
    : null;

  return {
    facility: {
      id: String(facRow.id),
      organization_id: String(facRow.organization_id),
      name: String(facRow.name),
      slug: asString(facRow.slug),
      description: asString(facRow.description),
      tagline: asString(facRow.tagline),
      short_description: asString(facRow.short_description),
      address_line1: asString(facRow.address_line1),
      city: asString(facRow.city),
      state: asString(facRow.state),
      zip: asString(facRow.zip),
      phone: asString(facRow.phone),
      website: asString(facRow.website),
      capacity: typeof facRow.capacity === "number" ? facRow.capacity : null,
      highlights: asStringArray(facRow.highlights),
      quick_highlights: asStringArray(facRow.quick_highlights),
      accreditations: asStringArray(facRow.accreditations),
      image_urls: asStringArray(facRow.image_urls),
      levels_of_care: asStringArray(facRow.levels_of_care),
      population_served: asStringArray(facRow.population_served),
      specializations: asStringArray(facRow.specializations),
      treatment_focus: asString(facRow.treatment_focus),
      insurance_status: asString(facRow.insurance_status),
      bd_contact_name: asString(facRow.bd_contact_name),
      bd_contact_phone: asString(facRow.bd_contact_phone),
      bd_contact_email: asString(facRow.bd_contact_email),
      verification_status: asString(facRow.verification_status) ?? "approved",
      verification_frozen: facRow.verification_frozen === true,
      created_at: asString(facRow.created_at),
      updated_at: asString(facRow.updated_at),
      contracts_verified_at: asString(facRow.contracts_verified_at),
    },
    org,
    contracts: (Array.isArray(root?.contracts) ? root.contracts : [])
      .map((row) => asRecord(row))
      .filter((row): row is Record<string, unknown> => !!row?.id)
      .map((row) => ({
        id: String(row.id),
        payer_id: row.payer_id == null ? null : String(row.payer_id),
        payer_name: asString(row.payer_name) ?? "",
        in_network: row.in_network !== false,
        payer_logo_url: null,
      })),
  };
}

async function fetchPublicOrgSheetLegacy(slug: string): Promise<PublicOrgSheetPayload | null> {
  const first = await supabase.from("organizations").select(orgSheetSelect).eq("slug", slug).maybeSingle();
  let o = first.data;
  if (first.error && isMissingOptionalOrgColumn(first.error)) {
    const fallback = await supabase.from("organizations").select(orgSheetSelectFallback).eq("slug", slug).maybeSingle();
    o = fallback.data;
  }
  if (!o) return null;
  const orgRow = o as Record<string, unknown>;
  const org: OrgSheetData = {
    ...(o as Omit<OrgSheetData, "program_badges" | "why_refer">),
    program_badges: asStringArray(orgRow.program_badges),
    why_refer: parseWhyRefer(orgRow.why_refer),
  };

  const { data: f } = await supabase
    .from("facilities")
    .select(
      "id,name,slug,city,state,address_line1,zip,image_urls,levels_of_care,population_served,specializations,highlights,accreditations,short_description,description,tagline,insurance_status,featured_payer,updated_at,contracts_verified_at,hidden_from_org_page,verification_frozen,verification_status",
    )
    .eq("organization_id", org.id)
    .eq("verification_status", "approved")
    .eq("hidden_from_org_page", false)
    .eq("verification_frozen", false)
    .order("name");

  const facilities = ((f as ShowcaseFacility[]) ?? []);
  const facilityIds = facilities.map((fac) => fac.id);
  if (facilityIds.length === 0) return { org, facilities, contracts: [] };

  const { data: contracts } = await supabase
    .from("insurance_contracts")
    .select("facility_id,payer_name,in_network")
    .in("facility_id", facilityIds)
    .eq("in_network", true);

  return {
    org,
    facilities,
    contracts: (contracts ?? []).map((row) => ({
      facility_id: row.facility_id,
      payer_name: row.payer_name ?? "",
      in_network: row.in_network !== false,
    })),
  };
}

async function fetchPublicProgramSheetLegacy(slug: string): Promise<PublicProgramSheetPayload | null> {
  const { data: f } = await supabase
    .from("facilities")
    .select(
      "id,organization_id,name,slug,description,tagline,short_description,address_line1,city,state,zip,phone,website,capacity,highlights,quick_highlights,accreditations,image_urls,levels_of_care,population_served,specializations,treatment_focus,insurance_status,bd_contact_name,bd_contact_phone,bd_contact_email,verification_status,verification_frozen,hidden_from_org_page,created_at,updated_at,contracts_verified_at",
    )
    .eq("slug", slug)
    .eq("verification_status", "approved")
    .maybeSingle();

  if (!f || f.verification_frozen) return null;

  const orgQuery = await supabase.from("organizations").select(orgProgramSelect).eq("id", f.organization_id).maybeSingle();
  let o = orgQuery.data;
  if (orgQuery.error && isMissingOptionalOrgColumn(orgQuery.error)) {
    const fallback = await supabase.from("organizations").select(orgProgramSelectFallback).eq("id", f.organization_id).maybeSingle();
    o = fallback.data;
  }

  const { data: c } = await supabase
    .from("insurance_contracts")
    .select("id,payer_id,payer_name,in_network")
    .eq("facility_id", f.id)
    .eq("in_network", true)
    .order("payer_name");

  return {
    facility: f as PublicProgramSheetPayload["facility"],
    org: (o as PublicProgramSheetPayload["org"]) ?? null,
    contracts: ((c as PublicProgramSheetPayload["contracts"]) ?? []).map((row) => ({
      ...row,
      payer_logo_url: null,
    })),
  };
}
