import { useMemo, useState } from "react";
import { OrgFacilityRail } from "@/components/public/OrgFacilityRail";
import { OrgFacilityFilters } from "@/components/public/OrgFacilityFilters";
import { OrgFooter } from "@/components/public/OrgFooter";
import { ExpandableText } from "@/components/public/ExpandableText";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";
import { HeroContact } from "@/components/public/OrgHeroContactCard";
import { orgSocialFromRow } from "@/lib/org-public-select";
import { resolveStateCode } from "@/lib/us-states";
import { cn } from "@/lib/utils";

export interface OrgSheetData {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  favicon_url?: string | null;
  footer_image_url?: string | null;
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_linkedin_url?: string | null;
  social_x_url?: string | null;
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
  facilityInsurers: string[];
  selectedInsurance: string;
  onInsuranceChange: (insurance: string) => void;
  /** facility_id → in-network payer names */
  facilityPayersById: Map<string, string[]>;
  /** Org description shown under the mobile logo hero (matches landing mock). */
  description?: string | null;
  /** Most recent verification timestamp for the footer verified mark. */
  verifiedAt?: string | null;
  showExportPdf?: boolean;
  onExportPdf?: () => void | Promise<void>;
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
  facilityInsurers,
  selectedInsurance,
  onInsuranceChange,
  facilityPayersById,
  description,
  verifiedAt,
  showExportPdf = false,
  onExportPdf,
}: Props) {
  const [footerVisible, setFooterVisible] = useState(false);
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

  const levelFiltered = useMemo(() => {
    if (activeLevel === "all") return stateFiltered;
    return stateFiltered.filter((f) => (f.levels_of_care ?? []).includes(activeLevel));
  }, [stateFiltered, activeLevel]);

  const visibleInsurers = useMemo(() => {
    if (selectedState === "all" && activeLevel === "all") return facilityInsurers;
    const names = new Set<string>();
    for (const f of levelFiltered) {
      for (const name of facilityPayersById.get(f.id) ?? []) {
        names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [levelFiltered, selectedState, activeLevel, facilityInsurers, facilityPayersById]);

  const activeInsurance =
    selectedInsurance !== "all" && visibleInsurers.includes(selectedInsurance)
      ? selectedInsurance
      : "all";

  const filteredFacilities = useMemo(() => {
    if (activeInsurance === "all") return levelFiltered;
    return levelFiltered.filter((f) =>
      (facilityPayersById.get(f.id) ?? []).includes(activeInsurance),
    );
  }, [levelFiltered, activeInsurance, facilityPayersById]);

  const hasContact = !!(heroContact && (heroContact.phone || heroContact.email));
  const filterActive =
    selectedState !== "all" || activeLevel !== "all" || activeInsurance !== "all";
  /** Verified mark lives on the logo; mobile intro is description only. */
  const showMobileIntro = !!description;
  /** Filters only earn their keep for larger networks. */
  const showFilters = facilities.length >= 8;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Sticky-bar padding stays above the footer so collapsing/expanding it
          never creates empty scroll space past the page end. */}
      <div
        className={cn(
          "space-y-4 sm:space-y-5",
          hasContact ? mobileContactBarPadding(0, footerVisible) : "",
        )}
      >
        {/* Mobile intro under logo hero — matches PublicOrgSheetPreview */}
        <header className="space-y-1.5 lg:hidden">
          <h1 className="sr-only">{org.name}</h1>
          {showMobileIntro ? (
            <ExpandableText text={description!} brand={brand} clampLines={3} className="max-w-3xl" />
          ) : null}
        </header>

        <section>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:flex-1 gap-0.5 sm:gap-1.5">
                <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                  Our Facilities
                </h2>
                {filteredFacilities.length > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                    {filteredFacilities.length}{" "}
                    {filteredFacilities.length === 1 ? "location" : "locations"}
                    {showFilters && filterActive ? " matching filters" : ""}
                  </span>
                )}
              </div>

              {showFilters && (
                <OrgFacilityFilters
                  mode="button"
                  states={facilityStates}
                  selectedState={selectedState}
                  onStateChange={onStateChange}
                  levels={visibleLevels}
                  selectedLevel={activeLevel}
                  onLevelChange={onLevelChange}
                  insurers={visibleInsurers}
                  selectedInsurance={activeInsurance}
                  onInsuranceChange={onInsuranceChange}
                  brand={brand}
                  className="sm:hidden shrink-0 print:hidden"
                />
              )}
            </div>

            {showFilters && (
              <OrgFacilityFilters
                mode="dropdowns"
                states={facilityStates}
                selectedState={selectedState}
                onStateChange={onStateChange}
                levels={visibleLevels}
                selectedLevel={activeLevel}
                onLevelChange={onLevelChange}
                insurers={visibleInsurers}
                selectedInsurance={activeInsurance}
                onInsuranceChange={onInsuranceChange}
                brand={brand}
                className="hidden sm:grid print:hidden"
              />
            )}
          </div>

          <div className={cn(showFilters ? "mt-4 sm:mt-5" : "mt-3 sm:mt-4")}>
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
      </div>

      <OrgFooter
        orgId={org.id}
        orgName={org.name}
        slug={org.slug}
        logoUrl={org.logo_url}
        brand={brand}
        social={orgSocialFromRow(org)}
        shareTitle={org.name}
        showReferSlot={hasContact}
        showExportPdf={showExportPdf}
        onExportPdf={onExportPdf}
      />

      {hasContact && heroContact && (
        <MobileContactBar
          repName={heroContact.name}
          repPhone={heroContact.phone ?? null}
          repEmail={heroContact.email ?? null}
          brand={brand}
          organizationId={org.id}
          ctaLabel="Refer Patient"
          contextLabel={`Reach the BD rep at ${org.name}.`}
          onFooterVisibilityChange={setFooterVisible}
        />
      )}
    </div>
  );
}
