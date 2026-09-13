import { supabase } from "@/integrations/supabase/client";
import { verificationEventPayload, type VerificationAction, type VerificationEntityType } from "@/lib/verification-events";

export async function recordVerificationEvent(input: {
  facilityId: string;
  entityType: VerificationEntityType;
  action: VerificationAction;
  entityId?: string | null;
  method?: string | null;
  notes?: string | null;
  actorId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = verificationEventPayload(input);
  if (!payload.ok) return payload;
  const { error } = await supabase.from("verification_events").insert(payload.row);
  return error ? { ok: false, error: error.message } : { ok: true };
}
