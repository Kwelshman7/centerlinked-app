import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SearchForm } from "@/components/app/search/SearchForm";
import { InviteColleagueCard } from "@/components/app/InviteColleagueCard";
import { AddFacilityDialog } from "@/components/app/facility/AddFacilityDialog";
import { SearchProgramRow } from "@/components/app/search/SearchProgramRow";
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
import { hasAssignedBdContact, normalizeBdEmail } from "@/lib/bd-contact";
import type { OrgSearchFacility, OrgSearchResult } from "@/components/app/search/OrgResultCard";
import { rememberSearchSession, hasSearchCriteria, searchWorkHref, searchWorkHrefFromFilters, type SearchFilterValues } from "@/lib/search-session";

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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [baseResults, setBaseResults] = useState<OrgSearchBase[]>([]);
  const [loading, setLoading] = useState(() => hasSearchCriteria(params));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const { profile, isSuperAdmin } = useAuth();
  const { partners, partnerOrgIds, addPartner, removePartner } = useReferralNetwork();
  const [preferredBusyId, setPreferredBusyId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(() => !hasSearchCriteria(params));
  const canStar = Boolean(profile?.organization_id);
  const [ownFacilityCount, setOwnFacilityCount] = useState<number | null>(null);

  useEffect(() => {
    if (!profile?.organization_id) {
      setOwnFacilityCount(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("facilities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .then(({ count, error }) => {
        if (cancelled) return;
        // A failed count must not hide Add facility / invite. Treat it as zero.
        if (error) {
          toast.error("Couldn't load your programs", { description: error.message });
          setOwnFacilityCount(0);
          return;
        }
        setOwnFacilityCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.organization_id]);

  const payerId = params.get("payerId");
  const payerName = params.get("payerName") ?? "";
  const planType = parsePlanTypeParam(params.get("planType"));
  const state = params.get("state") ?? "";
  const city = params.get("city") ?? "";
  const zip = (params.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
  const specialty = params.get("specialty") ?? "";
  const accreditation = params.get("accreditation") ?? "";
  const loc = params.get("loc") ?? "";
  const canSearch = hasSearchCriteria(params);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (payerName) parts.push(payerName);
    if (planType) parts.push(planTypeShortLabel(planType));
    if (loc) parts.push(loc);
    if (specialty) parts.push(specialty);
    if (accreditation) parts.push(accreditation);
    const place = [city, US_STATES.find((s) => s.code === state)?.name || state, zip].filter(Boolean).join(", ");
    if (place) parts.push(`in ${place}`);
    if (!canSearch && parts.length === 0) return "Start with insurance or a state";
    return parts.length ? parts.join(" · ") : "Matching programs";
  }, [payerName, planType, loc, specialty, accreditation, city, state, zip, canSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canSearch) {
        setBaseResults([]);
        setLoadError(null);
        setTruncated(false);
        setLoading(false);
        return;
      }

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
        if (f.verification_frozen) return;
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

        q = q.eq("in_network", true);
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
          addFacility(row, null, { skipMatchBadge: !row.self_pay_only });
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
  }, [canSearch, payerId, planType, state, city, zip, loc, specialty, accreditation]);

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

  const [avatarByFacility, setAvatarByFacility] = useState<Record<string, string>>({});

  useEffect(() => {
    const assigned = results.flatMap((org) =>
      org.facilities.filter((facility) =>
        hasAssignedBdContact({
          bd_contact_name: facility.bd_contact_name,
          bd_contact_phone: facility.bd_contact_phone,
          bd_contact_email: facility.bd_contact_email,
        }),
      ),
    );
    if (!assigned.length) {
      setAvatarByFacility({});
      return;
    }

    let cancelled = false;
    const facilityIds = assigned.map((facility) => facility.id);

    void (async () => {
      const next: Record<string, string> = {};
      const { data: assignments } = await supabase
        .from("facility_bd_assignments")
        .select("facility_id,representative_id")
        .in("facility_id", facilityIds)
        .eq("is_primary", true);
      const assignmentRows = assignments ?? [];
      const repIds = Array.from(new Set(assignmentRows.map((row) => row.representative_id)));

      if (repIds.length) {
        const { data: reps } = await supabase
          .from("bd_representatives")
          .select("id,avatar_url,user_id")
          .in("id", repIds);
        const userIds = (reps ?? []).map((row) => row.user_id).filter((id): id is string => Boolean(id));
        const profileByUser = new Map<string, string>();
        if (userIds.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id,avatar_url")
            .in("user_id", userIds);
          for (const profile of profiles ?? []) {
            if (profile.avatar_url) profileByUser.set(profile.user_id, profile.avatar_url);
          }
        }
        const avatarByRep = new Map(
          (reps ?? []).map((row) => [
            row.id,
            row.avatar_url || (row.user_id ? profileByUser.get(row.user_id) ?? null : null),
          ]),
        );
        for (const row of assignmentRows) {
          const url = avatarByRep.get(row.representative_id);
          if (url) next[row.facility_id] = url;
        }
      }

      const missingEmails = assigned
        .filter((facility) => !next[facility.id])
        .map((facility) => normalizeBdEmail(facility.bd_contact_email))
        .filter((email): email is string => Boolean(email));
      if (missingEmails.length) {
        const uniqueEmails = Array.from(new Set(missingEmails));
        const { data: reps } = await supabase
          .from("bd_representatives")
          .select("email,avatar_url,user_id")
          .in("email", uniqueEmails)
          .eq("active", true);
        const userIds = (reps ?? []).map((row) => row.user_id).filter((id): id is string => Boolean(id));
        const profileByUser = new Map<string, string>();
        if (userIds.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id,avatar_url")
            .in("user_id", userIds);
          for (const profile of profiles ?? []) {
            if (profile.avatar_url) profileByUser.set(profile.user_id, profile.avatar_url);
          }
        }
        const avatarByEmail = new Map<string, string>();
        for (const row of reps ?? []) {
          const email = normalizeBdEmail(row.email);
          const url = row.avatar_url || (row.user_id ? profileByUser.get(row.user_id) ?? null : null);
          if (email && url) avatarByEmail.set(email, url);
        }
        for (const facility of assigned) {
          const email = normalizeBdEmail(facility.bd_contact_email);
          const url = email ? avatarByEmail.get(email) : null;
          if (url && !next[facility.id]) next[facility.id] = url;
        }
      }

      if (!cancelled) setAvatarByFacility(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [results]);

  const togglePreferred = async (orgId: string, name: string) => {
    if (!canStar) return;
    setPreferredBusyId(orgId);
    if (partnerOrgIds.has(orgId)) {
      const row = partners.find((partner) => partner.id === orgId);
      const { error } = row
        ? await removePartner(row.rowId)
        : { error: "Could not update preferred providers." };
      if (error) toast.error(error);
      else toast.success(`${name} removed from preferred providers`);
    } else {
      const { error } = await addPartner(orgId);
      if (error) toast.error(error);
      else toast.success(`${name} marked as a preferred provider`);
    }
    setPreferredBusyId(null);
  };

  const programs = useMemo(
    () =>
      results
        .flatMap((org) => org.facilities.map((facility) => ({ facility, org })))
        .sort((a, b) => {
          if (a.org.in_your_network !== b.org.in_your_network) return a.org.in_your_network ? -1 : 1;
          const va = a.facility.insurance_verified_at ?? a.org.latest_verified_at ?? "";
          const vb = b.facility.insurance_verified_at ?? b.org.latest_verified_at ?? "";
          if (va !== vb) return vb.localeCompare(va);
          return a.facility.name.localeCompare(b.facility.name);
        }),
    [results],
  );

  const resultsPath = searchWorkHref(params);

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

  useEffect(() => {
    if (!canSearch) setFiltersOpen(true);
  }, [canSearch]);

  const resultCount = !canSearch
    ? null
    : loading
      ? "Searching…"
      : loadError
        ? "Could not load results"
        : `${programs.length} ${programs.length === 1 ? "program" : "programs"}`;

  const chips: Array<{ key: string; label: string; clear: Partial<SearchFilterValues> }> = [];
  if (payerId) chips.push({ key: "payer", label: payerName || "Insurance", clear: { payerId: null, payerName: "" } });
  if (planType) chips.push({ key: "plan", label: planTypeShortLabel(planType), clear: { planType: "" } });
  if (loc) chips.push({ key: "loc", label: loc, clear: { loc: "" } });
  if (state) {
    const stateLabel = US_STATES.find((s) => s.code === state)?.name ?? state;
    chips.push({ key: "state", label: stateLabel, clear: { state: "", city: "" } });
  }
  if (city) chips.push({ key: "city", label: city, clear: { city: "" } });
  if (zip) chips.push({ key: "zip", label: zip, clear: { zip: "" } });
  if (specialty) chips.push({ key: "specialty", label: specialty, clear: { specialty: "" } });
  if (accreditation) chips.push({ key: "accreditation", label: accreditation, clear: { accreditation: "" } });

  const currentFilters = {
    payerId,
    payerName,
    planType,
    state,
    city,
    zip,
    specialty,
    accreditation,
    loc,
  };

  return (
    <div className="min-w-0">
      {!profile?.organization_id && !isSuperAdmin ? (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Your free account is ready. Search now, invite other BD reps, or add your organization and contracts when you are.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/setup-organization">Add organization</Link>
            </Button>
            <InviteColleagueCard inline />
          </div>
        </div>
      ) : profile?.organization_id && (ownFacilityCount == null || ownFacilityCount === 0) ? (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Add your first facility and in-network insurance, or invite teammates on your work email.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AddFacilityDialog
              organizationId={profile.organization_id}
              onCreated={(facilityId) => {
                setOwnFacilityCount((n) => (n == null ? 1 : n + 1));
                if (facilityId) navigate(`/app/facilities/${facilityId}`);
              }}
              triggerLabel="Add facility and insurance"
            />
            <Button asChild size="sm" variant="outline">
              <Link to="/app/members">Invite teammates</Link>
            </Button>
            <InviteColleagueCard inline />
          </div>
        </div>
      ) : profile?.organization_id && ownFacilityCount != null && ownFacilityCount > 0 ? (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Add another facility and insurance, invite teammates, or share CenterLinked with a BD rep at another org.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AddFacilityDialog
              organizationId={profile.organization_id}
              onCreated={(facilityId) => {
                setOwnFacilityCount((n) => (n == null ? 1 : n + 1));
                if (facilityId) navigate(`/app/facilities/${facilityId}`);
              }}
              triggerLabel="Add facility and insurance"
              triggerVariant="outline"
            />
            <Button asChild size="sm" variant="outline">
              <Link to="/app/members">Invite teammates</Link>
            </Button>
            <InviteColleagueCard inline />
          </div>
        </div>
      ) : null}
    <div className="min-w-0 lg:flex lg:items-start lg:gap-6">
      <aside className="min-w-0 shrink-0 lg:sticky lg:top-16 lg:w-72 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto xl:w-80">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold tracking-tight">Find in-network care</h1>
              <p className={cn("mt-1 text-sm text-muted-foreground lg:mb-4", canSearch && "hidden lg:block")}>
                Search approved programs by insurance, location, and level of care. Each result includes who to call.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1.5 text-xs font-medium lg:hidden"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Filters
              {chips.length > 0 ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {chips.length}
                </span>
              ) : null}
            </button>
          </div>
          <div className={cn("mt-4", !filtersOpen && "hidden lg:block")}>
            <SearchForm variant="panel" />
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1 pt-4 lg:pt-0">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {resultCount ?? "Programs"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {canSearch ? summary : "Choose insurance or a state to see matching programs."}
            </p>
          </div>
        </div>

        {chips.length > 0 ? (
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
                  onClick={() => navigate(searchWorkHrefFromFilters({ ...currentFilters, ...chip.clear }), { replace: true })}
                >
                  {chip.label}
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {truncated && !loading && !loadError ? (
          <p className="mb-3 text-xs text-amber-700">
            Showing a partial match. Narrow insurance, state, or level of care to see everything.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          {!canSearch ? (
            <div className="px-6 py-16 text-center">
              <SearchIcon className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
              <p className="font-heading font-semibold">Start with insurance or location</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Results are approved programs in the network — not a public treatment directory.
              </p>
            </div>
          ) : loading ? (
            <div className="divide-y divide-border/70">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-4">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="px-6 py-16 text-center">
              <p className="font-heading font-semibold">Search couldn’t load</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Check your connection and try again. This is not an empty result set.
              </p>
            </div>
          ) : programs.length > 0 ? (
            <div className="divide-y divide-border/70">
              {programs.map(({ facility, org }) => (
                <SearchProgramRow
                  key={facility.id}
                  facility={facility}
                  orgName={org.org_name}
                  orgSlug={org.org_slug}
                  orgLogo={org.logo_url}
                  organizationId={org.org_id}
                  preferred={org.in_your_network}
                  onTogglePreferred={
                    canStar ? () => void togglePreferred(org.org_id, org.org_name) : undefined
                  }
                  preferredBusy={preferredBusyId === org.org_id}
                  avatarUrl={avatarByFacility[facility.id]}
                />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-heading font-semibold">No matching programs</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Try a nearby state, another level of care, or clearing a filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
    </div>
  );
}
