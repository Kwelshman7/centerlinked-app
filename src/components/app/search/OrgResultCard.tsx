import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ShieldCheck, ArrowRight, Star, Users } from "lucide-react";

export interface OrgSearchResult {
  org_id: string;
  org_name: string;
  org_slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
  in_your_network: boolean;
  facilities: Array<{
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    matched_payer: string;
    levels_of_care: string[];
  }>;
  latest_verified_at: string | null;
}

export function OrgResultCard({ o }: { o: OrgSearchResult }) {
  const orgHref = o.org_slug ? `/o/${o.org_slug}` : "#";
  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        o.in_your_network ? "border-primary/60 shadow-sm" : ""
      }`}
    >
      {o.in_your_network && (
        <div className="absolute top-0 right-0 z-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-md flex items-center gap-1">
          <Star className="h-2.5 w-2.5 fill-current" /> Preferred
        </div>
      )}


      <Link to={orgHref} className="block hover:bg-accent/30 transition-colors">
        <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white border border-border flex items-center justify-center p-2.5">
              {o.logo_url ? (
                <img src={o.logo_url} alt={o.org_name} className="w-full h-full object-contain" loading="lazy" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-base leading-snug truncate pr-16">{o.org_name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {(o.hq_city || o.hq_state) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[o.hq_city, o.hq_state].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-foreground/80 font-semibold">
                <ShieldCheck className="h-3 w-3 text-success" />
                {o.facilities.length} {o.facilities.length === 1 ? "match" : "matches"}
              </span>
              {o.in_your_network && (
                <span className="inline-flex items-center gap-1 text-primary font-semibold">
                  <Users className="h-3 w-3" /> In your network
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-3 sm:px-4 pb-3">
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
          {o.facilities.slice(0, 5).map((f) => (
            <li key={f.id}>
              <Link to={f.slug ? `/p/${f.slug}` : "#"} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-accent transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[f.city, f.state].filter(Boolean).join(", ")}
                    {f.levels_of_care?.[0] && ` · ${f.levels_of_care[0]}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {f.matched_payer}
                </span>
              </Link>
            </li>
          ))}
          {o.facilities.length > 5 && (
            <li className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/50">
              +{o.facilities.length - 5} more facilities
            </li>
          )}
        </ul>
      </div>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <Button asChild size="sm" className="w-full">
          <Link to={orgHref}>
            View organization page <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
