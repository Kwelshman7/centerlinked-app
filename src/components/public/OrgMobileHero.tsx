import { useMemo, useState } from "react";
import { Building2, MapPin, BadgeCheck, Share2, Phone, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetInTouchSheet } from "@/components/public/GetInTouchSheet";
import { trackOrgEvent } from "@/lib/track-org-event";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { toast } from "sonner";

interface Props {
  org: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    description: string | null;
    tagline: string | null;
    cover_image_url: string | null;
    hq_city: string | null;
    hq_state: string | null;
    verified: boolean;
    bd_contact_name: string | null;
    bd_contact_phone: string | null;
    bd_contact_email: string | null;
  };
  facilities: ShowcaseFacility[];
  brand: string;
}

function digits(p?: string | null) {
  return p ? p.replace(/[^\d+]/g, "") : "";
}

export function OrgMobileHero({ org, facilities, brand }: Props) {
  const [copied, setCopied] = useState(false);
  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const tel = digits(org.bd_contact_phone);

  const levelsOfCare = useMemo(() => {
    const set = new Set<string>();
    facilities.forEach((f) => (f.levels_of_care ?? []).forEach((l) => l && set.add(l)));
    return Array.from(set);
  }, [facilities]);

  const handleShare = async () => {
    const url = `${window.location.origin}/o/${org.slug ?? ""}`;
    if (org.id) trackOrgEvent(org.id, "share_click");
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: `${org.name} on CenterLinked`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="sm:hidden -mx-4 -mt-5">
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        {org.cover_image_url ? (
          <img
            src={org.cover_image_url}
            alt={`${org.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${brand}, ${brand}aa)` }}
          />
        )}
      </div>

      {/* Body */}
      <div className="relative bg-card px-4 pt-2 pb-5 rounded-t-2xl -mt-4">
        {/* Overlapping logo */}
        <div className="-mt-12 mb-3">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 grid place-items-center p-2">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={`${org.name} logo`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="h-9 w-9 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Name + verified */}
        <div className="flex items-start gap-2 flex-wrap">
          <h1 className="font-heading text-2xl font-bold tracking-tight leading-tight">
            {org.name}
          </h1>
          {org.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 mt-1.5">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>

        {/* Location · facility count */}
        {(loc || facilities.length > 0) && (
          <p className="mt-1.5 text-sm text-muted-foreground inline-flex items-center gap-1.5">
            {loc && <MapPin className="h-3.5 w-3.5" />}
            <span>
              {loc}
              {loc && facilities.length > 0 ? " · " : ""}
              {facilities.length > 0 && `${facilities.length} ${facilities.length === 1 ? "facility" : "facilities"}`}
            </span>
          </p>
        )}

        {/* Tagline */}
        {org.tagline && (
          <p className="mt-2 text-sm text-foreground/85 leading-snug">{org.tagline}</p>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button
            onClick={handleShare}
            className="h-11 text-sm font-semibold rounded-full text-white hover:opacity-90"
            style={{ backgroundColor: brand }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span className="ml-1.5">Share</span>
          </Button>
          {tel ? (
            <Button
              asChild
              variant="secondary"
              className="h-11 text-sm font-semibold rounded-full"
            >
              <a
                href={`tel:${tel}`}
                onClick={() => trackOrgEvent(org.id, "contact_call")}
              >
                <Phone className="h-4 w-4" />
                <span className="ml-1.5">Call</span>
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled className="h-11 text-sm font-semibold rounded-full">
              <Phone className="h-4 w-4" />
              <span className="ml-1.5">Call</span>
            </Button>
          )}
          {org.bd_contact_email ? (
            <Button
              asChild
              variant="secondary"
              className="h-11 text-sm font-semibold rounded-full"
            >
              <a
                href={`mailto:${org.bd_contact_email}`}
                onClick={() => trackOrgEvent(org.id, "contact_email")}
              >
                <Mail className="h-4 w-4" />
                <span className="ml-1.5">Email</span>
              </a>
            </Button>
          ) : (
            <GetInTouchSheet
              orgName={org.name}
              contactName={org.bd_contact_name}
              phone={org.bd_contact_phone}
              email={org.bd_contact_email}
              organizationId={org.id}
              triggerLabel="Email"
              triggerClassName="h-11 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            />
          )}
        </div>

        {/* About */}
        {org.description && (
          <div className="mt-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70 mb-2">
              About
            </h2>
            <p className="text-sm text-foreground/85 leading-relaxed">{org.description}</p>
          </div>
        )}

        {/* Levels of Care */}
        {levelsOfCare.length > 0 && (
          <div className="mt-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70 mb-2">
              Levels of Care
            </h2>
            <div className="flex flex-wrap gap-2">
              {levelsOfCare.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${brand}14`, color: brand }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
