import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { CONDITION_OPTIONS, LEVELS_OF_CARE } from "@/components/app/facility/facility-types";
import { PLAN_TYPES, parsePlanTypeParam } from "@/lib/plan-types";
import { resolveStateCode, US_STATES } from "@/lib/us-states";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { searchWorkHrefFromFilters, type SearchFilterValues } from "@/lib/search-session";

type SearchFormVariant = "hero" | "inline" | "toolbar";

function FieldShell({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

export function SearchForm({ variant = "hero" }: { variant?: SearchFormVariant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [payerId, setPayerId] = useState<string | null>(params.get("payerId"));
  const [payerName, setPayerName] = useState(params.get("payerName") ?? "");
  const [planType, setPlanType] = useState(parsePlanTypeParam(params.get("planType")));
  const [state, setState] = useState(params.get("state") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [zip, setZip] = useState(params.get("zip") ?? "");
  const [specialty, setSpecialty] = useState(params.get("specialty") ?? "");
  const [accreditation, setAccreditation] = useState(params.get("accreditation") ?? "");
  const [loc, setLoc] = useState(params.get("loc") ?? "");
  const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>({});
  const [listedStateCodes, setListedStateCodes] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(
    () => !!(params.get("zip") || params.get("specialty") || params.get("accreditation")),
  );
  const zipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef<SearchFilterValues>({
    payerId,
    payerName,
    planType,
    state,
    city,
    zip,
    specialty,
    accreditation,
    loc,
  });
  filtersRef.current = {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("facilities")
        .select("city,state")
        .eq("verification_status", "approved")
        .not("city", "is", null);
      if (cancelled) return;
      const grouped = new Map<string, Map<string, string>>();
      for (const row of data ?? []) {
        const code = resolveStateCode(row.state);
        const cityName = (row.city ?? "").trim();
        if (!code || !cityName) continue;
        if (!grouped.has(code)) grouped.set(code, new Map());
        const cities = grouped.get(code)!;
        const key = cityName.toLowerCase();
        if (!cities.has(key)) cities.set(key, cityName);
      }
      const next: Record<string, string[]> = {};
      for (const [code, cities] of grouped) {
        next[code] = [...cities.values()].sort((a, b) => a.localeCompare(b));
      }
      setCitiesByState(next);
      setListedStateCodes(
        US_STATES.map((s) => s.code).filter((code) => (next[code]?.length ?? 0) > 0),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateCities = useMemo(() => {
    const code = resolveStateCode(state);
    const listed = code ? citiesByState[code] ?? [] : [];
    if (city && !listed.some((name) => name.toLowerCase() === city.toLowerCase())) {
      return [city, ...listed];
    }
    return listed;
  }, [state, city, citiesByState]);

  useEffect(() => {
    setPayerId(params.get("payerId"));
    setPayerName(params.get("payerName") ?? "");
    setPlanType(parsePlanTypeParam(params.get("planType")));
    setState(params.get("state") ?? "");
    setCity(params.get("city") ?? "");
    setZip(params.get("zip") ?? "");
    setSpecialty(params.get("specialty") ?? "");
    setAccreditation(params.get("accreditation") ?? "");
    setLoc(params.get("loc") ?? "");
  }, [params]);

  useEffect(() => {
    return () => {
      if (zipTimer.current) clearTimeout(zipTimer.current);
      if (accredTimer.current) clearTimeout(accredTimer.current);
    };
  }, []);

  const currentFilters = (): SearchFilterValues => filtersRef.current;

  const commit = (patch: Partial<SearchFilterValues>) => {
    const href = searchWorkHrefFromFilters({ ...currentFilters(), ...patch });
    const here = `${location.pathname}${location.search}`;
    if (href === here) return;
    navigate(href, { replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipTimer.current) clearTimeout(zipTimer.current);
    if (accredTimer.current) clearTimeout(accredTimer.current);
    commit({});
  };

  const isHero = variant === "hero";
  const isToolbar = variant === "toolbar";
  const control = isHero
    ? "h-12 rounded-xl border-border/80 bg-background text-base sm:text-sm shadow-none"
    : isToolbar
      ? "h-10 rounded-lg border-border/80 bg-background text-sm shadow-none"
      : undefined;

  return (
    <form onSubmit={submit} className={cn(!isToolbar && "space-y-4")}>
      <div
        className={cn(
          isHero && "grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-5 lg:grid-cols-12 lg:gap-x-5 lg:gap-y-5",
          isToolbar && "grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-4 lg:grid-cols-12 lg:items-end",
          !isHero && !isToolbar && "space-y-4",
        )}
      >
        <FieldShell
          label="Insurance"
          className={cn(isHero && "col-span-2 lg:col-span-12", isToolbar && "col-span-2 lg:col-span-6")}
        >
          <PayerCombobox
            payerId={payerId}
            payerName={payerName}
            onSelect={(p) => {
              setPayerId(p.id);
              setPayerName(p.name);
              commit({ payerId: p.id, payerName: p.name });
            }}
            placeholder="Any insurance"
            triggerClassName={cn("w-full font-normal", control)}
            approvedOnly
          />
        </FieldShell>

        <FieldShell
          label="Plan type"
          htmlFor="search-plan-type"
          className={cn(isHero && "col-span-1 lg:col-span-3", isToolbar && "col-span-1 lg:col-span-3")}
        >
          <Select
            value={planType || "_any"}
            onValueChange={(v) => {
              const next = v === "_any" ? "" : parsePlanTypeParam(v);
              setPlanType(next);
              commit({ planType: next });
            }}
          >
            <SelectTrigger id="search-plan-type" className={control}>
              <SelectValue placeholder="Any plan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_any">Any plan type</SelectItem>
              {PLAN_TYPES.map((pt) => (
                <SelectItem key={pt.slug} value={pt.slug}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell
          label="Level of care"
          htmlFor="search-loc"
          className={cn(isHero && "col-span-1 lg:col-span-3", isToolbar && "col-span-1 lg:col-span-3")}
        >
          <Select
            value={loc || "_any"}
            onValueChange={(v) => {
              const next = v === "_any" ? "" : v;
              setLoc(next);
              commit({ loc: next });
            }}
          >
            <SelectTrigger id="search-loc" className={control}>
              <SelectValue placeholder="Any level of care" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_any">Any level of care</SelectItem>
              {LEVELS_OF_CARE.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell
          label="State"
          htmlFor="search-state"
          className={cn(isHero && "col-span-1 lg:col-span-3", isToolbar && "col-span-1 lg:col-span-3")}
        >
          <Select
            value={state || "_any"}
            onValueChange={(v) => {
              const next = v === "_any" ? "" : v;
              setState(next);
              const code = resolveStateCode(next);
              const allowed = code ? citiesByState[code] ?? [] : [];
              const nextCity =
                city && allowed.some((name) => name.toLowerCase() === city.toLowerCase()) ? city : "";
              if (nextCity !== city) setCity(nextCity);
              if (!next) setCity("");
              commit({ state: next, city: next ? nextCity : "" });
            }}
          >
            <SelectTrigger id="search-state" className={control}>
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="_any">Any state</SelectItem>
              {(listedStateCodes.length ? US_STATES.filter((s) => listedStateCodes.includes(s.code)) : US_STATES).map(
                (s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell
          label="City"
          htmlFor="search-city"
          className={cn(isHero && "col-span-1 lg:col-span-3", isToolbar && "col-span-1 lg:col-span-3")}
        >
          <Select
            value={city || "_any"}
            onValueChange={(v) => {
              const next = v === "_any" ? "" : v;
              setCity(next);
              commit({ city: next });
            }}
            disabled={!state}
          >
            <SelectTrigger id="search-city" className={control}>
              <SelectValue placeholder={state ? "Any city" : "Select a state first"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="_any">Any city</SelectItem>
              {stateCities.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        {moreOpen ? (
          <>
            <FieldShell
              label="ZIP"
              htmlFor="search-zip"
              className={cn(isHero && "col-span-1 lg:col-span-4", isToolbar && "col-span-1 lg:col-span-3")}
            >
              <Input
                id="search-zip"
                value={zip}
                onChange={(e) => {
                  const next = e.target.value;
                  setZip(next);
                  if (zipTimer.current) clearTimeout(zipTimer.current);
                  zipTimer.current = setTimeout(() => commit({ zip: next }), 300);
                }}
                placeholder="Exact ZIP"
                inputMode="numeric"
                className={control}
              />
            </FieldShell>
            <FieldShell
              label="Specialty"
              htmlFor="search-specialty"
              className={cn(isHero && "col-span-1 lg:col-span-4", isToolbar && "col-span-1 lg:col-span-3")}
            >
              <Select
                value={specialty || "_any"}
                onValueChange={(v) => {
                  const next = v === "_any" ? "" : v;
                  setSpecialty(next);
                  commit({ specialty: next });
                }}
              >
                <SelectTrigger id="search-specialty" className={control}>
                  <SelectValue placeholder="Any specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_any">Any specialty</SelectItem>
                  {CONDITION_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell
              label="Accreditation"
              htmlFor="search-accreditation"
              className={cn(isHero && "col-span-2 lg:col-span-4", isToolbar && "col-span-2 lg:col-span-3")}
            >
              <Input
                id="search-accreditation"
                value={accreditation}
                onChange={(e) => {
                  const next = e.target.value;
                  setAccreditation(next);
                  if (accredTimer.current) clearTimeout(accredTimer.current);
                  accredTimer.current = setTimeout(() => commit({ accreditation: next }), 300);
                }}
                placeholder="e.g. Joint Commission"
                className={control}
              />
            </FieldShell>
          </>
        ) : null}

        {isHero || isToolbar ? (
          <div
            className={cn(
              "flex items-end gap-2",
              isHero && "col-span-2 pt-1 lg:col-span-12",
              isToolbar && "col-span-2 lg:col-span-6 lg:justify-end",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size={isToolbar ? "sm" : "lg"}
              className={cn("shrink-0 text-muted-foreground", isHero && "h-12", isToolbar && "h-10")}
              onClick={() => setMoreOpen((open) => !open)}
            >
              {moreOpen ? "Fewer filters" : "More filters"}
              <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
            </Button>
            <Button
              type="submit"
              variant={isHero ? "hero" : "default"}
              size={isToolbar ? "sm" : "lg"}
              className={cn(
                "w-full font-semibold",
                isHero && "h-12 rounded-xl text-base sm:text-sm",
                isToolbar && "h-10 shrink-0 whitespace-nowrap px-6 lg:w-auto lg:min-w-[8.5rem]",
              )}
            >
              <SearchIcon className="h-4 w-4" />
              Search
            </Button>
          </div>
        ) : null}
      </div>

      {!isHero && !isToolbar ? (
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <SearchIcon className="h-4 w-4" /> Search
        </Button>
      ) : null}
    </form>
  );
}
