export const VERIFICATION_ENTITY_TYPES = [
  "facility",
  "insurance_contract",
  "bd_contact",
  "location",
] as const;

export const VERIFICATION_ACTIONS = [
  "confirmed",
  "updated",
  "recorded_unknown",
  "marked_self_pay",
  "assigned_contact",
  "verified_contact",
  "updated_location",
] as const;

export type VerificationEntityType = (typeof VERIFICATION_ENTITY_TYPES)[number];
export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number];

export const VERIFICATION_DISCLAIMER =
  "A CenterLinked verification records that directory data was reviewed. It does not confirm benefits, coverage, or admission eligibility.";

export function parseVerificationEntityType(value: string | null | undefined): VerificationEntityType | null {
  return VERIFICATION_ENTITY_TYPES.includes(value as VerificationEntityType)
    ? (value as VerificationEntityType)
    : null;
}

export function parseVerificationAction(value: string | null | undefined): VerificationAction | null {
  return VERIFICATION_ACTIONS.includes(value as VerificationAction)
    ? (value as VerificationAction)
    : null;
}

export function verificationEventPayload(input: {
  facilityId: string;
  entityType: VerificationEntityType;
  action: VerificationAction;
  entityId?: string | null;
  method?: string | null;
  notes?: string | null;
  actorId?: string | null;
}): { ok: true; row: {
  facility_id: string;
  entity_type: VerificationEntityType;
  entity_id: string | null;
  action: VerificationAction;
  method: string | null;
  notes: string | null;
  actor_id: string | null;
} } | { ok: false; error: string } {
  if (!parseVerificationEntityType(input.entityType) || !parseVerificationAction(input.action)) {
    return { ok: false, error: "Unknown verification event" };
  }
  if (!input.facilityId.trim()) return { ok: false, error: "Facility is required" };
  return {
    ok: true,
    row: {
      facility_id: input.facilityId,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      method: input.method?.trim() || null,
      notes: input.notes?.trim() || null,
      actor_id: input.actorId ?? null,
    },
  };
}
