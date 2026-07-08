import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronDown, Building2, CheckCircle2, Users, Sparkles, Home, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractRow } from "@/lib/derive-insurance";
import { programPublicPath } from "@/lib/public-urls";

export interface ShowcaseFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  address_line1?: string | null;
  zip?: string | null;
  image_urls: string[];
  levels_of_care: string[];
  population_served?: string[] | null;
  specializations?: string[] | null;
  highlights?: string[] | null;
  accreditations?: string[] | null;
  short_description: string | null;
  description?: string | null;
  tagline?: string | null;
  insurance_status: string | null;
  featured_payer: string | null;
  updated_at?: string | null;
}

interface Props {
  facility: ShowcaseFacility;
  contracts: ContractRow[];
  orgSlug?: string | null;
  onExpandChange?: (open: boolean) => void;
}

export function OrgFacilityShowcaseCard({ facility: f, contracts, orgSlug, onExpandChange }: Props) {
  const [open, setOpen] = useState(false);
  const [showAllPayers, setShowAllPayers] = useState(false);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      onExpandChange?.(next);
      return next;
    });
  };

  // Build de-duped in-network payer list for this facility.
  // Featured payer (if any) is bubbled to the front.
  const inNetwork = (() => {
    const mine = contracts.filter((c) => c.facility_id === f.id && c.in_network);
    const seen = new Set<string>();
    const names: string[] = [];
    for (const c of mine) {
      const key = c.payer_name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      names.push(c.payer_name.trim());
    }
    if (f.featured_payer) {
      const idx = names.findIndex(
        (n) => n.toLowerCase() === f.featured_payer!.toLowerCase(),
      );
      if (idx > 0) {
        const [feat] = names.splice(idx, 1);
        names.unshift(feat);
      }
    }
    return names;
  })();

  const topPayers = inNetwork.slice(0, 6);
  const extra = Math.max(0, inNetwork.length - topPayers.length);
  const hasInNetwork = topPayers.length > 0;

  const programHref = f.slug ? programPublicPath(f.slug, orgSlug) : null;

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {programHref ? (
        <Link
          to={programHref}
          className="aspect-[4/3] w-full bg-muted overflow-hidden block group"
          aria-label={`View ${f.name}`}
        >
          {f.image_urls?.[0] ? (
            <img
              src={f.image_urls[0]}
              alt={f.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </Link>
      ) : (
        <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
          {f.image_urls?.[0] ? (
            <img
              src={f.image_urls[0]}
              alt={f.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-heading font-bold text-base sm:text-[17px] leading-snug break-words">
            {programHref ? (
              <Link to={programHref} className="hover:text-primary transition-colors">
                {f.name}
              </Link>
            ) : (
              f.name
            )}
          </h3>

          {(f.city || f.state) && (
            <p className="text-xs sm:text-sm text-primary mt-1 inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {[f.city, f.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {f.levels_of_care.slice(0, 4).map((l) => (
            <span
              key={l}
              className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded"
            >
              {l}
            </span>
          ))}
        </div>

        {hasInNetwork ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              In-Network Contracts
            </p>
            <div className="grid grid-cols-1 gap-y-1">
              {(showAllPayers ? inNetwork : topPayers).map((p) => (
                <div
                  key={p}
                  title={p}
                  className="text-[11px] sm:text-xs text-foreground/85 font-medium break-words leading-snug"
                >
                  {p}
                </div>
              ))}
            </div>
            {extra > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllPayers((v) => !v);
                }}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                {showAllPayers ? "Show less" : `+${extra} more`}
              </button>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Out of network only
          </div>
        )}


        {!open && (f.short_description || f.description) && (
          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-2">
            {f.short_description || f.description}
          </p>
        )}

        {open && (
          <div className="space-y-3 pt-2 border-t border-border/60 mt-1">
            {f.levels_of_care?.length > 4 && (
              <DetailGroup icon={<Home className="h-3 w-3" />} label="All Levels of Care">
                {f.levels_of_care.map((x) => (
                  <Pill key={x}>{x}</Pill>
                ))}
              </DetailGroup>
            )}

            {f.population_served && f.population_served.length > 0 && (
              <DetailGroup icon={<Users className="h-3 w-3" />} label="Population">
                {f.population_served.map((x) => (
                  <Pill key={x}>{x}</Pill>
                ))}
              </DetailGroup>
            )}

            {f.specializations && f.specializations.length > 0 && (
              <DetailGroup icon={<Sparkles className="h-3 w-3" />} label="Type of Therapy">
                {f.specializations.map((x) => (
                  <Pill key={x}>{x}</Pill>
                ))}
              </DetailGroup>
            )}

            {f.highlights && f.highlights.length > 0 && (
              <DetailGroup icon={<Star className="h-3 w-3" />} label="Amenities">
                {f.highlights.map((x) => (
                  <Pill key={x}>{x}</Pill>
                ))}
              </DetailGroup>
            )}

            {f.accreditations && f.accreditations.length > 0 && (
              <DetailGroup icon={<Award className="h-3 w-3" />} label="Accreditations">
                {f.accreditations.map((x) => (
                  <Pill key={x}>{x}</Pill>
                ))}
              </DetailGroup>
            )}

          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline self-start"
        >
          {open ? "View less" : "View more"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>
    </div>
  );
}

function DetailGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 mb-1.5">
        {icon}
        {label}
      </p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium bg-muted text-foreground/80 px-1.5 py-0.5 rounded">
      {children}
    </span>
  );
}
