import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { US_STATES, resolveStateCode } from "@/lib/us-states";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { AddPartnerOrgDialog } from "@/components/app/network/AddPartnerOrgDialog";
import { SuperAdminBanner } from "@/components/app/admin/SuperAdminPanel";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { LEVELS_OF_CARE } from "@/components/app/facility/facility-types";
import {
  OrgResultCard,
  OrgResultGrid,
  type OrgSearchFacility,
} from "@/components/app/search/OrgResultCard";
import {
  contractMatchesPayer,
  type PayerMatchInput,
} from "@/lib/match-payer";
import { toast } from "sonner";
import { isPartnerVisibleFacility } from "@/lib/facility-visibility";

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

interface FacilityRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  levels_of_care: string[] | null;
  verification_status?: string;
  verification_frozen?: boolean;
}

interface ContractRow {
  facility_id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

const ANY = "__any__";
const PAGE_SIZE = 24;
type View = "network" | "all";

export default function Organizations() {
  const { isSuperAdmin } = useAuth();
  const { partners, partnerOrgIds, loading: partnersLoading, addPartner, removePartner } =
    useReferralNetwork();
  const [view, setView] = useState<View>("network");
  const [allOrgs, setAllOrgs] = useState<OrgRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [stateFilter, setStateFilter] = useState<string>(ANY);
  const [locFilter, setLocFilter] = useState<string>(ANY);
  const [payerId, setPayerId] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerMeta, setPayerMeta] = useState<PayerMatchInput | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [{ data: facs }, { data: cons }] = await Promise.all([
        supabase
          .from("facilities")
          .select("id,organization_id,name,slug,city,state,levels_of_care,verification_status,verification_frozen")
          .eq("verification_status", "approved")
          .eq("verification_frozen", false)
          .order("name"),
        supabase
          .from("insurance_contracts")
          .select("facility_id,payer_id,payer_name,in_network")
          .eq("in_network", true),
      ]);
      setFacilities(((facs as FacilityRow[]) ?? []).filter((row) => isPartnerVisibleFacility(row)));
      setContracts((cons as ContractRow[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!payerId) {
      setPayerMeta(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("payers")
        .select("id,name,aliases")
        .eq("id", payerId)
        .maybeSingle();
      if (cancelled) return;
      setPayerMeta((data as PayerMatchInput | null) ?? { id: payerId, name: payerName });
    })();
    return () => {
      cancelled = true;
    };
  }, [payerId, payerName]);

