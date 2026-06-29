import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import {
  deriveInsuranceBadge,
  insuranceBadgeClasses,
  ContractRow,
} from "@/lib/derive-insurance";

export interface FacilityGridItem {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  image_urls: string[];
  levels_of_care: string[];
  treatment_focus: string | null;
  insurance_status: string | null;
  featured_payer: string | null;
}

interface Props {
  facility: FacilityGridItem;
  contracts: ContractRow[];
}

export function FacilityGridCard({ facility: f, contracts }: Props) {
  const badge = deriveInsuranceBadge(f.id, contracts, {
    statusOverride: f.insurance_status,
    featuredPayer: f.featured_payer,
  });
  // Shorten verbose labels so they fit cleanly inside the pill
  const shortLabel =
    badge.tone === "verify"
      ? "Verify Insurance"
      : badge.label.length > 28
        ? badge.label.replace(/^In-Network with /, "") + " · In-Network"
        : badge.label;

  return (
    <Card className="overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all flex flex-col group h-full">
      <Link
        to={f.slug ? `/p/${f.slug}` : "#"}
        className="block aspect-[4/3] w-full overflow-hidden bg-muted"
      >
        {f.image_urls?.[0] ? (
          <img
            src={f.image_urls[0]}
            alt={f.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="min-h-[2.75rem]">
          <Link
            to={f.slug ? `/p/${f.slug}` : "#"}
            className="font-heading font-bold leading-snug hover:text-primary transition-colors line-clamp-1 block"
          >
            {f.name}
          </Link>
          {(f.city || f.state) && (
            <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1 truncate max-w-full">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{[f.city, f.state].filter(Boolean).join(", ")}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
          {f.levels_of_care.slice(0, 3).map((l) => (
            <span
              key={l}
              className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded"
            >
              {l}
            </span>
          ))}
          {f.levels_of_care.length > 3 && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              +{f.levels_of_care.length - 3}
            </span>
          )}
        </div>

        <div className="min-h-[1.75rem] flex items-start">
          <span
            className={`inline-block max-w-full text-[10px] font-semibold uppercase tracking-wide border px-2 py-1 rounded-md leading-tight break-words ${insuranceBadgeClasses(badge.tone)}`}
          >
            {shortLabel}
          </span>
        </div>

        <Button asChild size="sm" variant="outline" className="mt-auto w-full">
          <Link to={f.slug ? `/p/${f.slug}` : "#"}>
            Learn More <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
