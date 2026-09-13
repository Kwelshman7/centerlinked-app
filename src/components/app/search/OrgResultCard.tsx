import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, MapPin, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { programPublicPath } from "@/lib/public-urls";
import { formatPlanTypeList } from "@/lib/plan-types";
import { InsuranceMatchBadge } from "@/components/app/search/InsuranceMatchBadge";
import type { InsuranceMatchStatus } from "@/lib/insurance-contract-status";

export interface OrgSearchFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  image_urls?: string[];
  matched_payer?: string;
  matched_plan_types?: string[];
  insurance_match_status?: InsuranceMatchStatus;
  insurance_verified_at?: string | null;
  levels_of_care?: string[];
}

export interface OrgSearchResult {
  org_id: string;
  org_name: string;
  org_slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
  in_your_network: boolean;
  facilities: OrgSearchFacility[];
  latest_verified_at: string | null;
}

interface Props {
  o: OrgSearchResult;
  /** Max facilities listed before "+N more". */
  facilityLimit?: number;
  /**
   * When true, hide the facility list behind a small expand control
   * (search results). Network cards keep facilities visible by default.
   */
  collapsibleFacilities?: boolean;
  className?: string;
}

/**
 * Organization search/network card — logo on top, matching facilities below.
 * Designed for a 2-column mobile grid (same density as org facility cards).
 */
