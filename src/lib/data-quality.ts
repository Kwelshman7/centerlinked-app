import { hasAssignedBdContact } from "./bd-contact.ts";
import { locationGaps, type LocationFields } from "./location-quality.ts";

export const COMPLETENESS_CHECKS = [
  { key: "street", label: "Street address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "US ZIP" },
  { key: "phone", label: "Facility phone" },
  { key: "website", label: "Website" },
  { key: "gallery", label: "At least one photo" },
  { key: "bd", label: "BD name plus a direct phone or email" },
  { key: "insurance", label: "Structured insurance row, or marked self-pay only" },
] as const;

export type CompletenessKey = (typeof COMPLETENESS_CHECKS)[number]["key"];

export interface CompletenessInput extends LocationFields {
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  self_pay_only?: boolean | null;
  contract_count?: number;
}

export function completenessResult(input: CompletenessInput) {
  const loc = new Set(locationGaps(input));
  const missing: CompletenessKey[] = [];
  if (loc.has("street")) missing.push("street");
  if (loc.has("city")) missing.push("city");
  if (loc.has("state")) missing.push("state");
  if (loc.has("zip")) missing.push("zip");
  if (loc.has("phone")) missing.push("phone");
  if (loc.has("website")) missing.push("website");
  if (loc.has("gallery")) missing.push("gallery");
  if (!hasAssignedBdContact(input)) missing.push("bd");
  if (!input.self_pay_only && (input.contract_count ?? 0) === 0) missing.push("insurance");

  const max = COMPLETENESS_CHECKS.length;
  return {
    missing,
    passed: COMPLETENESS_CHECKS.filter((check) => !missing.includes(check.key)).map((check) => check.key),
    score: max - missing.length,
    max,
    percent: Math.round(((max - missing.length) / max) * 100),
  };
}

export function importGaps(input: CompletenessInput): string[] {
  const result = completenessResult(input);
  return result.missing.map(
    (key) => COMPLETENESS_CHECKS.find((check) => check.key === key)?.label ?? key,
  );
}

export function coverageShare(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}
