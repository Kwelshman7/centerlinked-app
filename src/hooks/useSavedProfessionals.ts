import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSavedProfessionals() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_professionals")
      .select("target_user_id")
      .eq("user_id", user.id);
    if (error) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    setIds(new Set((data ?? []).map((row) => row.target_user_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const isSaved = useCallback((userId: string | null | undefined) => Boolean(userId && ids.has(userId)), [ids]);

  const toggle = async (targetUserId: string) => {
    if (!user || !targetUserId || targetUserId === user.id) {
      return { error: "You can only save another professional." };
    }
    setBusyId(targetUserId);
    const saved = ids.has(targetUserId);
    const { error } = saved
      ? await supabase.from("saved_professionals").delete().eq("user_id", user.id).eq("target_user_id", targetUserId)
      : await supabase.from("saved_professionals").insert({ user_id: user.id, target_user_id: targetUserId });
    setBusyId(null);
    if (error) return { error: error.message };
    setIds((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });
    return { error: null, saved: !saved };
  };

  return { ids, loading, busyId, isSaved, toggle, reload: load };
}
