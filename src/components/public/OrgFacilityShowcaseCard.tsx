import { Link } from "react-router-dom";
import { MapPin, CheckCircle2 } from "lucide-react";
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
}

export function OrgFacilityShowcaseCard({ facility: f, contracts, orgSlug }: Props) {
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

  const topPayers = inNetwork.slice(0, 5);
  const hasMorePayers = inNetwork.length > 5;
  const hasInNetwork = topPayers.length > 0;
  const programHref = f.slug ? programPublicPath(f.slug, orgSlug) : null;

  return (
    <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="min-w-0">
        <h3 className="font-heading font-bold text-sm leading-snug break-words">
          {programHref ? (
            <Link to={programHref} className="hover:text-primary transition-colors">
              {f.name}
            </Link>
          ) : (
            f.name
          )}
        </h3>

        {(f.city || f.state) && (
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{[f.city, f.state].filter(Boolean).join(", ")}</span>
          </p>
        )}
      </div>

      {f.levels_of_care.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {f.levels_of_care.map((l) => (
            <span
              key={l}
              className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      {hasInNetwork ? (
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            In-Network
          </p>
          <ul className="space-y-0.5">
            {topPayers.map((p) => (
              <li
                key={p}
                title={p}
                className="text-[11px] text-foreground/80 font-medium truncate leading-snug"
              >
                {p}
              </li>
            ))}
          </ul>
          {hasMorePayers && (
            programHref ? (
              <Link
                to={programHref}
                className="inline-block text-[11px] font-semibold text-primary hover:underline"
              >
                +{inNetwork.length - 5} more
              </Link>
            ) : (
              <span className="text-[11px] font-semibold text-muted-foreground">
                +{inNetwork.length - 5} more
              </span>
            )
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-700">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Out of network only
        </div>
      )}
    </div>
  );
}
