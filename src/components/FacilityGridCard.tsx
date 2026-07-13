import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";

export interface FacilityGridCardData {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  image_urls?: string[] | null;
  levels_of_care?: string[] | null;
}

interface FacilityGridCardProps {
  facility: FacilityGridCardData;
  /** Destination when the card is clicked. If omitted, renders a non-link tile. */
  href?: string | null;
}

export function FacilityGridCard({ facility: f, href }: FacilityGridCardProps) {
  const stateLabel = f.state
    ? stateDisplayName(resolveStateCode(f.state) ?? f.state)
    : null;
  const levels = f.levels_of_care ?? [];
  const imageUrl = f.image_urls?.[0] ?? null;

  const body = (
    <>
      <div className="aspect-[16/10] bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={f.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {f.name}
        </p>
        {(f.city || stateLabel) && (
          <p className="text-[11px] text-muted-foreground truncate">
            {[f.city, stateLabel].filter(Boolean).join(", ")}
          </p>
        )}
        {levels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {levels.slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {l}
              </span>
            ))}
            {levels.length > 3 && (
              <span className="text-[9px] text-muted-foreground font-semibold">
                +{levels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const className =
    "group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all";

  if (href) {
    return (
      <Link to={href} className={className} aria-label={`View ${f.name}`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

/** Shared grid wrapper matching the org dashboard facility layout. */
export function FacilityGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {children}
    </div>
  );
}
