import { useMemo } from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgFooter } from "@/components/public/OrgFooter";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { ContractRow } from "@/lib/derive-insurance";
import { resolveStateCode } from "@/lib/us-states";
import { cn } from "@/lib/utils";

export interface OrgSheetData {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  website: string | null;
  hq_city: string | null;
  hq_state: string | null;
  brand_color: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  program_badges: string[];
  announcement: string | null;
  why_refer: { title: string; body: string }[];
}

interface Props {
  org: OrgSheetData;
  facilities: ShowcaseFacility[];
  contracts: ContractRow[];
  heroContact: HeroContact | null;
  brand: string;
  facilityStates: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
}

export function OrganizationSheetView({
  org,
  facilities,
  contracts,
  heroContact,
  brand,
  facilityStates,
  selectedState,
  onStateChange,
}: Props) {
  const filteredFacilities = useMemo(() => {
    if (selectedState === "all") return facilities;
    return facilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [facilities, selectedState]);

  const briefDescription = org.description || org.tagline;
  const hasContact = !!(heroContact && (heroContact.phone || heroContact.email));

  const scrollToContact = () => {
    document.getElementById("org-contact")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const heroBg = org.cover_image_url
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 100%), url(${org.cover_image_url})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : {
        background: `linear-gradient(135deg, ${brand}18 0%, ${brand}08 50%, hsl(var(--muted)) 100%)`,
      };

  return (
    <div className={cn("space-y-6 sm:space-y-8", hasContact ? mobileContactBarPadding() : "")}>
      {/* Hero + BD contact (~3/4 + 1/4) */}
      <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)] lg:items-stretch">
          <div
            className="relative min-h-[180px] sm:min-h-[200px] lg:min-h-[220px] flex flex-col justify-end"
            style={heroBg}
          >
            <div
              className={cn(
                "relative z-[1] p-4 sm:p-5 lg:p-6 flex items-end gap-3.5 sm:gap-4 min-w-0",
                org.cover_image_url ? "text-white" : "text-foreground",
              )}
            >
              <div
                className={cn(
                  "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-xl bg-white border shadow-sm overflow-hidden grid place-items-center p-2 shrink-0",
                )}
                style={{ borderColor: org.cover_image_url ? "rgba(255,255,255,0.35)" : `${brand}35` }}
              >
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={`${org.name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className={cn(
                      "font-heading text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-tight break-words",
                      org.cover_image_url && "drop-shadow-sm",
                    )}
                  >
                    {org.name}
                  </h1>
                  {org.verified && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                        org.cover_image_url
                          ? "border-white/40 bg-white/15 text-white"
                          : "",
                      )}
                      style={
                        org.cover_image_url
                          ? undefined
                          : { borderColor: `${brand}40`, color: brand, backgroundColor: `${brand}10` }
                      }
                    >
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                {briefDescription ? (
                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-snug whitespace-pre-line line-clamp-3",
                      org.cover_image_url ? "text-white/90" : "text-foreground/75",
                    )}
                  >
                    {briefDescription}
                  </p>
                ) : (
                  <p
                    className={cn(
                      "mt-1.5 text-sm",
                      org.cover_image_url ? "text-white/75" : "text-muted-foreground",
                    )}
                  >
                    Referral profile for {org.name}.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            id="org-contact"
            className="w-full min-w-0 border-t lg:border-t-0 lg:border-l border-border/60 p-3 sm:p-3.5 flex"
          >
            {heroContact ? (
              <OrgHeroContactCard
                contacts={[heroContact]}
                organizationId={org.id}
                brand={brand}
                heading="Your Contact"
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-stretch">
                <OrgClaimCard organizationId={org.id} organizationName={org.name} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facilities grid */}
      <section>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">Our Facilities</h2>
            {filteredFacilities.length > 0 && (
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                {filteredFacilities.length}{" "}
                {filteredFacilities.length === 1 ? "location" : "locations"}
                {selectedState !== "all" ? " in this state" : ""}
              </span>
            )}
          </div>

          <OrgStateFilter
            states={facilityStates}
            selected={selectedState}
            onSelect={onStateChange}
            brand={brand}
          />
        </div>

        <div className="mt-4 sm:mt-5">
          {filteredFacilities.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
              {facilities.length === 0
                ? "No facilities published yet."
                : "No facilities in this state."}
            </div>
          ) : (
            <OrgFacilityRail facilities={filteredFacilities} contracts={contracts} orgSlug={org.slug} />
          )}
        </div>
      </section>

      <OrgFooter
        orgId={org.id}
        orgName={org.name}
        slug={org.slug}
        logoUrl={org.logo_url}
        tagline={org.tagline}
        brand={brand}
        contact={heroContact}
        onReferralFallback={scrollToContact}
      />

      {hasContact && heroContact && (
        <MobileContactBar
          repName={heroContact.name}
          repPhone={heroContact.phone ?? null}
          repEmail={heroContact.email ?? null}
          brand={brand}
          organizationId={org.id}
          contextLabel={`Reach the BD rep at ${org.name}.`}
        />
      )}
    </div>
  );
}
