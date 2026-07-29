import { useMemo } from "react";
import { BadgeCheck } from "lucide-react";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgFacilityFilters } from "@/components/public/OrgFacilityFilters";
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
  facilityLevels: string[];
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  /** Optional org description shown under the mobile logo hero. */
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
  facilityLevels,
  selectedLevel,
  onLevelChange,
  description,
}: Props) {
  const stateFiltered = useMemo(() => {
    if (selectedState === "all") return facilities;
    return facilities.filter((f) => resolveStateCode(f.state) === selectedState);
  }, [facilities, selectedState]);

  /** Levels available for the current location selection (keeps LOC options relevant). */
  const visibleLevels = useMemo(() => {
    const levels = new Set<string>();
    for (const f of stateFiltered) {
      for (const level of f.levels_of_care ?? []) {
        const trimmed = level?.trim();
        if (trimmed) levels.add(trimmed);
      }
    }
    if (selectedState === "all") return facilityLevels;
    return Array.from(levels).sort((a, b) => a.localeCompare(b));
  }, [stateFiltered, selectedState, facilityLevels]);

  const activeLevel =
    selectedLevel !== "all" && visibleLevels.includes(selectedLevel) ? selectedLevel : "all";

  const filteredFacilities = useMemo(() => {
    if (activeLevel === "all") return stateFiltered;
    return stateFiltered.filter((f) => (f.levels_of_care ?? []).includes(activeLevel));
  }, [stateFiltered, activeLevel]);

  const hasContact = !!(heroContact && (heroContact.phone || heroContact.email));
  const filterActive = selectedState !== "all" || activeLevel !== "all";
  /** Logo already carries the org name — hide the duplicate title on mobile. */
  const hideTitleOnMobile = orgHeroIsLogoFallback(org);
  const showMobileIntro = !!(org.verified || description);

  return (
    <div className={cn("space-y-4 sm:space-y-8", hasContact ? mobileContactBarPadding() : "")}>
      {/* Mobile intro under logo hero — desktop heading lives in OrgHeroSection */}
      {showMobileIntro && (
        <header className="space-y-1.5 lg:hidden">
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
          {!hideTitleOnMobile && (
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-[1.15]">
              {org.tagline || org.name}
            </h1>
          )}
          {description ? (
            <ExpandableText text={description} brand={brand} clampLines={3} className="max-w-3xl" />
          ) : null}
        </header>
      )}

      <section>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:flex-1 gap-0.5 sm:gap-1.5">
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                Our Facilities
              </h2>
              {filteredFacilities.length > 0 && (
                <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                  {filteredFacilities.length}{" "}
                  {filteredFacilities.length === 1 ? "location" : "locations"}
                  {filterActive ? " matching filters" : ""}
                </span>
              )}
            </div>

            <OrgFacilityFilters
              mode="button"
              states={facilityStates}
              selectedState={selectedState}
              onStateChange={onStateChange}
              levels={visibleLevels}
              selectedLevel={activeLevel}
              onLevelChange={onLevelChange}
              brand={brand}
              className="sm:hidden shrink-0"
            />
          </div>

          <OrgFacilityFilters
            mode="pills"
            states={facilityStates}
            selectedState={selectedState}
            onStateChange={onStateChange}
            levels={visibleLevels}
            selectedLevel={activeLevel}
            onLevelChange={onLevelChange}
            brand={brand}
            className="hidden sm:block"
          />
        </div>

        <div className="mt-4 sm:mt-5">
          {filteredFacilities.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
              {facilities.length === 0
                ? "No facilities published yet."
                : "No facilities match these filters."}
            </div>
          ) : (
            <OrgFacilityRail facilities={filteredFacilities} orgSlug={org.slug} />
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
          ctaLabel="Refer a Patient"
          contextLabel={`Reach the BD rep at ${org.name}.`}
        />
      )}
    </div>
  );
}
