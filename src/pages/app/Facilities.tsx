import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Search, MapPin, Shield, BadgeCheck, X, SlidersHorizontal, Plus } from "lucide-react";
import { LEVELS_OF_CARE } from "@/components/app/facility/facility-types";

interface FacilityRow {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
  state: string | null;
  image_urls: string[];
  levels_of_care: string[];
  highlights: string[];
  organization_id: string;
}

interface ContractRow {
  facility_id: string;
  payer_name: string;
  in_network: boolean;
}

const ANY = "__any__";
const PAGE_SIZE = 24;

export default function Facilities() {
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [stateFilter, setStateFilter] = useState<string>(ANY);
  const [payerFilter, setPayerFilter] = useState<string>(ANY);
  const [locFilter, setLocFilter] = useState<string>(ANY);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: f }, { data: c }] = await Promise.all([
        supabase
          .from("facilities")
          .select("id,name,tagline,city,state,image_urls,levels_of_care,highlights,organization_id")
          .eq("verification_status", "approved")
          .order("name"),
        supabase
          .from("insurance_contracts")
          .select("facility_id,payer_name,in_network"),
      ]);
      setFacilities((f as FacilityRow[]) ?? []);
      setContracts((c as ContractRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const contractsByFacility = useMemo(() => {
    const m = new Map<string, ContractRow[]>();
    for (const c of contracts) {
      const arr = m.get(c.facility_id) ?? [];
      arr.push(c);
      m.set(c.facility_id, arr);
    }
    return m;
  }, [contracts]);

  const states = useMemo(() => {
    const s = new Set<string>();
    facilities.forEach((f) => f.state && s.add(f.state));
    return Array.from(s).sort();
  }, [facilities]);

  const payers = useMemo(() => {
    const s = new Set<string>();
    contracts.forEach((c) => c.in_network && s.add(c.payer_name));
    return Array.from(s).sort();
  }, [contracts]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const cityLower = city.trim().toLowerCase();
    return facilities.filter((f) => {
      if (qLower && !`${f.name} ${f.tagline ?? ""}`.toLowerCase().includes(qLower)) return false;
      if (cityLower && !(f.city ?? "").toLowerCase().includes(cityLower)) return false;
      if (stateFilter !== ANY && f.state !== stateFilter) return false;
      if (locFilter !== ANY && !f.levels_of_care?.includes(locFilter)) return false;
      if (payerFilter !== ANY) {
        const cs = contractsByFacility.get(f.id) ?? [];
        if (!cs.some((c) => c.in_network && c.payer_name === payerFilter)) return false;
      }
      return true;
    });
  }, [facilities, q, city, stateFilter, locFilter, payerFilter, contractsByFacility]);

  const activeCount =
    (q ? 1 : 0) + (city ? 1 : 0) + (stateFilter !== ANY ? 1 : 0) +
    (payerFilter !== ANY ? 1 : 0) + (locFilter !== ANY ? 1 : 0);

  const clearAll = () => {
    setQ(""); setCity(""); setStateFilter(ANY); setPayerFilter(ANY); setLocFilter(ANY);
    setPage(1);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [q, city, stateFilter, payerFilter, locFilter]);

  const visibleFacilities = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleFacilities.length < filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Find a Program</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search the network to find the right placement for your patient.
          </p>
        </div>
      </div>



      {/* Search bar */}
      <Card className="p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search facilities by name…"
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

          <div className={`grid gap-2 sm:grid-cols-2 lg:grid-cols-4 ${showFilters ? "" : "hidden sm:grid"}`}>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-11"
            />
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-11"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All states</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={locFilter} onValueChange={setLocFilter}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Level of care" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All levels of care</SelectItem>
                {LEVELS_OF_CARE.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={payerFilter} onValueChange={setPayerFilter}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Insurance / payer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All insurance</SelectItem>
                {payers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          {facilities.length === 0 ? (
            <>
              <p className="font-medium">No verified programs yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Programs appear here once they've been submitted and verified. Add your own facilities to get started.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/app/onboarding?add=1">
                  <Plus className="h-4 w-4" /> Add a facility
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="font-medium">No programs match your search</p>
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
        <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFacilities.map((f) => {
            const cs = contractsByFacility.get(f.id) ?? [];
            const inNet = cs.filter((c) => c.in_network);
            return (
              <Link
                key={f.id}
                to={`/app/facilities/${f.id}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="aspect-video bg-muted overflow-hidden relative">
                  {f.image_urls?.[0] ? (
                    <img
                      src={f.image_urls[0]}
                      alt={f.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Building2 className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-1 text-xs font-medium shadow-sm">
                    <BadgeCheck className="h-3.5 w-3.5 text-success" /> Verified
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div>
                    <h3 className="font-semibold leading-tight line-clamp-1">{f.name}</h3>
                    {(f.city || f.state) && (
                      <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[f.city, f.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  {f.levels_of_care?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.levels_of_care.slice(0, 3).map((l) => (
                        <Badge key={l} variant="secondary" className="text-[10px] font-medium">{l}</Badge>
                      ))}
                      {f.levels_of_care.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">+{f.levels_of_care.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      {inNet.length > 0 ? (
                        <span className="truncate">
                          <span className="font-medium text-foreground">{inNet.length}</span> in-network {inNet.length === 1 ? "contract" : "contracts"}
                        </span>
                      ) : (
                        <span>No listed contracts</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
              Load more ({filtered.length - visibleFacilities.length} remaining)
            </Button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
