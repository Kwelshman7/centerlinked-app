import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PartnerOrg {
  id: string;
  rowId: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
}

export function useReferralNetwork() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const [partners, setPartners] = useState<PartnerOrg[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) { setPartners([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("referral_network")
      .select("id, partner:organizations!referral_network_partner_org_id_fkey(id,name,slug,logo_url,hq_city,hq_state,bd_contact_name,bd_contact_phone,bd_contact_email)")
      .eq("owner_org_id", orgId);
    const rows = (data ?? []) as Array<{ id: string; partner: Omit<PartnerOrg, "rowId"> | null }>;
    setPartners(
      rows
        .filter((r) => r.partner)
        .map((r) => ({ ...(r.partner as Omit<PartnerOrg, "rowId">), rowId: r.id }))
    );
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const addPartner = async (partnerOrgId: string) => {
    if (!orgId) return { error: "No organization" };
    const { error } = await supabase.from("referral_network").insert({
      owner_org_id: orgId,
      partner_org_id: partnerOrgId,
      status: "preferred",
    });
    if (!error) await load();
    return { error: error?.message ?? null };
  };

  const removePartner = async (rowId: string) => {
    const { error } = await supabase.from("referral_network").delete().eq("id", rowId);
    if (!error) await load();
    return { error: error?.message ?? null };
  };

  const partnerOrgIds = useMemo(() => new Set(partners.map((p) => p.id)), [partners]);

  return { partners, partnerOrgIds, loading, addPartner, removePartner, reload: load };
}
