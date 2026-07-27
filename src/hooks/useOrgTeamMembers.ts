import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OrgTeamMember {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  role_at_org: string;
}

/** Load organization members with profile contact details for BD assignment. */
export function useOrgTeamMembers(organizationId: string | null | undefined) {
  const [members, setMembers] = useState<OrgTeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: mems } = await supabase
        .from("organization_members")
        .select("user_id,role_at_org")
        .eq("organization_id", organizationId);
      const list = (mems as { user_id: string; role_at_org: string }[]) ?? [];
      if (cancelled) return;
      if (!list.length) {
        setMembers([]);
        setLoading(false);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,full_name,email,phone,job_title,avatar_url")
        .in(
          "user_id",
          list.map((m) => m.user_id),
        );
      if (cancelled) return;
      const roleByUser = new Map(list.map((m) => [m.user_id, m.role_at_org]));
      const next: OrgTeamMember[] = ((profs as {
        user_id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        job_title: string | null;
        avatar_url: string | null;
      }[]) ?? [])
        .filter((p) => p.full_name?.trim())
        .map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name!.trim(),
          email: p.email,
          phone: p.phone,
          job_title: p.job_title,
          avatar_url: p.avatar_url,
          role_at_org: roleByUser.get(p.user_id) ?? "bd_rep",
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
      setMembers(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { members, loading };
}
