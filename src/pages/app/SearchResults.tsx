import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Building2, Search as SearchIcon } from "lucide-react";
import { SearchForm } from "@/components/app/search/SearchForm";
import {
  OrgListItem,
  OrgSearchResult,
  SearchFacilityCard,
} from "@/components/app/search/OrgResultCard";
import { toast } from "sonner";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import {
  buildPayerOrFilter,
  contractMatchesPayer,
  type PayerMatchInput,
} from "@/lib/match-payer";
import { resolveStateCode, stateMatchesFilter, US_STATES } from "@/lib/us-states";
import {
  contractMatchesPlanType,
  parsePlanTypeParam,
  planTypeShortLabel,
} from "@/lib/plan-types";
import { insuranceMatchFromContract } from "@/lib/insurance-contract-status";
import type { OrgSearchFacility } from "@/components/app/search/OrgResultCard";
import { rememberSearchSession } from "@/lib/search-session";

type OrgFields = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
};

type FacilityFields = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  levels_of_care: string[];
  image_urls: string[];
  verification_status: string;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  self_pay_only?: boolean | null;
  zip?: string | null;
  specializations?: string[] | null;
  accreditations?: string[] | null;
  bd_contact_name?: string | null;
  bd_contact_phone?: string | null;
  bd_contact_email?: string | null;
  bd_contact_title?: string | null;
  bd_contact_verified_at?: string | null;
  organization_id: string;
  organizations: OrgFields | null;
};

type ContractFields = {
  payer_id: string | null;
  payer_name: string;
  plan_types: string[] | null;
  in_network?: boolean | null;
  contract_status?: string | null;
  verified_at?: string | null;
};

type ContractRow = ContractFields & { facilities: FacilityFields | null };

const FACILITY_SELECT =
  "id,name,slug,city,state,zip,specializations,accreditations,levels_of_care,image_urls,verification_status,contracts_verified_at,verification_frozen,self_pay_only,bd_contact_name,bd_contact_phone,bd_contact_email,bd_contact_title,bd_contact_verified_at,organization_id,organizations(id,name,slug,logo_url,hq_city,hq_state)";
const CONTRACT_SELECT =
  "payer_id,payer_name,plan_types,in_network,contract_status,verified_at";

function toFacilityCard(
  f: FacilityFields,
  contract: ContractFields | null,
  payerNameFallback: string,
  options?: { skipMatchBadge?: boolean },
): OrgSearchFacility {
  const match = insuranceMatchFromContract(contract, { selfPayOnly: f.self_pay_only });
  const showMatch = !options?.skipMatchBadge;
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.city,
    state: f.state,
    image_urls: f.image_urls ?? [],
    matched_payer: showMatch
      ? match.payerName ?? (contract ? payerNameFallback : undefined)
      : undefined,
    matched_plan_types: showMatch ? match.planTypes : [],
    insurance_match_status: showMatch ? match.status : undefined,
    insurance_verified_at: showMatch ? match.verifiedAt : null,
    levels_of_care: f.levels_of_care ?? [],
    bd_contact_name: f.bd_contact_name ?? null,
    bd_contact_phone: f.bd_contact_phone ?? null,
    bd_contact_email: f.bd_contact_email ?? null,
    bd_contact_title: f.bd_contact_title ?? null,
    bd_contact_verified_at: f.bd_contact_verified_at ?? null,
  };
}

type OrgSearchBase = Omit<OrgSearchResult, "in_your_network">;

