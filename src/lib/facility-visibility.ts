/** Partner-facing facility visibility (Search, directories, public sheets). */

export type FacilityVisibilityFields = {
  verification_status?: string | null;
  verification_frozen?: boolean | null;
  hidden_from_org_page?: boolean | null;
};

export function isPartnerVisibleFacility(
  facility: FacilityVisibilityFields,
  options?: { honorHiddenFromOrgPage?: boolean },
): boolean {
  if (facility.verification_status !== "approved") return false;
  if (facility.verification_frozen) return false;
  if (options?.honorHiddenFromOrgPage && facility.hidden_from_org_page) return false;
  return true;
}
