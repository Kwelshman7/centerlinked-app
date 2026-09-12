/**
 * Map payers (from payers table) to insurers (from plan-type catalog).
 *
 * This bridges the existing payer-matching logic with the new
 * per-insurer plan-type catalog. Facilities contract with payers;
 * plan types are scoped to insurers.
 */

import { normalizePayerName } from "./match-payer";
import { getInsurerById, getAllInsurers, type Insurer } from "./insurance-plan-types-catalog";

/**
 * Known payer name → insurer_id mappings.
 * Extend this as payers are seeded and matched to catalog.
 */
const PAYER_TO_INSURER_MAP: Record<string, string> = {
  // National carriers
  unitedhealthcare: "uhc",
  "united healthcare": "uhc",
  uhc: "uhc",
  "optum behavioral health": "optum_bh",
  "united behavioral health": "optum_bh",
  aetna: "aetna",
  "aetna cvs health": "aetna",
  cigna: "cigna",
  "cigna healthcare": "cigna",
  "evernorth behavioral health": "evernorth_bh",
  "cigna behavioral": "evernorth_bh",
  humana: "humana",
  "kaiser permanente": "kaiser",
  kaiser: "kaiser",

  // Centene family
  centene: "centene",
  "centene corporation": "centene",
  ambetter: "ambetter",
  "ambetter from centene": "ambetter",
  wellcare: "wellcare",
  "health net": "health_net",
  "molina healthcare": "molina",
  molina: "molina",

  // Anthem / Elevance
  anthem: "anthem_elevance",
  elevance: "anthem_elevance",
  "anthem blue cross": "anthem_elevance",
  "anthem bcbs": "anthem_elevance",
  "empire bcbs": "anthem_elevance",
  "carelon behavioral health": "carelon_bh",
  "beacon health options": "carelon_bh",
  beacon: "carelon_bh",
  carelon: "carelon_bh",

  // MBHOs
  "magellan healthcare": "magellan",
  "magellan health": "magellan",
  magellan: "magellan",

  // Federal
  tricare: "tricare",
  "humana military": "tricare",
  triwest: "tricare",
  "va community care network": "va_ccn",
  "va ccn": "va_ccn",
  "veterans community care": "va_ccn",

  // Blues - major licensees
  "health care service corporation": "hcsc",
  hcsc: "hcsc",
  "bcbs illinois": "hcsc",
  "bcbs texas": "hcsc",
  "highmark blue cross blue shield": "highmark",
  highmark: "highmark",
  "carefirst bluecross blueshield": "carefirst",
  carefirst: "carefirst",
  "florida blue": "florida_blue",
  "blue shield of california": "blue_shield_ca",
  "blue shield ca": "blue_shield_ca",
  "independence blue cross": "independence_bc",
  "premera blue cross": "premera",
  premera: "premera",
  regence: "regence",
  "blue cross blue shield of michigan": "bcbs_mi",
  "bcbs michigan": "bcbs_mi",
  "blue cross blue shield of massachusetts": "bcbs_ma",
  "bcbs massachusetts": "bcbs_ma",
  "horizon blue cross blue shield of new jersey": "horizon_nj",
  horizon: "horizon_nj",
  "blue cross blue shield of north carolina": "bcbs_nc",
  "bcbs north carolina": "bcbs_nc",
  "bluecross blueshield of tennessee": "bcbs_tn",
  "bcbs tennessee": "bcbs_tn",
  "blue cross blue shield of alabama": "bcbs_al",
  "bcbs alabama": "bcbs_al",

  // Medicare-focused
  healthspring: "healthspring",
  "scan health plan": "scan",
  scan: "scan",
  "alignment health": "alignment",
  "devoted health": "devoted",
  devoted: "devoted",

  // Original Medicare
  medicare: "original_medicare",
  "medicare ffs": "original_medicare",
  "original medicare": "original_medicare",

  // Generic Blues catch-all handled separately
};

/**
 * Resolve a payer name to an insurer_id from the catalog.
 * Returns the insurer_id if matched, or null if no match.
 */
export function payerNameToInsurerId(payerName: string): string | null {
  const norm = normalizePayerName(payerName);
  if (!norm) return null;

  // Check direct mapping
  const mapped = PAYER_TO_INSURER_MAP[norm];
  if (mapped) return mapped;

  // Check if it's a Blues variant → use catch-all
  if (
    norm.includes("blue cross") ||
    norm.includes("blue shield") ||
    norm.includes("bcbs") ||
    norm === "the blues"
  ) {
    return "bcbs_other_local";
  }

  // Check aliases in catalog
  const insurers = getAllInsurers();
  for (const insurer of insurers) {
    for (const alias of insurer.aliases) {
      if (normalizePayerName(alias) === norm) {
        return insurer.insurer_id;
      }
    }
  }

  return null;
}

/**
 * Get the insurer for a payer name.
 */
export function getInsurerByPayerName(payerName: string): Insurer | null {
  const insurerId = payerNameToInsurerId(payerName);
  return insurerId ? getInsurerById(insurerId) : null;
}

/**
 * Check if a payer name maps to a known insurer in the catalog.
 */
export function isPayerInCatalog(payerName: string): boolean {
  return payerNameToInsurerId(payerName) !== null;
}
