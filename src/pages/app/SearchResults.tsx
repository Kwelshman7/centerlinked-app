import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Search as SearchIcon } from "lucide-react";
import { SearchForm } from "@/components/app/search/SearchForm";
import { OrgResultCard, OrgSearchResult } from "@/components/app/search/OrgResultCard";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import {
  buildPayerOrFilter,
  contractMatchesPayer,
  type PayerMatchInput,
} from "@/lib/match-payer";

type ContractRow = {
  payer_id: string | null;
  payer_name: string;
  facilities: {
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
    organization_id: string;
    organizations: {
      id: string;
      name: string;
      slug: string | null;
      logo_url: string | null;
      hq_city: string | null;
      hq_state: string | null;
    } | null;
  } | null;
};

type OrgSearchBase = Omit<OrgSearchResult, "in_your_network">;

export default function SearchResults() {
  const [params] = useSearchParams();
  const [baseResults, setBaseResults] = useState<OrgSearchBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { partnerOrgIds } = useReferralNetwork();

  const payerId = params.get("payerId");
  const payerName = params.get("payerName") ?? "";
  const state = params.get("state") ?? "";
  const city = params.get("city") ?? "";
  const loc = params.get("loc") ?? "";

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (payerName) parts.push(payerName);
    if (loc) parts.push(loc);
    const place = [city, state].filter(Boolean).join(", ");
    if (place) parts.push(`in ${place}`);
    return parts.length ? parts.join(" · ") : "All verified organizations";
  }, [payerName, loc, city, state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

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

      let q = supabase
        .from("insurance_contracts")
        .select(
          "payer_id,payer_name, facilities!inner(id,name,slug,city,state,levels_of_care,image_urls,verification_status,contracts_verified_at,verification_frozen,organization_id,organizations(id,name,slug,logo_url,hq_city,hq_state))",
        )
        .eq("in_network", true);

      if (payer) {
        q = q.or(buildPayerOrFilter(payer));
      } else if (payerId) {
        q = q.eq("payer_id", payerId);
      }

      q = q.eq("facilities.verification_status", "approved");
      q = q.eq("facilities.verification_frozen", false);
      if (state) q = q.eq("facilities.state", state);
      if (city) q = q.ilike("facilities.city", `%${city}%`);
      if (loc) q = q.contains("facilities.levels_of_care", [loc]);

      const { data, error } = await q.limit(500);
      if (cancelled) return;

      if (error) {
        setBaseResults([]);
        setLoading(false);
        return;
      }

      let rows = (data as unknown as ContractRow[]) ?? [];
      if (payer) {
        rows = rows.filter((row) => contractMatchesPayer(row, payer!));
      }

      const byOrg = new Map<string, OrgSearchBase>();
      const seenFac = new Map<string, Set<string>>();
      rows.forEach((row) => {
        const f = row.facilities;
        if (!f || !f.organizations) return;
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
        if (!seen.has(f.id)) {
          seen.add(f.id);
          entry.facilities.push({
            id: f.id,
            name: f.name,
            slug: f.slug,
            city: f.city,
            state: f.state,
            matched_payer: payer?.name ?? row.payer_name,
            levels_of_care: f.levels_of_care ?? [],
          });
          if (f.contracts_verified_at) {
            if (!entry.latest_verified_at || f.contracts_verified_at > entry.latest_verified_at) {
              entry.latest_verified_at = f.contracts_verified_at;
            }
          }
        }
      });

      setBaseResults(Array.from(byOrg.values()));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [payerId, state, city, loc]);

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

  const totalFacilities = results.reduce((n, o) => n + o.facilities.length, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/search"><ArrowLeft className="h-4 w-4" /> New search</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
          <SearchIcon className="h-4 w-4" /> {editing ? "Hide filters" : "Edit search"}
        </Button>
      </div>

      {editing && (
        <Card className="p-4 sm:p-5">
          <SearchForm />
        </Card>
      )}

      <div>
        <h1 className="text-lg sm:text-xl font-semibold">{summary}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {loading
            ? "Searching…"
            : `${results.length} ${results.length === 1 ? "organization" : "organizations"} · ${totalFacilities} matching ${totalFacilities === 1 ? "facility" : "facilities"}`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((o) => <OrgResultCard key={o.org_id} o={o} />)}
        </div>
      ) : (
        <Card className="p-8 text-center space-y-2">
          <p className="font-medium">No verified organizations found</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Try expanding the city, changing the level of care, or checking nearby states.
          </p>
        </Card>
      )}
    </div>
  );
}