export function OrgResultCard({
  o,
  facilityLimit = 4,
  collapsibleFacilities = false,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const orgHref = o.org_slug ? `/o/${o.org_slug}` : "#";
  const shown =
    collapsibleFacilities && expanded ? o.facilities : o.facilities.slice(0, facilityLimit);
  const overflow = Math.max(0, o.facilities.length - shown.length);
  const showFacilities = !collapsibleFacilities || expanded;
  const matchLabel = `${o.facilities.length} ${o.facilities.length === 1 ? "match" : "matches"}`;

  return (
    <article
      className={cn(
        "group flex flex-col rounded-xl border bg-card overflow-hidden h-full transition-all hover:border-primary/40 hover:shadow-md",
        o.in_your_network ? "border-primary/60 shadow-sm" : "border-border/60",
        className,
      )}
    >
      <Link to={orgHref} className="block shrink-0">
        <div className="relative aspect-[4/3] bg-muted/40 border-b border-border/60 flex items-center justify-center p-4 sm:p-5">
          {o.in_your_network && (
            <span className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
              Pref
            </span>
          )}
          {o.logo_url ? (
            <img
              src={o.logo_url}
              alt={`${o.org_name} logo`}
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/70" />
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 min-h-0 p-2.5 sm:p-3.5 gap-1.5">
        <Link to={orgHref} className="min-w-0 space-y-0.5">
          <h3 className="font-heading font-bold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {o.org_name}
          </h3>
          {(o.hq_city || o.hq_state) && (
            <p className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground min-w-0">
              <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="truncate">
                {[o.hq_city, o.hq_state].filter(Boolean).join(", ")}
              </span>
            </p>
          )}
        </Link>

        {collapsibleFacilities ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-expanded={expanded}
            className="mt-auto flex items-center justify-between gap-2 w-full rounded-lg border border-border/60 bg-muted/25 px-2 sm:px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-foreground/80 min-w-0">
              <ShieldCheck className="h-3 w-3 text-success shrink-0" aria-hidden />
              <span className="truncate">{matchLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : (
          <p className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-foreground/75">
            <ShieldCheck className="h-2.5 w-2.5 text-success shrink-0" aria-hidden />
            {matchLabel}
          </p>
        )}

        {showFacilities && shown.length > 0 ? (
          <ul className="divide-y divide-border/50 rounded-lg border border-border/60 bg-muted/25 overflow-hidden">
            {shown.map((f) => {
              const href = f.slug
                ? programPublicPath(f.slug, o.org_slug)
                : `/app/facilities/${f.id}`;
              const place = [f.city, f.state].filter(Boolean).join(", ");
              const level = f.levels_of_care?.[0];
              return (
                <li key={f.id}>
                  <Link
                    to={href}
                    className="flex flex-col gap-0.5 px-2 sm:px-2.5 py-1.5 sm:py-2 hover:bg-accent/60 transition-colors min-w-0"
                  >
                    <p className="text-[11px] sm:text-xs font-semibold leading-snug line-clamp-1">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {[place, level].filter(Boolean).join(" · ")}
                    </p>
                    {f.insurance_match_status ? (
                      <InsuranceMatchBadge
                        status={f.insurance_match_status}
                        payerName={
                          f.matched_plan_types?.length
                            ? `${f.matched_payer} — ${formatPlanTypeList(f.matched_plan_types)}`
                            : f.matched_payer
                        }
                      />
                    ) : f.matched_payer ? (
                      <span className="self-start text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-px rounded-full truncate max-w-full">
                        {f.matched_plan_types?.length
                          ? `${f.matched_payer} — ${formatPlanTypeList(f.matched_plan_types)}`
                          : f.matched_payer}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {overflow > 0 && !expanded && (
              <li className="px-2 sm:px-2.5 py-1.5 text-[10px] text-muted-foreground bg-muted/40">
                <Link to={orgHref} className="hover:text-foreground transition-colors">
                  +{overflow} more {overflow === 1 ? "facility" : "facilities"}
                </Link>
              </li>
            )}
          </ul>
        ) : null}

        {showFacilities && shown.length === 0 ? (
          <p className="text-[10px] sm:text-xs text-muted-foreground">No matching facilities</p>
        ) : null}
      </div>
    </article>
  );
}

/** Responsive org results grid — 2 columns on mobile, more on larger screens. */
export function OrgResultGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Selectable row for the search-results organization list. */
export function OrgListItem({
  o,
  selected,
  onSelect,
}: {
  o: OrgSearchResult;
  selected: boolean;
  onSelect: () => void;
}) {
  const matchLabel = `${o.facilities.length} ${o.facilities.length === 1 ? "match" : "matches"}`;
  const place = [o.hq_city, o.hq_state].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full min-w-[16rem] shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors lg:min-w-0",
        selected
          ? "border-primary/50 bg-primary/10 shadow-sm"
          : "border-border/60 bg-card hover:border-primary/30 hover:bg-accent/50",
      )}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
        {o.logo_url ? (
          <img src={o.logo_url} alt="" className="max-h-full max-w-full object-contain p-1" />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground/70" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold leading-snug">{o.org_name}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {place || matchLabel}
          {place ? ` · ${matchLabel}` : ""}
        </p>
      </div>
      {o.in_your_network ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
          <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
          Pref
        </span>
      ) : null}
    </button>
  );
}

/** Facility tile shown after an organization is selected in search results. */
export function SearchFacilityCard({
  facility: f,
  orgSlug,
}: {
  facility: OrgSearchFacility;
  orgSlug: string | null;
}) {
  const href = f.slug ? programPublicPath(f.slug, orgSlug) : `/app/facilities/${f.id}`;
  const place = [f.city, f.state].filter(Boolean).join(", ");
  const imageUrl = f.image_urls?.[0] ?? null;
  const levels = f.levels_of_care ?? [];
  const payerLabel = f.matched_payer
    ? f.matched_plan_types?.length
      ? `${f.matched_payer} — ${formatPlanTypeList(f.matched_plan_types)}`
      : f.matched_payer
    : null;

  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Building2 className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary">
            {f.name}
          </h3>
          {place ? (
            <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{place}</span>
            </p>
          ) : null}
        </div>
        {levels.length > 0 ? (
          <p className="line-clamp-2 text-[11px] text-foreground/75">{levels.slice(0, 3).join(" · ")}</p>
        ) : null}
        {f.insurance_match_status ? (
          <div className="mt-auto space-y-1">
            <InsuranceMatchBadge
              status={f.insurance_match_status}
              payerName={payerLabel}
            />
            {f.insurance_match_status === "verified" && f.insurance_verified_at ? (
              <p className="text-[10px] text-muted-foreground">
                Verified {new Date(f.insurance_verified_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : payerLabel ? (
          <span className="mt-auto self-start truncate rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            {payerLabel}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
