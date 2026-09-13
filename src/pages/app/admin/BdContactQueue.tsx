import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AssignFacilityBdDialog } from "@/components/app/facility/AssignFacilityBdDialog";
import { bdContactStatusLabel, hasAssignedBdContact, isBdContactVerified } from "@/lib/bd-contact";
import { recordVerificationEvent } from "@/lib/record-verification-event";

type Filter = "missing" | "unverified" | "assigned";

interface Row {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  organization_id: string;
  org_name: string;
  phone: string | null;
  website: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  bd_contact_verified_at: string | null;
}

export default function BdContactQueue() {
  const { isSuperAdmin, user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Filter>("missing");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select(
        "id,name,city,state,organization_id,phone,website,bd_contact_name,bd_contact_phone,bd_contact_email,bd_contact_verified_at,organizations(name)",
      )
      .eq("verification_status", "approved")
      .order("name");
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(
      ((data as Array<Row & { organizations: { name: string } | null }>) ?? []).map((row) => ({
        ...row,
        org_name: row.organizations?.name ?? "Unknown organization",
      })),
    );
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((row) => {
      const assigned = hasAssignedBdContact(row);
      if (filter === "missing" && assigned) return false;
      if (filter === "unverified" && (!assigned || isBdContactVerified(row))) return false;
      if (filter === "assigned" && !assigned) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [row.name, row.org_name, row.city, row.bd_contact_name, row.bd_contact_email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, filter, search]);

  const missing = rows?.filter((row) => !hasAssignedBdContact(row)).length ?? 0;

  const verify = async (row: Row) => {
    if (!user || !hasAssignedBdContact(row)) return;
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("facilities")
      .update({
        bd_contact_verified_at: now,
        bd_contact_verified_by: user.id,
      })
      .eq("id", row.id);
    if (!error) {
      await supabase
        .from("facility_bd_assignments")
        .select("representative_id")
        .eq("facility_id", row.id)
        .eq("is_primary", true)
        .maybeSingle()
        .then(async ({ data }) => {
          if (!data?.representative_id) return;
          await supabase
            .from("bd_representatives")
            .update({
              last_verified_at: now,
              verified_by: user.id,
              verification_method: "admin_review",
            })
            .eq("id", data.representative_id);
        });
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await recordVerificationEvent({
      facilityId: row.id,
      entityType: "bd_contact",
      action: "verified_contact",
      method: "admin_review",
      actorId: user.id,
    });
    toast.success("BD contact marked verified");
    load();
  };

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UserRound className="h-6 w-6 text-primary" />
          BD contact queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {missing} approved listings have no assigned BD representative with a direct phone or
          email. Facility phone/website is not treated as the BD contact.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search facility, org, or rep…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v: Filter) => setFilter(v)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="missing">Missing assignment</SelectItem>
            <SelectItem value="unverified">Assigned, not verified</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {rows === null ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No listings in this filter.</Card>
        ) : (
          filtered.map((row) => {
            const place = [row.city, row.state].filter(Boolean).join(", ");
            return (
              <Card key={row.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="min-w-0">
                  <Link to={`/app/facilities/${row.id}`} className="font-semibold hover:text-primary">
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.org_name}
                    {place ? ` · ${place}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    {row.bd_contact_name || "No BD name"}
                    {row.bd_contact_email ? ` · ${row.bd_contact_email}` : ""}
                    {row.bd_contact_phone ? ` · ${row.bd_contact_phone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{bdContactStatusLabel(row)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AssignFacilityBdDialog
                    facilityId={row.id}
                    facilityName={row.name}
                    organizationId={row.organization_id}
                    bd_contact_name={row.bd_contact_name}
                    bd_contact_phone={row.bd_contact_phone}
                    bd_contact_email={row.bd_contact_email}
                    onSaved={load}
                    triggerLabel="Assign BD"
                  />
                  {hasAssignedBdContact(row) && !isBdContactVerified(row) && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => verify(row)}>
                      Record verification
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
