import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";
import {
  VERIFICATION_DISCLAIMER,
  VERIFICATION_ENTITY_TYPES,
  type VerificationEntityType,
} from "@/lib/verification-events";

interface EventRow {
  id: string;
  facility_id: string;
  entity_type: string;
  action: string;
  method: string | null;
  notes: string | null;
  created_at: string;
  facility_name: string;
}

export default function AuditLog() {
  const { isSuperAdmin, loading } = useAuth();
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [entity, setEntity] = useState<VerificationEntityType | "all">("all");

  const load = async () => {
    const { data, error } = await supabase
      .from("verification_events")
      .select("id,facility_id,entity_type,action,method,notes,created_at,facilities(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(
      ((data as Array<EventRow & { facilities: { name: string } | null }>) ?? []).map((row) => ({
        ...row,
        facility_name: row.facilities?.name ?? "Unknown facility",
      })),
    );
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((row) => entity === "all" || row.entity_type === entity);
  }, [rows, entity]);

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ScrollText className="h-6 w-6 text-primary" />
          Verification audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{VERIFICATION_DISCLAIMER}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Facility review stamps and payer <code>verified_at</code> are separate. This log does not
          invent older history.
        </p>
      </div>

      <Select value={entity} onValueChange={(v: VerificationEntityType | "all") => setEntity(v)}>
        <SelectTrigger className="sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entities</SelectItem>
          {VERIFICATION_ENTITY_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {rows === null ? (
        <div className="flex justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No verification events yet. New reviews will appear here going forward.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <Card key={row.id} className="p-3 sm:p-4">
              <Link to={`/app/facilities/${row.facility_id}`} className="font-semibold hover:text-primary">
                {row.facility_name}
              </Link>
              <p className="text-sm">
                {row.entity_type.replaceAll("_", " ")} · {row.action.replaceAll("_", " ")}
                {row.method ? ` · ${row.method}` : ""}
              </p>
              {row.notes ? <p className="text-xs text-muted-foreground">{row.notes}</p> : null}
              <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
