import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Search,
  MapPin,
  X,
  SlidersHorizontal,
  Star,
  Users,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { US_STATES } from "@/lib/us-states";
import { sanitizePhone } from "@/lib/phone";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { AddPartnerOrgDialog } from "@/components/app/network/AddPartnerOrgDialog";
import { toast } from "sonner";

interface OrgRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
  description: string | null;
  verified: boolean | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
}

interface OrgAggregate {
  count: number;
  states: Set<string>;
  levels: Set<string>;
  payers: Map<string, number>;
}

const ANY = "__any__";
const PAGE_SIZE = 24;
type View = "network" | "all";

export default function Organizations() {
  const { partners, partnerOrgIds, loading: partnersLoading, addPartner, removePartner } =
    useReferralNetwork();
  const [view, setView] = useState<View>("network");
  const [allOrgs, setAllOrgs] = useState<OrgRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // facility metadata for ALL orgs (used by both views)
  const [facilitiesByOrg, setFacilitiesByOrg] = useState<Map<string, OrgAggregate>>(new Map());

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [stateFilter, setStateFilter] = useState<string>(ANY);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Load facility + insurance aggregates once
  useEffect(() => {
    (async () => {
      const { data: facs } = await supabase
        .from("facilities")
        .select("id,organization_id,state,levels_of_care")
        .eq("verification_status", "approved");
      const facList = (facs as Array<{ id: string; organization_id: string; state: string | null; levels_of_care: string[] | null }>) ?? [];
      const facToOrg = new Map<string, string>();
      const map = new Map<string, OrgAggregate>();
      facList.forEach((f) => {
        if (!f.organization_id) return;
        facToOrg.set(f.id, f.organization_id);
        const entry = map.get(f.organization_id) ?? { count: 0, states: new Set<string>(), levels: new Set<string>(), payers: new Map<string, number>() };
        entry.count += 1;
        if (f.state) entry.states.add(f.state);
        (f.levels_of_care ?? []).forEach((l) => l && entry.levels.add(l));
        map.set(f.organization_id, entry);
      });

      const facIds = Array.from(facToOrg.keys());
      if (facIds.length) {
        const { data: contracts } = await supabase
          .from("insurance_contracts")
          .select("facility_id,payer_name,in_network")
          .in("facility_id", facIds)
          .eq("in_network", true);
        ((contracts as Array<{ facility_id: string; payer_name: string | null }>) ?? []).forEach((c) => {
          const orgId = facToOrg.get(c.facility_id);
          if (!orgId || !c.payer_name) return;
          const entry = map.get(orgId);
          if (!entry) return;
          entry.payers.set(c.payer_name, (entry.payers.get(c.payer_name) ?? 0) + 1);
        });
      }
      setFacilitiesByOrg(map);
    })();
  }, []);

  useEffect(() => {
    if (view !== "all" || allLoaded) return;
    (async () => {
      setAllLoading(true);
      const { data } = await supabase
        .from("organizations")
        .select("id,name,slug,logo_url,hq_city,hq_state,description,verified,bd_contact_name,bd_contact_phone,bd_contact_email")
        .order("verified", { ascending: false })
        .order("name");
      setAllOrgs((data as OrgRow[]) ?? []);
      setAllLoading(false);
      setAllLoaded(true);
    })();
  }, [view, allLoaded]);

  const preferredRows: OrgRow[] = useMemo(
    () =>
      partners.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        logo_url: p.logo_url,
        hq_city: p.hq_city,
        hq_state: p.hq_state,
        description: null,
        verified: true,
        bd_contact_name: p.bd_contact_name,
        bd_contact_phone: p.bd_contact_phone,
        bd_contact_email: p.bd_contact_email,
      })),
    [partners]
  );

  const sourceRows = view === "network" ? preferredRows : allOrgs;
  const loading = view === "network" ? partnersLoading : allLoading;

  // State filter options: union of HQ state + every state where the org has a facility
  const states = useMemo(() => {
    const present = new Set<string>();
    sourceRows.forEach((o) => {
      if (o.hq_state) present.add(o.hq_state);
      facilitiesByOrg.get(o.id)?.states.forEach((s) => present.add(s));
    });
    return US_STATES.filter((s) => present.has(s.code));
  }, [sourceRows, facilitiesByOrg]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const cityLower = city.trim().toLowerCase();
    return sourceRows.filter((o) => {
      if (qLower && !`${o.name} ${o.description ?? ""}`.toLowerCase().includes(qLower)) return false;
      if (cityLower && !(o.hq_city ?? "").toLowerCase().includes(cityLower)) return false;
      if (stateFilter !== ANY) {
        const fac = facilitiesByOrg.get(o.id);
        const matches = o.hq_state === stateFilter || (fac && fac.states.has(stateFilter));
        if (!matches) return false;
      }
      return true;
    });
  }, [sourceRows, q, city, stateFilter, facilitiesByOrg]);

  const activeCount = (q ? 1 : 0) + (city ? 1 : 0) + (stateFilter !== ANY ? 1 : 0);
  const clearAll = () => {
    setQ("");
    setCity("");
    setStateFilter(ANY);
    setPage(1);
  };

  // Reset to page 1 whenever filters or view change
  useEffect(() => { setPage(1); }, [q, city, stateFilter, view]);

  const visibleOrgs = view === "network" ? filtered : filtered.slice(0, page * PAGE_SIZE);
  const hasMore = view === "all" && visibleOrgs.length < filtered.length;

  const partnerById = useMemo(() => {
    const m = new Map<string, (typeof partners)[number]>();
    partners.forEach((p) => m.set(p.id, p));
    return m;
  }, [partners]);

  const handleAddOrg = async (orgId: string) => {
    const { error } = await addPartner(orgId);
    return { error };
  };

  const handleRemove = async (orgId: string, name: string) => {
    const partner = partnerById.get(orgId);
    if (!partner) return;
    const { error } = await removePartner(partner.rowId);
    if (error) toast.error(error);
    else toast.success(`${name} removed from your network`);
  };

  const handleStarClick = async (o: OrgRow, inNet: boolean) => {
    if (inNet) {
      handleRemove(o.id, o.name);
    } else {
      const { error } = await handleAddOrg(o.id);
      if (error) toast.error(error);
      else toast.success(`${o.name} added to your network`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Referral Network
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            The organizations you trust to refer to. Preferred partners surface first in search and
            on your team's dashboards.
          </p>
        </div>
        <AddPartnerOrgDialog excludeIds={partnerOrgIds} onAdd={handleAddOrg} />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList>
          <TabsTrigger value="network" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Your network
            <span className="ml-1 text-xs text-muted-foreground">({partners.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Browse all
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={view === "network" ? "Search your partners…" : "Search all organizations…"}
                className="pl-9 h-11"
              />
            </div>
            <Button
              variant="outline"
              className="h-11 sm:hidden"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-[20px] px-1">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>

          <div className={`grid gap-2 sm:grid-cols-2 ${showFilters ? "" : "hidden sm:grid"}`}>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-11"
            />
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-8">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          {view === "network" && sourceRows.length === 0 ? (
            <>
              <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No partners in your network yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Add organizations you trust to refer patients to. They'll show up here and surface first in search.
              </p>
              <div className="mt-4 inline-flex">
                <AddPartnerOrgDialog excludeIds={partnerOrgIds} onAdd={handleAddOrg} />
              </div>
            </>
          ) : (
            <>
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No organizations match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try clearing a filter or broadening your criteria.</p>
              {activeCount > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
                  <X className="h-4 w-4" /> Clear filters
                </Button>
              )}
            </>
          )}
        </Card>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto w-full">
          {visibleOrgs.map((o) => {
            const inNet = partnerOrgIds.has(o.id);
            const href = o.slug ? `/o/${o.slug}` : "#";
            const fac = facilitiesByOrg.get(o.id);
            const facCount = fac?.count ?? 0;
            const stateList = fac ? Array.from(fac.states).sort() : [];
            const levelList = fac ? Array.from(fac.levels) : [];
            const topPayers = fac
              ? Array.from(fac.payers.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([name]) => name)
              : [];
            const tel = sanitizePhone(o.bd_contact_phone);
            const email = o.bd_contact_email;
            return (
              <div
                key={o.id}
                className={`group relative rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all ${
                  inNet ? "border-primary/60 shadow-sm" : "border-border hover:border-primary/40"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleStarClick(o, inNet);
                  }}
                  aria-label={inNet ? "Remove from network" : "Add to network"}
                  title={inNet ? "Remove from network" : "Add to network"}
                  className={`absolute top-3 right-3 z-10 h-9 w-9 grid place-items-center rounded-full transition-colors ${
                    inNet
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  <Star className={`h-5 w-5 ${inNet ? "fill-current" : ""}`} />
                </button>

                <div className="p-5 sm:p-6">
                  {/* Header */}
                  <Link to={href} className="flex gap-4 sm:gap-5 items-start pr-10">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white border border-border flex items-center justify-center p-3 shrink-0">
                      {o.logo_url ? (
                        <img src={o.logo_url} alt={o.name} loading="lazy" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-bold text-lg sm:text-xl leading-tight">{o.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {(o.hq_city || o.hq_state) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            HQ: {[o.hq_city, o.hq_state].filter(Boolean).join(", ")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {facCount} {facCount === 1 ? "facility" : "facilities"}
                        </span>
                      </div>
                      {stateList.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mr-1">Operates in</span>
                          {stateList.map((s) => (
                            <span key={s} className="text-[11px] font-semibold bg-muted text-foreground/80 px-2 py-0.5 rounded-md border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Levels of care */}
                  {levelList.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground inline-flex items-center gap-1.5 mb-1.5">
                        <Layers className="h-3.5 w-3.5" /> Levels of care
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {levelList.map((l) => (
                          <span key={l} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top payers */}
                  {topPayers.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground inline-flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-success" /> Top in-network payers
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {topPayers.map((p) => (
                          <span key={p} className="text-xs font-medium bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BD rep footer */}
                <div className="border-t border-border/60 bg-muted/30 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">BD Rep</p>
                    <p className="text-sm font-semibold truncate">
                      {o.bd_contact_name || <span className="text-muted-foreground font-normal">Not listed</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tel ? (
                      <Button asChild size="icon" variant="outline" className="h-9 w-9" aria-label={`Call ${o.bd_contact_name ?? o.name}`}>
                        <a href={`tel:${tel}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    ) : (
                      <Button size="icon" variant="outline" disabled className="h-9 w-9 opacity-40" aria-label="No phone"><Phone className="h-4 w-4" /></Button>
                    )}
                    {tel ? (
                      <Button asChild size="icon" variant="outline" className="h-9 w-9" aria-label={`Text ${o.bd_contact_name ?? o.name}`}>
                        <a href={`sms:${tel}`}><MessageSquare className="h-4 w-4" /></a>
                      </Button>
                    ) : (
                      <Button size="icon" variant="outline" disabled className="h-9 w-9 opacity-40" aria-label="No SMS"><MessageSquare className="h-4 w-4" /></Button>
                    )}
                    {email ? (
                      <Button asChild size="icon" variant="outline" className="h-9 w-9" aria-label={`Email ${o.bd_contact_name ?? o.name}`}>
                        <a href={`mailto:${email}`}><Mail className="h-4 w-4" /></a>
                      </Button>
                    ) : (
                      <Button size="icon" variant="outline" disabled className="h-9 w-9 opacity-40" aria-label="No email"><Mail className="h-4 w-4" /></Button>
                    )}
                    {inNet && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(o.id, o.name)}
                        aria-label="Remove from network"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Load more ({filtered.length - visibleOrgs.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
