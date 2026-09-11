/**
 * Insurance plan-type catalog loader
 *
 * Canonical source: /data/insurance-plan-types-catalog.json
 * Product decisions: Blues major licensees + Other local catch-all, MBHOs separate,
 * VA CCN + TRICARE included, rental networks excluded, Medigap hidden from dropdowns.
 */

import catalogData from "@/../../data/insurance-plan-types-catalog.json";

export interface PlanType {
  id: string;
  label: string;
  lob: string;
  dropdown: boolean;
  network_style: string;
  notes?: string;
  aliases?: string[];
}

export interface Insurer {
  insurer_id: string;
  display_name: string;
  aliases: string[];
  category: string;
  contracting_notes: string;
  plan_types: PlanType[];
  parent?: string;
}

export interface CatalogMeta {
  as_of: string;
  medicaid_state_overlay_required: boolean;
  bcbs_local_plan_required: boolean;
  include_rental_networks: boolean;
  medigap_note: string;
  usage: string;
  filtered_for: string;
  medigap_in_dropdown: boolean;
  bcbs_mode: string;
  mbho_separate: boolean;
  include_va_ccn_tricare: boolean;
  medicaid_state_overlay_included: boolean;
  user_selections: string[];
  decided_defaults: string[];
}

export interface PlanTypeCatalog {
  version: string;
  meta: CatalogMeta;
  insurers: Insurer[];
}

// Type-safe catalog singleton
const catalog: PlanTypeCatalog = catalogData as PlanTypeCatalog;

/**
 * Get the complete plan-type catalog.
 */
export function getPlanTypeCatalog(): PlanTypeCatalog {
  return catalog;
}

/**
 * Get all insurers from the catalog.
 */
export function getAllInsurers(): Insurer[] {
  return catalog.insurers;
}

/**
 * Find an insurer by insurer_id.
 */
export function getInsurerById(insurerId: string): Insurer | null {
  return catalog.insurers.find((i) => i.insurer_id === insurerId) ?? null;
}

/**
 * Get plan types for a specific insurer (dropdown-eligible only by default).
 * Returns plan types where dropdown=true unless includeAll is true.
 */
export function getPlanTypesForInsurer(
  insurerId: string,
  includeAll = false,
): PlanType[] {
  const insurer = getInsurerById(insurerId);
  if (!insurer) return [];
  return includeAll
    ? insurer.plan_types
    : insurer.plan_types.filter((pt) => pt.dropdown);
}

/**
 * Get dropdown-eligible plan type IDs for a specific insurer.
 * Used to filter PlanTypeChecklist options per payer.
 */
export function getDropdownPlanTypeIds(insurerId: string): string[] {
  return getPlanTypesForInsurer(insurerId, false).map((pt) => pt.id);
}

/**
 * Find a plan type by ID across all insurers.
 */
export function getPlanTypeById(planTypeId: string): PlanType | null {
  for (const insurer of catalog.insurers) {
    const pt = insurer.plan_types.find((p) => p.id === planTypeId);
    if (pt) return pt;
  }
  return null;
}

/**
 * Map payer_id (from payers table) to insurer_id (catalog key).
 * This assumes payer names/aliases will be matched to catalog insurers.
 * For now, returns null — will be wired with payer→insurer mapping.
 */
export function payerIdToInsurerId(payerId: string | null): string | null {
  // TODO: Build mapping from payers table to catalog insurer_ids
  // For now, return null so UI falls back to full list
  return payerId ? null : null;
}

/**
 * Check if a plan type ID is valid in the catalog.
 */
export function isValidPlanTypeId(planTypeId: string): boolean {
  return getPlanTypeById(planTypeId) !== null;
}

/**
 * Sanitize plan types against the catalog for a specific insurer.
 * Keeps only valid plan type IDs that are dropdown-eligible for that insurer.
 * Falls back to global validation if insurerId is unknown.
 */
export function sanitizePlanTypesForInsurer(
  planTypes: unknown,
  insurerId: string | null,
): string[] {
  if (!Array.isArray(planTypes)) return [];

  const validIds = insurerId
    ? new Set(getDropdownPlanTypeIds(insurerId))
    : new Set(
        catalog.insurers.flatMap((i) =>
          i.plan_types.filter((pt) => pt.dropdown).map((pt) => pt.id),
        ),
      );

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of planTypes) {
    if (typeof item !== "string") continue;
    const id = item.trim().toLowerCase();
    if (!validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}
