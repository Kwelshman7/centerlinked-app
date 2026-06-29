import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the set of organization IDs the current user has exchanged messages with.
 * Used to surface "In your network" facilities and rank them higher in search.
 */
export function useNetworkedOrgIds() {
  const { user } = useAuth();
  const [orgIds, setOrgIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrgIds(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_networked_org_ids");
      if (cancelled) return;
      setOrgIds(new Set(((data as string[] | null) ?? [])));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { orgIds, loading };
}
