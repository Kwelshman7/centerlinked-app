import { useState } from "react";
import { MapPin, BadgeCheck, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgFooter } from "@/components/public/OrgFooter";
import { trackOrgEvent } from "@/lib/track-org-event";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { ContractRow } from "@/lib/derive-insurance";
import { toast } from "sonner";
import { shareOrCopyUrl } from "@/lib/share";

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
  filteredFacilities: ShowcaseFacility[];
  contracts: ContractRow[];
  brand: string;
  heroContacts: HeroContact[];
  facilityStates: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
}

export function OrgMobileHero({
  org,
  facilities,
  filteredFacilities,
  contracts,
  brand,
  heroContacts,
  facilityStates,
  selectedState,
  onStateChange,
}: Props) {
  const [copied, setCopied] = useState(false);
  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const heroTitle = org.tagline || org.name;

  const heroBg = org.cover_image_url
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.55) 100%), url(${org.cover_image_url})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : { background: `linear-gradient(135deg, ${brand}, ${brand}aa)` };

  const handleShare = async () => {
    if (!org.slug) return;
    const url = `${window.location.origin}/o/${org.slug}`;
    const ok = await shareOrCopyUrl({
      url,
      title: `${org.name} on CenterLinked`,
      onSuccess: () => {
        if (org.id) trackOrgEvent(org.id, "share_click");
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 1800);
      },
    });
    if (!ok) toast.error("Could not copy link");
  };

  const primaryContact = heroContacts[0] ?? (
    org.bd_contact_phone || org.bd_contact_email
      ? {
          name: org.bd_contact_name ?? "",
          phone: org.bd_contact_phone,
          email: org.bd_contact_email,
        }
      : null
  );
  const hasContact = !!(primaryContact && (primaryContact.phone || primaryContact.email));

  return (
    <div className="sm:hidden">
      <main className={`px-4 py-4 space-y-5 ${hasContact ? mobileContactBarPadding() : "pb-[calc(2rem+env(safe-area-inset-bottom))]"}`}>
        {/* Compact hero + contact */}
        <section className="rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
          {/* Hero image + title */}
          <div className="relative min-h-[160px] flex flex-col justify-end">
            <div className="absolute inset-0" style={heroBg} />
            <div className="relative z-[1] p-4">
              {org.verified && (
                <span className="inline-flex items-center gap-0.5 bg-white/15 backdrop-blur text-white border border-white/30 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-2">
                  <BadgeCheck className="h-2.5 w-2.5" /> Verified
                </span>
              )}
              <h1
                className="font-heading text-xl font-bold tracking-tight leading-tight text-white"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
              >
                {heroTitle}
              </h1>
              {loc && (
                <p className="mt-1.5 text-xs text-white/85 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {loc}
                </p>
              )}
            </div>
          </div>

          {heroContacts.length === 0 && (
            <div className="p-4 bg-muted/20 border-t border-border/50 flex justify-center">
              <OrgClaimCard organizationId={org.id} organizationName={org.name} />
            </div>
          )}
        </section>

        {/* Share + about */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="h-9 text-xs font-semibold rounded-full"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="ml-1.5">{copied ? "Copied" : "Share"}</span>
          </Button>
        </div>

        {org.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{org.description}</p>
        )}

        <OrgStateFilter
          states={facilityStates}
          selected={selectedState}
          onSelect={onStateChange}
          brand={brand}
        />

        <section id="facilities" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-bold tracking-tight">Our Facilities</h2>
            {filteredFacilities.length > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                {filteredFacilities.length}{" "}
                {filteredFacilities.length === 1 ? "location" : "locations"}
              </span>
            )}
          </div>
          {filteredFacilities.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
              {facilities.length === 0
                ? "No facilities published yet."
                : "No facilities in this state."}
            </div>
          ) : (
            <OrgFacilityRail
              facilities={filteredFacilities}
              contracts={contracts}
              orgSlug={org.slug}
            />
          )}
        </section>

        <OrgFooter
          orgId={org.id}
          orgName={org.name}
          slug={org.slug}
          logoUrl={org.logo_url}
          tagline={org.tagline}
          brand={brand}
          contact={
            primaryContact && (primaryContact.name || primaryContact.phone || primaryContact.email)
              ? {
                  name: primaryContact.name || "Business Development",
                  title: "Business Development",
                  phone: primaryContact.phone,
                  email: primaryContact.email,
                }
              : null
          }
        />
      </main>

      {hasContact && primaryContact && (
        <MobileContactBar
          repName={primaryContact.name || null}
          repPhone={primaryContact.phone ?? null}
          repEmail={primaryContact.email ?? null}
          brand={brand}
          organizationId={org.id}
          contextLabel={`Reach the BD rep at ${org.name}.`}
        />
      )}
    </div>
  );
}