export default function SearchResults() {
  const [params] = useSearchParams();
  const [baseResults, setBaseResults] = useState<OrgSearchBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { partnerOrgIds } = useReferralNetwork();

  const payerId = params.get("payerId");
  const payerName = params.get("payerName") ?? "";
  const planType = parsePlanTypeParam(params.get("planType"));
  const state = params.get("state") ?? "";
  const city = params.get("city") ?? "";
  const zip = (params.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
  const specialty = params.get("specialty") ?? "";
  const accreditation = params.get("accreditation") ?? "";
  const loc = params.get("loc") ?? "";

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (payerName) parts.push(payerName);
    if (planType) parts.push(planTypeShortLabel(planType));
    if (loc) parts.push(loc);
    if (specialty) parts.push(specialty);
    if (accreditation) parts.push(accreditation);
    const place = [city, state, zip].filter(Boolean).join(", ");
    if (place) parts.push(`in ${place}`);
    return parts.length ? parts.join(" · ") : "All verified organizations";
  }, [payerName, planType, loc, specialty, accreditation, city, state, zip]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setTruncated(false);

      let payer: PayerMatchInput | null = null;
      if (payerId) {
        const { data } = await supabase
          .from("payers")
          .select("id,name,aliases")
          .eq("id", payerId)
          .maybeSingle();
        if (cancelled) return;
        payer = (data as PayerMatchInput | null) ?? null;
      }

      const stateCode = resolveStateCode(state);
      const stateName = stateCode ? US_STATES.find((s) => s.code === stateCode)?.name : null;

      const byOrg = new Map<string, OrgSearchBase>();
      const seenFac = new Map<string, Set<string>>();
      const addFacility = (
        f: FacilityFields,
        contract: ContractFields | null,
        options?: { skipMatchBadge?: boolean },
      ) => {
        if (!f.organizations || f.verification_status !== "approved") return;
        if (state && !stateMatchesFilter(f.state, state)) return;
        if (zip && (f.zip ?? "").replace(/\D/g, "").slice(0, 5) !== zip) return;
        if (specialty) {
          const haystack = [...(f.specializations ?? []), ...(f.levels_of_care ?? [])]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(specialty.toLowerCase())) return;
        }
        if (accreditation) {
          const haystack = (f.accreditations ?? []).join(" ").toLowerCase();
          if (!haystack.includes(accreditation.toLowerCase())) return;
        }
        const org = f.organizations;
        if (!byOrg.has(org.id)) {
          byOrg.set(org.id, {
            org_id: org.id,
            org_name: org.name,
            org_slug: org.slug,
            logo_url: org.logo_url,
            hq_city: org.hq_city,
            hq_state: org.hq_state,
            facilities: [],
            latest_verified_at: null,
          });
          seenFac.set(org.id, new Set());
        }
        const entry = byOrg.get(org.id)!;
        const seen = seenFac.get(org.id)!;
        if (seen.has(f.id)) return;
        seen.add(f.id);
        entry.facilities.push(
          toFacilityCard(f, contract, payer?.name ?? contract?.payer_name ?? "", options),
        );
        if (contract?.verified_at) {
          if (!entry.latest_verified_at || contract.verified_at > entry.latest_verified_at) {
            entry.latest_verified_at = contract.verified_at;
          }
        }
      };

      if (payer || payerId) {
        let q = supabase
          .from("insurance_contracts")
          .select(`${CONTRACT_SELECT}, facilities!inner(${FACILITY_SELECT})`);

        if (payer) q = q.or(buildPayerOrFilter(payer));
        else if (payerId) q = q.eq("payer_id", payerId);

        q = q.eq("facilities.verification_status", "approved");
        if (stateCode && stateName && stateName.toUpperCase() !== stateCode) {
          q = q.or(`state.eq.${stateCode},state.ilike.${stateName}`, { referencedTable: "facilities" });
        } else if (state) {
          q = q.ilike("facilities.state", `%${state}%`);
        }
        if (city) q = q.ilike("facilities.city", `%${city}%`);
        if (zip) q = q.ilike("facilities.zip", `${zip}%`);
        if (loc) q = q.contains("facilities.levels_of_care", [loc]);

        const { data, error } = await q.limit(500);
        if (cancelled) return;
        if (error) {
          setBaseResults([]);
          setLoadError(error.message || "Search failed");
          toast.error("Search failed", { description: "Try again. If this continues, refresh the page." });
          setLoading(false);
          return;
        }

        setTruncated((data?.length ?? 0) >= 500);
        let rows = (data as unknown as ContractRow[]) ?? [];
        if (payer) rows = rows.filter((row) => contractMatchesPayer(row, payer));
        if (planType) rows = rows.filter((row) => contractMatchesPlanType(row.plan_types, planType));
        rows.forEach((row) => {
          if (row.facilities) addFacility(row.facilities, row);
        });
      } else {
        let q = supabase
          .from("facilities")
          .select(`${FACILITY_SELECT},insurance_contracts(${CONTRACT_SELECT})`)
          .eq("verification_status", "approved");
        if (stateCode && stateName && stateName.toUpperCase() !== stateCode) {
          q = q.or(`state.eq.${stateCode},state.ilike.${stateName}`);
        } else if (state) {
          q = q.ilike("state", `%${state}%`);
        }
        if (city) q = q.ilike("city", `%${city}%`);
        if (zip) q = q.ilike("zip", `${zip}%`);
        if (loc) q = q.contains("levels_of_care", [loc]);

        const { data, error } = await q.limit(500);
        if (cancelled) return;
        if (error) {
          setBaseResults([]);
          setLoadError(error.message || "Search failed");
          toast.error("Search failed", { description: "Try again. If this continues, refresh the page." });
          setLoading(false);
          return;
        }

        setTruncated((data?.length ?? 0) >= 500);
        type FacilitySearchRow = FacilityFields & { insurance_contracts?: ContractFields[] | null };
        ((data as unknown as FacilitySearchRow[]) ?? []).forEach((row) => {
          const contracts = row.insurance_contracts ?? [];
          addFacility(row, null, { skipMatchBadge: contracts.length > 0 && !row.self_pay_only });
        });
      }

      setBaseResults(Array.from(byOrg.values()));
      void supabase.from("search_events").insert({
        payer_name: payerName || null,
        plan_type: planType || null,
        state: state || null,
        city: city || null,
        zip: zip || null,
        loc: loc || null,
        specialty: specialty || null,
        accreditation: accreditation || null,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [payerId, planType, state, city, zip, loc, specialty, accreditation]);

  const results = useMemo(
    () =>
      baseResults
        .map((r) => ({ ...r, in_your_network: partnerOrgIds.has(r.org_id) }))
        .sort((a, b) => {
          if (a.in_your_network !== b.in_your_network) return a.in_your_network ? -1 : 1;
          const va = a.latest_verified_at ?? "";
          const vb = b.latest_verified_at ?? "";
          if (va !== vb) return vb.localeCompare(va);
          return a.org_name.localeCompare(b.org_name);
        }),
    [baseResults, partnerOrgIds],
  );

  useEffect(() => {
    if (results.length === 0) {
      setSelectedOrgId(null);
      return;
    }
    setSelectedOrgId((current) =>
      current && results.some((r) => r.org_id === current) ? current : results[0].org_id,
    );
  }, [results]);

  const selectedOrg = results.find((r) => r.org_id === selectedOrgId) ?? null;
  const totalFacilities = results.reduce((n, o) => n + o.facilities.length, 0);
  const onlyFacility = selectedOrg?.facilities.length === 1 ? selectedOrg.facilities[0] : null;
  const orgHref = selectedOrg?.org_slug
    ? onlyFacility?.slug
      ? `/o/${selectedOrg.org_slug}/p/${onlyFacility.slug}`
      : `/o/${selectedOrg.org_slug}`
    : null;
  const resultsPath = `/app/search/results${params.toString() ? `?${params.toString()}` : ""}`;

  useEffect(() => {
    if (loading || loadError) return;
    const orgs = results
      .filter((r) => r.org_slug)
      .map((r) => ({ slug: r.org_slug as string, name: r.org_name, logo_url: r.logo_url }));
    if (orgs.length === 0) return;
    rememberSearchSession({
      returnTo: resultsPath,
      summary,
      orgs,
    });
  }, [loading, loadError, results, resultsPath, summary]);

  const resultCount = loading
    ? "Searching…"
    : loadError
      ? "Could not load results"
      : `${results.length} ${results.length === 1 ? "organization" : "organizations"} · ${totalFacilities} matching ${totalFacilities === 1 ? "facility" : "facilities"}`;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <SearchIcon className="h-6 w-6 text-primary" />
            Search the referral network
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary}
            {loading || loadError ? "" : ` · ${resultCount}`}
          </p>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
            A match is not a benefits or admission confirmation — still verify with the facility.
          </p>
        </div>
      </header>

      <Card className="p-4 shadow-sm sm:p-5">
        <SearchForm variant="toolbar" />
      </Card>

      {truncated && !loading && !loadError ? (
        <p className="text-xs text-amber-700">
          Showing a partial match. Narrow insurance, state, or level of care to see everything.
        </p>
      ) : null}

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card lg:min-h-[36rem] lg:flex-row">
        <aside className="shrink-0 border-b border-border/60 bg-card lg:flex lg:w-80 lg:flex-col lg:border-b-0 lg:border-r xl:w-96">
          <div className="px-4 py-3">
            <h2 className="font-heading text-sm font-semibold tracking-tight">Organizations</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{resultCount}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:max-h-[calc(100dvh-22rem)] lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:pb-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.25rem] w-64 shrink-0 rounded-xl lg:w-full" />
              ))
            ) : loadError ? (
              <Card className="w-full p-4 text-sm text-muted-foreground">Search couldn’t load. Try again.</Card>
            ) : results.length > 0 ? (
              results.map((o) => (
                <OrgListItem
                  key={o.org_id}
                  o={o}
                  selected={o.org_id === selectedOrgId}
                  onSelect={() => setSelectedOrgId(o.org_id)}
                />
              ))
            ) : (
              <Card className="w-full p-4 text-sm text-muted-foreground">
                No verified organizations match these filters.
              </Card>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : loadError ? (
            <Card className="p-8 text-center space-y-2">
              <p className="font-medium">Search couldn’t load</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Check your connection and try again. This is not an empty result set.
              </p>
            </Card>
          ) : selectedOrg ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
                    {selectedOrg.org_name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedOrg.facilities.length} matching{" "}
                    {selectedOrg.facilities.length === 1 ? "facility" : "facilities"}
                    {selectedOrg.hq_city || selectedOrg.hq_state
                      ? ` · ${[selectedOrg.hq_city, selectedOrg.hq_state].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
                </div>
                {orgHref ? (
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link to={orgHref}>
                      View org page
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
              </div>

              {selectedOrg.facilities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedOrg.facilities.map((f) => (
                    <SearchFacilityCard key={f.id} facility={f} orgSlug={selectedOrg.org_slug} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No matching facilities for this organization.
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-2">
              <Building2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No verified organizations found</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Try expanding the city, changing the level of care, or checking nearby states.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
