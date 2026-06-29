import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BadgeCheck, MapPin, Building2, Star, Users, ShieldCheck } from "lucide-react";
import { BdContactButtons } from "./BdContactButtons";
import { VerificationBadge } from "./VerificationBadge";
import { formatDistanceToNow } from "@/lib/relative-time";

export interface FacilityResult {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
  state: string | null;
  levels_of_care: string[];
  image_urls: string[];
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  organization_name: string | null;
  matched_payer: string;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  preferred_provider?: boolean;
  in_your_network?: boolean;
}

export function FacilityResultCard({ f }: { f: FacilityResult }) {
  const hero = f.image_urls?.[0];
  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        f.preferred_provider ? "border-primary/60 shadow-sm" : ""
      }`}
    >
      {f.preferred_provider && (
        <div className="absolute top-0 right-0 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-md flex items-center gap-1">
          <Star className="h-2.5 w-2.5 fill-current" /> Preferred
        </div>
      )}

      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        <Link to={`/app/facilities/${f.id}`} className="shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-border flex items-center justify-center p-1.5">
            {hero ? (
              <img
                src={hero}
                alt={f.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/app/facilities/${f.id}`} className="block">
            <h3 className="font-semibold text-base leading-snug truncate pr-16">{f.name}</h3>
            {f.organization_name && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                by {f.organization_name}
              </p>
            )}
          </Link>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {(f.city || f.state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[f.city, f.state].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {/* Prominent in-network pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-2.5 py-1">
            <BadgeCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">
              In-network: {f.matched_payer}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-2">
            {f.in_your_network && (
              <Badge className="bg-primary/10 text-primary border-primary/30 gap-1" variant="outline">
                <Users className="h-3 w-3" /> In your network
              </Badge>
            )}
            {f.levels_of_care.slice(0, 4).map((l) => (
              <span
                key={l}
                className="text-[10px] font-semibold text-foreground bg-muted rounded-full px-2 py-0.5"
              >
                {l}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-success" />
              {f.contracts_verified_at
                ? `Verified ${formatDistanceToNow(new Date(f.contracts_verified_at))} ago`
                : "Unverified"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t bg-muted/30 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {f.bd_contact_name ? (
            <p className="text-xs text-muted-foreground truncate">
              BD rep: <span className="text-foreground font-semibold">{f.bd_contact_name}</span>
            </p>
          ) : (
            <VerificationBadge verifiedAt={f.contracts_verified_at} frozen={f.verification_frozen} />
          )}
        </div>
        <BdContactButtons phone={f.bd_contact_phone} email={f.bd_contact_email} />
      </div>
    </Card>
  );
}
