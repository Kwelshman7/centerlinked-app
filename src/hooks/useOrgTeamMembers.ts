import { useEffect, useState } from "react";
import { toast } from "sonner";
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
      const { data: mems, error: memError } = await supabase
        .from("organization_members")
        .select("user_id,role_at_org")
        .eq("organization_id", organizationId);
      if (cancelled) return;
      if (memError) {
        toast.error("Couldn't load team members", { description: memError.message });
        setMembers([]);
        setLoading(false);
        return;
      }
      const list = (mems as { user_id: string; role_at_org: string }[]) ?? [];
      if (!list.length) {
        setMembers([]);
        setLoading(false);
        return;
      }
      const { data: profs, error: profError } = await supabase
        .from("profiles")
        .select("user_id,full_name,email,phone,job_title,avatar_url")
        .in(
          "user_id",
          list.map((m) => m.user_id),
        );
      if (cancelled) return;
      if (profError) {
        toast.error("Couldn't load team profiles", { description: profError.message });
      }
      const profByUser = new Map(
        ((profs as {
          user_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          avatar_url: string | null;
        }[]) ?? []).map((p) => [p.user_id, p]),
      );
      const next: OrgTeamMember[] = list
        .map((m) => {
          const p = profByUser.get(m.user_id);
          return {
            user_id: m.user_id,
            full_name: p?.full_name?.trim() || p?.email || "Team member",
            email: p?.email ?? null,
            phone: p?.phone ?? null,
            job_title: p?.job_title ?? null,
            avatar_url: p?.avatar_url ?? null,
            role_at_org: m.role_at_org || "bd_rep",
          };
        })
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
