import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Check, X, Mail } from "lucide-react";

interface Request {
  id: string; full_name: string; email: string; organization: string; role: string | null;
  num_facilities: number | null; notes: string | null; status: string; created_at: string;
}

export default function AccessRequests() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("early_access_requests").select("*").order("created_at", { ascending: false });
    setRequests((data as Request[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin]);

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const setStatus = async (id: string, status: "approved" | "denied") => {
    const { error } = await supabase.from("early_access_requests")
      .update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Access requests</h1>
        <p className="text-sm text-muted-foreground">Review and approve inbound membership requests.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
       requests.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No requests yet.</Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{r.full_name}</h3>
                    <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>
                      {r.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {r.organization} {r.role && <>· {r.role}</>} {r.num_facilities && <>· {r.num_facilities} facilities</>}
                  </p>
                  <a href={`mailto:${r.email}`} className="text-sm text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {r.email}
                  </a>
                  {r.notes && <p className="text-sm mt-2 p-3 bg-muted rounded-lg">{r.notes}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "denied")}>
                      <X className="h-4 w-4" /> Deny
                    </Button>
                    <Button size="sm" onClick={() => setStatus(r.id, "approved")}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: after approving, send the rep a direct invite from <strong>Members → Invite</strong> on their org's page, or share the signup link.
      </p>
    </div>
  );
}
