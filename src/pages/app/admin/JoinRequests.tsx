import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Check, Clock, Loader2, Mail, X } from "lucide-react";
import { reviewJoinRequest } from "@/lib/org-setup";

type JoinRequestRow = {
  id: string;
  organization_id: string;
  organization_name: string;
  user_id: string;
  email: string;
  email_domain: string;
  status: string;
  role_at_org: string;
  created_at: string;
  full_name: string | null;
  org_has_admin: boolean;
};

export default function JoinRequests() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<JoinRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_superadmin_join_requests");
    if (error) toast.error(error.message);
    setRows((data as JoinRequestRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const review = async (id: string, approve: boolean) => {
    setActingId(id);
    try {
      await reviewJoinRequest(id, approve);
      toast.success(approve ? "Join request approved" : "Join request rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update request");
    } finally {
      setActingId(null);
    }
  };

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Join requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve domain-matched users joining organizations. Requests for orgs without an admin need your approval.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No pending join requests.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{r.organization_name}</h3>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      pending
                    </Badge>
                    {!r.org_has_admin && (
                      <Badge variant="destructive">Needs superadmin</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-2">
                    <strong>{r.full_name || "New user"}</strong>
                    <span className="text-muted-foreground"> · {r.role_at_org.replace("_", " ")}</span>
                  </p>
                  <a
                    href={`mailto:${r.email}`}
                    className="text-sm text-primary inline-flex items-center gap-1 hover:underline mt-1"
                  >
                    <Mail className="h-3.5 w-3.5" /> {r.email}
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">
                    Domain @{r.email_domain} · Submitted {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingId === r.id}
                    onClick={() => review(r.id, false)}
                  >
                    <X className="h-4 w-4" /> Deny
                  </Button>
                  <Button
                    size="sm"
                    disabled={actingId === r.id}
                    onClick={() => review(r.id, true)}
                  >
                    {actingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}{" "}
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
