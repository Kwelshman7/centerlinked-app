import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, Plus, BadgeCheck, ExternalLink, Settings } from "lucide-react";
import { EditOrganizationDialog, type OrgEditable } from "@/components/app/admin/EditOrganizationDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrgRow extends OrgEditable {
  slug: string | null;
}

export default function AdminOrganizations() {
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [q, setQ] = useState("");

  const loadOrgs = async () => {
    setLoading(true);
    const [{ data: o }, { data: f }] = await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id,name,slug,logo_url,hq_city,hq_state,verified,email_domain,website,description,phone,bd_contact_name,bd_contact_phone,bd_contact_email",
        )
        .order("name"),
      supabase.from("facilities").select("organization_id"),
    ]);
    setOrgs((o as OrgRow[]) ?? []);
    const m = new Map<string, number>();
    ((f as Array<{ organization_id: string }>) ?? []).forEach((row) => {
      m.set(row.organization_id, (m.get(row.organization_id) ?? 0) + 1);
    });
    setCounts(m);
    setLoading(false);
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return orgs;
    return orgs.filter((o) =>
      `${o.name} ${o.hq_city ?? ""} ${o.hq_state ?? ""} ${o.email_domain ?? ""}`
        .toLowerCase()
        .includes(t),
    );
  }, [orgs, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> Edit all organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan every organization, then edit the profile or open it to add facilities and insurance.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/admin/organizations/new">
            <Plus className="h-4 w-4" /> New organization
          </Link>
        </Button>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, location, or domain…"
            className="pl-9 h-11"
          />
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        {loading ? "Loading organizations…" : `${filtered.length} ${filtered.length === 1 ? "organization" : "organizations"}`}
      </p>

      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No organizations found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Organization</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Location</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Domain</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs font-semibold uppercase tracking-[0.06em]">Facilities</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Status</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs font-semibold uppercase tracking-[0.06em]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const facCount = counts.get(o.id) ?? 0;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white">
                          {o.logo_url ? (
                            <img src={o.logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="truncate font-medium">{o.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">
                      {[o.hq_city, o.hq_state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">{o.email_domain || "—"}</TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums">{facCount}</TableCell>
                    <TableCell className="px-3 py-2">
                      {o.verified ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <BadgeCheck className="h-3 w-3 text-success" /> Verified
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unverified</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {o.slug && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/o/${o.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <EditOrganizationDialog org={o} onSaved={loadOrgs} triggerLabel="Edit" />
                        <Button asChild size="sm">
                          <Link to={`/app/admin/organizations/${o.id}`}>
                            <Settings className="h-4 w-4" /> Manage
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
