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
            <Building2 className="h-7 w-7 text-primary" /> Manage organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick an organization, then use <strong className="font-medium text-foreground">Edit</strong> for profile
            details or <strong className="font-medium text-foreground">Manage</strong> for branding, facilities, and
            shared links.
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

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No organizations found</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => {
            const facCount = counts.get(o.id) ?? 0;
            return (
              <Card key={o.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {o.logo_url ? (
                    <img src={o.logo_url} alt={o.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{o.name}</p>
                    {o.verified && (
                      <Badge variant="secondary" className="text-[10px]">
                        <BadgeCheck className="h-3 w-3 text-success" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {[o.hq_city, o.hq_state].filter(Boolean).join(", ") || "No HQ"} · {facCount}{" "}
                    {facCount === 1 ? "facility" : "facilities"}
                    {o.email_domain ? ` · ${o.email_domain}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
