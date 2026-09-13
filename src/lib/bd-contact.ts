export interface BdContactFields {
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  bd_contact_title?: string | null;
  bd_contact_verified_at?: string | null;
}

export function hasAssignedBdContact(contact: BdContactFields | null | undefined): boolean {
  const name = contact?.bd_contact_name?.trim();
  if (!name) return false;
  return !!(contact?.bd_contact_email?.trim() || contact?.bd_contact_phone?.trim());
}

export function isBdContactVerified(contact: BdContactFields | null | undefined): boolean {
  return hasAssignedBdContact(contact) && !!contact?.bd_contact_verified_at?.trim();
}

export function bdContactStatusLabel(contact: BdContactFields | null | undefined): string {
  if (!contact?.bd_contact_name?.trim()) return "No BD representative assigned";
  if (!hasAssignedBdContact(contact)) return "BD name only — add a direct phone or email";
  if (!isBdContactVerified(contact)) return "Contact not yet verified";
  return "Verified BD contact";
}

export function normalizeBdEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return email;
}
