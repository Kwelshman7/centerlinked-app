/**
 * Mobile mock of /o/:slug — logo sits cleanly on top, compact filter icon,
 * facility card(s), sticky Refer a Patient. No CenterLinked chrome.
 * Uses static fictional Northbend demo data (never live customer profiles).
 */
import { User } from "lucide-react";
import { FacilityGridCard } from "@/components/FacilityGridCard";
import { ExpandableText } from "@/components/public/ExpandableText";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrgFacilityFilters } from "@/components/public/OrgFacilityFilters";
import {
  DEMO_GRID_FACILITIES,
  DEMO_ORG,
  DEMO_STATE_CODES,
  mockupThemeVariables,
} from "./demoOrgData";

const BRAND = DEMO_ORG.brandColor;
const PREVIEW_LEVELS = ["Detox", "Residential", "PHP", "IOP"];

const demoOrg = {
  id: DEMO_ORG.id,
  name: DEMO_ORG.orgName,
  logo_url: DEMO_ORG.logo,
  description: DEMO_ORG.description,
  tagline: DEMO_ORG.tagline,
  hq_city: DEMO_ORG.hqCity,
  hq_state: DEMO_ORG.hqState,
  cover_image_url: null as string | null,
  image_urls: null as string[] | null,
  verified: true,
};

export function PublicOrgSheetPreviewContent() {
  return (
    <div
      className="relative flex flex-col h-full min-h-0 overflow-hidden bg-white text-foreground select-none pointer-events-none"
      style={mockupThemeVariables(BRAND)}
    >
      <div className="flex-1 min-h-0 overflow-hidden pb-[3.75rem]">
        <OrgHeroSection org={demoOrg} brand={BRAND} compact logoSize="mock" />

        <main className="px-3.5 pt-2.5 pb-2 space-y-2.5 bg-white">
          <header className="space-y-1">
            <h1 className="sr-only">{DEMO_ORG.orgName}</h1>
            <ExpandableText text={DEMO_ORG.description} brand={BRAND} clampLines={3} preview />
          </header>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold tracking-tight">Our Facilities</h2>
                <span className="text-[11px] text-muted-foreground">
                  {DEMO_ORG.facilityCount} locations
                </span>
              </div>
              <OrgFacilityFilters
                mode="button"
                states={[...DEMO_STATE_CODES]}
                selectedState="all"
                onStateChange={() => {}}
                levels={PREVIEW_LEVELS}
                selectedLevel="all"
                onLevelChange={() => {}}
                insurers={["Aetna", "Cigna"]}
                selectedInsurance="all"
                onInsuranceChange={() => {}}
                brand={BRAND}
                preview
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_GRID_FACILITIES.slice(0, 4).map((facility) => (
                <FacilityGridCard
                  key={facility.id}
                  facility={facility}
                  density="compact"
                  imageLoading="eager"
                  elevated
                />
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-border px-3.5 pt-2 pb-2">
        <div
          className="h-9 w-full rounded-md text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
          style={{ backgroundColor: BRAND }}
        >
          <User className="h-4 w-4" aria-hidden />
          Refer a Patient
        </div>
      </div>
    </div>
  );
}
