import { supabase } from "@/integrations/supabase/client";
import { asPublicReferralContacts, type PublicReferralContact } from "@/lib/professional-network";

export async function loadPublicReferralContacts(
  organizationId: string,
  facilityId?: string | null,
): Promise<PublicReferralContact[]> {
  const { data, error } = await supabase.rpc("get_public_referral_contacts", {
    _organization_id: organizationId,
    _facility_id: facilityId || undefined,
  });
  if (error) return [];
  return asPublicReferralContacts(data);
}
