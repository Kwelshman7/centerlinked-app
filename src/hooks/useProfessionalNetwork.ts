import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  asProfessionalCards,
  type ProfessionalCard,
} from "@/lib/professional-network";

export function useProfessionalNetwork() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ProfessionalCard[]>([]);
  const [requests, setRequests] = useState<ProfessionalCard[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setRequests([]);
      return;
    }
    setLoading(true);
    const [networkRes, requestRes] = await Promise.all([
      supabase.rpc("list_my_professional_network"),
      supabase.rpc("list_professional_connection_requests"),
    ]);
    setConnections(asProfessionalCards(networkRes.data));
    setRequests(asProfessionalCards(requestRes.data));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestConnection = async (userId: string) => {
    const { error } = await supabase.rpc("request_professional_connection", {
      _addressee_id: userId,
    });
    if (!error) await load();
    return { error: error?.message ?? null };
  };

  const respondToRequest = async (connectionId: string, accept: boolean) => {
    const { error } = await supabase.rpc("respond_to_professional_connection", {
      _connection_id: connectionId,
      _accept: accept,
    });
    if (!error) await load();
    return { error: error?.message ?? null };
  };

  const removeConnection = async (userId: string) => {
    const { error } = await supabase.rpc("remove_professional_connection", {
      _other_user_id: userId,
    });
    if (!error) await load();
    return { error: error?.message ?? null };
  };

  return {
    connections,
    requests,
    loading,
    reload: load,
    requestConnection,
    respondToRequest,
    removeConnection,
  };
}
