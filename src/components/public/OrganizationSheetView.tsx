import { useMemo, ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgFooter } from "@/components/public/OrgFooter";
import { ExpandableText } from "@/components/public/ExpandableText";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { HeroContact } from "@/components/public/OrgHeroContactCard";
import { resolveStateCode } from "@/lib/us-states";
import { orgHeroIsLogoFallback } from "@/lib/org-hero";
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
  image_urls?: string[] | null;
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
  heroContact: HeroContact | null;
  brand: string;
  facilityStates: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
  /** Contact / claim card rendered in the first facility row. */
  contactAside?: ReactNode;
  /** Optional org description shown above the facilities section. */
  description?: string | null;
}

export function OrganizationSheetView({
  org,
  facilities,
  heroContact,
  brand,
  facilityStates,
  selectedState,
  onStateChange,
  contactAside,
  description,
}: Props) {
  const filteredFacilities = useMemo(() => {
    if (selectedState === "all") return facilities;
    return facilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [facilities, selectedState]);

  const hasContact = !!(heroContact && (heroContact.phone || heroContact.email));
  const headline = org.tagline || org.name;
  const showOrgNameUnderHeadline = !!(org.tagline && org.name !== org.tagline);
  /** Logo already carries the org name — hide the duplicate title on mobile. */
  const hideTitleOnMobile = orgHeroIsLogoFallback(org);

  return (
    <div className={cn("space-y-4 sm:space-y-8", hasContact ? mobileContactBarPadding() : "")}>
      <header className="space-y-1.5 sm:space-y-2">
        {org.verified && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: brand,
              backgroundColor: `${brand}12`,
              borderColor: `${brand}28`,
            }}
          >
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        )}
        <h1
          className={cn(
            "font-heading text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-foreground leading-[1.15]",
            hideTitleOnMobile && "hidden sm:block",
          )}
        >
          {headline}
        </h1>
        {showOrgNameUnderHeadline && (
          <p
            className={cn(
              "text-sm sm:text-base text-muted-foreground font-medium",
              hideTitleOnMobile && "hidden sm:block",
            )}
          >
            {org.name}
          </p>
        )}
        {description ? (
          <ExpandableText
            text={description}
            brand={brand}
            clampLines={3}
            className="max-w-3xl pt-1"
          />
        ) : null}
      </header>

      <section>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
              Our Facilities
            </h2>
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
          {filteredFacilities.length === 0 && !contactAside ? (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
              {facilities.length === 0
                ? "No facilities published yet."
                : "No facilities in this state."}
            </div>
          ) : filteredFacilities.length === 0 && contactAside ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] gap-4 sm:gap-5 items-stretch">
              <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground flex items-center justify-center">
                {facilities.length === 0
                  ? "No facilities published yet."
                  : "No facilities in this state."}
              </div>
              <div id="org-contact" className="min-w-0 hidden lg:block">
                {contactAside}
              </div>
            </div>
          ) : (
            <OrgFacilityRail
              facilities={filteredFacilities}
              orgSlug={org.slug}
              aside={contactAside}
            />
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