  useEffect(() => {
    if (view !== "all" || allLoaded) return;
    (async () => {
      setAllLoading(true);
      const { data } = await supabase
        .from("organizations")
        .select(
          "id,name,slug,logo_url,hq_city,hq_state,description,verified,bd_contact_name,bd_contact_phone,bd_contact_email",
        )
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
    [partners],
  );

  const sourceRows = view === "network" ? preferredRows : allOrgs;
  const loading = view === "network" ? partnersLoading : allLoading;

  const facilitiesByOrg = useMemo(() => {
    const map = new Map<string, FacilityRow[]>();
    for (const f of facilities) {
      if (!f.organization_id) continue;
      const list = map.get(f.organization_id) ?? [];
      list.push(f);
      map.set(f.organization_id, list);
    }
    return map;
  }, [facilities]);

  /** facility_id → matched payer display name (when insurance filter is active). */
  const facilityPayerMatch = useMemo(() => {
    const map = new Map<string, string>();
    if (!payerMeta) return map;
    for (const c of contracts) {
      if (!c.in_network) continue;
      if (!contractMatchesPayer(c, payerMeta)) continue;
      if (!map.has(c.facility_id)) {
        map.set(c.facility_id, payerMeta.name || c.payer_name);
      }
    }
    return map;
  }, [contracts, payerMeta]);

  const states = useMemo(() => {
    const present = new Set<string>();
    sourceRows.forEach((o) => {
      if (o.hq_state) present.add(o.hq_state);
      (facilitiesByOrg.get(o.id) ?? []).forEach((f) => {
        const code = resolveStateCode(f.state);
        if (code) present.add(code);
        else if (f.state) present.add(f.state);
      });
    });
    return US_STATES.filter((s) => present.has(s.code));
  }, [sourceRows, facilitiesByOrg]);

  const qLower = q.trim().toLowerCase();
  const cityLower = city.trim().toLowerCase();
  const hasPayerFilter = !!payerId;
  const hasActiveFilters =
    !!qLower || !!cityLower || stateFilter !== ANY || locFilter !== ANY || hasPayerFilter;

  const filtered = useMemo(() => {
    return sourceRows
      .map((o) => {
        const orgFacilities = facilitiesByOrg.get(o.id) ?? [];
        const orgNameMatch = qLower
          ? `${o.name} ${o.description ?? ""}`.toLowerCase().includes(qLower)
          : true;

        const matchedFacs = orgFacilities.filter((f) => {
          if (hasPayerFilter && !facilityPayerMatch.has(f.id)) return false;
          if (stateFilter !== ANY) {
            const code = resolveStateCode(f.state) ?? f.state;
            if (code !== stateFilter) return false;
          }
          if (cityLower && !(f.city ?? "").toLowerCase().includes(cityLower)) return false;
          if (locFilter !== ANY && !(f.levels_of_care ?? []).includes(locFilter)) return false;
          if (qLower) {
            const facMatch = `${f.name} ${f.city ?? ""} ${f.state ?? ""}`
              .toLowerCase()
              .includes(qLower);
            return orgNameMatch || facMatch;
          }
          return true;
        });

        return { org: o, facilities: matchedFacs };
      })
      .filter(({ facilities: facs }) => {
        if (hasActiveFilters) return facs.length > 0;
        return true;
      });
  }, [
    sourceRows,
    facilitiesByOrg,
    qLower,
    cityLower,
    stateFilter,
    locFilter,
    hasPayerFilter,
    facilityPayerMatch,
    hasActiveFilters,
  ]);

  const activeCount =
    (q ? 1 : 0) +
    (city ? 1 : 0) +
    (stateFilter !== ANY ? 1 : 0) +
    (locFilter !== ANY ? 1 : 0) +
    (payerId ? 1 : 0);

  const clearAll = () => {
    setQ("");
    setCity("");
    setStateFilter(ANY);
    setLocFilter(ANY);
    setPayerId(null);
    setPayerName("");
    setPayerMeta(null);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [q, city, stateFilter, locFilter, payerId, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showPagination = filtered.length > PAGE_SIZE;

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

  const handleStarClick = async (orgId: string, name: string, inNet: boolean) => {
    if (inNet) {
      handleRemove(orgId, name);
    } else {
      const { error } = await handleAddOrg(orgId);
      if (error) toast.error(error);
      else toast.success(`${name} added to your network`);
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
            Find in-network facilities by insurance, then browse the organizations behind them.
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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Insurance
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <PayerCombobox
                  payerId={payerId}
                  payerName={payerName}
                  onSelect={(p) => {
                    setPayerId(p.id);
                    setPayerName(p.name);
                  }}
                  placeholder="Search by insurance / payer…"
                  triggerClassName="w-full h-11"
                  approvedOnly
                />
              </div>
              <Button
                variant="outline"
                className="h-11 sm:hidden shrink-0"
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
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                view === "network"
                  ? "Search partners or facilities…"
                  : "Search organizations or facilities…"
              }
              className="pl-9 h-11"
            />
          </div>

          <div
            className={`grid gap-2 sm:grid-cols-3 ${showFilters ? "" : "hidden sm:grid"}`}
          >
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
            <Select value={locFilter} onValueChange={setLocFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Level of care" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All levels of care</SelectItem>
                {LEVELS_OF_CARE.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "organization" : "organizations"}
                {payerName ? ` in-network with ${payerName}` : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-8">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <OrgResultGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] sm:h-[240px] rounded-xl" />
          ))}
        </OrgResultGrid>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          {view === "network" && sourceRows.length === 0 ? (
            <>
              <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No partners in your network yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Add organizations you trust to refer patients to. They&apos;ll show up here and
                surface first in search.
              </p>
              <div className="mt-4 inline-flex">
                <AddPartnerOrgDialog excludeIds={partnerOrgIds} onAdd={handleAddOrg} />
              </div>
            </>
          ) : (
            <>
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No organizations match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">
                {payerName
                  ? `No in-network matches for ${payerName}. Try another payer or clear filters.`
                  : "Try clearing a filter or broadening your criteria."}
              </p>
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

          <OrgResultGrid>
            {visible.map(({ org: o, facilities: matchedFacs }) => {
              const inNet = partnerOrgIds.has(o.id);
              const sourceFacs =
                matchedFacs.length > 0 || hasActiveFilters
                  ? matchedFacs
                  : facilitiesByOrg.get(o.id) ?? [];
              const facs: OrgSearchFacility[] = sourceFacs.map((f) => ({
                id: f.id,
                name: f.name,
                slug: f.slug,
                city: f.city,
                state: f.state,
                levels_of_care: f.levels_of_care ?? [],
                matched_payer: facilityPayerMatch.get(f.id),
              }));

              return (
                <div key={o.id} className="relative h-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleStarClick(o.id, o.name, inNet);
                    }}
                    aria-label={inNet ? "Remove from network" : "Add to network"}
                    title={inNet ? "Remove from network" : "Add to network"}
                    className={`absolute top-2 right-2 z-20 h-8 w-8 grid place-items-center rounded-full bg-card/95 backdrop-blur-sm border border-border/60 shadow-sm transition-colors ${
                      inNet
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${inNet ? "fill-current" : ""}`} />
                  </button>
                  <OrgResultCard
                    o={{
                      org_id: o.id,
                      org_name: o.name,
                      org_slug: o.slug,
                      logo_url: o.logo_url,
                      hq_city: o.hq_city,
                      hq_state: o.hq_state,
                      in_your_network: inNet,
                      facilities: facs,
                      latest_verified_at: null,
                    }}
                    collapsibleFacilities
                  />
                </div>
              );
            })}
          </OrgResultGrid>

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
