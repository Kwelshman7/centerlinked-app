import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, MapPin, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { programPublicPath } from "@/lib/public-urls";

export interface OrgSearchFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  matched_payer?: string;
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
  const shown = o.facilities.slice(0, facilityLimit);
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
                    {f.matched_payer ? (
                      <span className="self-start text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-px rounded-full truncate max-w-full">
                        {f.matched_payer}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {overflow > 0 && (
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
