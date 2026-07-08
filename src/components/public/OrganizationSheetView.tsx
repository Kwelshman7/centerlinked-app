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

  return (
    <div className={cn("space-y-6 sm:space-y-8", hasContact ? mobileContactBarPadding() : "")}>
      {/* Logo, description, and BD contact */}
      <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div className="flex gap-4 sm:gap-5 lg:gap-6 min-w-0 flex-1">
              <div
                className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 xl:h-40 xl:w-40 rounded-xl bg-white border shadow-md overflow-hidden grid place-items-center p-2.5 sm:p-3 shrink-0"
                style={{ borderColor: `${brand}35` }}
              >
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={`${org.name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight break-words">
                    {org.name}
                  </h1>
                  {org.verified && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                      style={{ borderColor: `${brand}40`, color: brand, backgroundColor: `${brand}10` }}
                    >
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                {briefDescription ? (
                  <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line line-clamp-3">
                    {briefDescription}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Referral profile for {org.name}.
                  </p>
                )}
              </div>
            </div>

            <div id="org-contact" className="w-full lg:w-[300px] xl:w-[320px] shrink-0">
              {heroContact ? (
                <OrgHeroContactCard
                  contacts={[heroContact]}
                  organizationId={org.id}
                  brand={brand}
                  heading="Your Contact"
                />
              ) : (
                <OrgClaimCard organizationId={org.id} organizationName={org.name} />
              )}
            </div>
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
        referralEmail={heroContact?.email}
        referralPhone={heroContact?.phone}
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
