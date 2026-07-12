import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  X,
  SlidersHorizontal,
  Star,
  Users,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { US_STATES, stateDisplayName, resolveStateCode } from "@/lib/us-states";
import { sanitizePhone } from "@/lib/phone";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { AddPartnerOrgDialog } from "@/components/app/network/AddPartnerOrgDialog";
import { SuperAdminBanner } from "@/components/app/admin/SuperAdminPanel";
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
}

const ANY = "__any__";
const PAGE_SIZE = 24;
type View = "network" | "all";

function formatStateLabel(raw: string) {
  const code = resolveStateCode(raw);
  return code ? stateDisplayName(code) : raw;
}

function OrgNetworkCard({
  org: o,
  inNet,
  stateList,
  levelList,
  tel,
  email,
  href,
  onStarClick,
  onRemove,
}: {
  org: OrgRow;
  inNet: boolean;
  stateList: string[];
  levelList: string[];
  tel: string | null;
  email: string | null;
  href: string;
  onStarClick: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      className={`group relative flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all h-full ${
        inNet ? "border-primary/60 shadow-sm" : "border-border hover:border-primary/40"
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onStarClick();
        }}
        aria-label={inNet ? "Remove from network" : "Add to network"}
        title={inNet ? "Remove from network" : "Add to network"}
        className={`absolute top-2 right-2 z-10 h-8 w-8 grid place-items-center rounded-full bg-card/95 backdrop-blur-sm border border-border/60 shadow-sm transition-colors ${
          inNet ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-accent"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${inNet ? "fill-current" : ""}`} />
      </button>

      <Link to={href} className="block">
        <div className="relative aspect-[5/3] bg-muted/30 border-b border-border/60 flex items-center justify-center p-3 sm:p-4">
          {o.logo_url ? (
            <img
              src={o.logo_url}
              alt={`${o.name} logo`}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground/60" />
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-3.5 gap-2.5 min-h-0">
        <Link to={href} className="min-w-0 group/link">
          <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 group-hover/link:text-primary transition-colors pr-7">
            {o.name}
          </h3>
        </Link>

        {stateList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {stateList.map((s) => (
              <span
                key={s}
                className="text-[10px] font-semibold bg-muted text-foreground/80 px-1.5 py-0.5 rounded border border-border/60"
              >
                {formatStateLabel(s)}
              </span>
            ))}
          </div>
        )}

        {levelList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {levelList.slice(0, 6).map((l) => (
              <span
                key={l}
                className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {l}
              </span>
            ))}
            {levelList.length > 6 && (
              <span className="text-[10px] font-semibold text-muted-foreground px-0.5 py-0.5">
                +{levelList.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto border-t border-border/60 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">BD Rep</p>
              <p className="text-xs font-semibold truncate">
                {o.bd_contact_name || (
                  <span className="text-muted-foreground font-normal">Not listed</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {tel ? (
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  aria-label={`Call ${o.bd_contact_name ?? o.name}`}
                >
                  <a href={`tel:${tel}`}>
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <Button size="icon" variant="outline" disabled className="h-7 w-7 opacity-40" aria-label="No phone">
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              )}
              {tel ? (
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  aria-label={`Text ${o.bd_contact_name ?? o.name}`}
                >
                  <a href={`sms:${tel}`}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <Button size="icon" variant="outline" disabled className="h-7 w-7 opacity-40" aria-label="No SMS">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              )}
              {email ? (
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  aria-label={`Email ${o.bd_contact_name ?? o.name}`}
                >
                  <a href={`mailto:${email}`}>
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <Button size="icon" variant="outline" disabled className="h-7 w-7 opacity-40" aria-label="No email">
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              )}
              {inNet && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                  aria-label="Remove from network"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Organizations() {
  const { isSuperAdmin } = useAuth();
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

  // Load facility aggregates once
  useEffect(() => {
    (async () => {
      const { data: facs } = await supabase
        .from("facilities")
        .select("id,organization_id,state,levels_of_care")
        .eq("verification_status", "approved");
      const facList =
        (facs as Array<{
          id: string;
          organization_id: string;
          state: string | null;
          levels_of_care: string[] | null;
        }>) ?? [];
      const map = new Map<string, OrgAggregate>();
      facList.forEach((f) => {
        if (!f.organization_id) return;
        const entry = map.get(f.organization_id) ?? {
          count: 0,
          states: new Set<string>(),
          levels: new Set<string>(),
        };
        entry.count += 1;
        if (f.state) entry.states.add(f.state);
        (f.levels_of_care ?? []).forEach((l) => l && entry.levels.add(l));
        map.set(f.organization_id, entry);
      });
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleOrgs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showPagination = filtered.length > PAGE_SIZE;

  // Keep page in range when filters shrink the list
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
      {isSuperAdmin && <SuperAdminBanner />}
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
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
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            {showPagination && (
              <p className="tabular-nums">
                Page {page} of {totalPages}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleOrgs.map((o) => {
              const inNet = partnerOrgIds.has(o.id);
              const href = o.slug ? `/o/${o.slug}` : "#";
              const fac = facilitiesByOrg.get(o.id);
              const stateList = fac ? Array.from(fac.states).sort() : [];
              const levelList = fac ? Array.from(fac.levels) : [];
              const tel = sanitizePhone(o.bd_contact_phone);
              const email = o.bd_contact_email;
              return (
                <OrgNetworkCard
                  key={o.id}
                  org={o}
                  inNet={inNet}
                  stateList={stateList}
                  levelList={levelList}
                  tel={tel}
                  email={email}
                  href={href}
                  onStarClick={() => handleStarClick(o, inNet)}
                  onRemove={() => handleRemove(o.id, o.name)}
                />
              );
            })}
          </div>
          {showPagination && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
