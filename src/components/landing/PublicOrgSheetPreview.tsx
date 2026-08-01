/**
 * Mobile mock of /o/:slug — logo sits cleanly on top, compact filter icon,
 * natural 2×2 facility cards, sticky Refer a Patient. No CenterLinked chrome.
 */
import { User } from "lucide-react";
import { FacilityGridCard } from "@/components/FacilityGridCard";
import { ExpandableText } from "@/components/public/ExpandableText";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrgFacilityFilters } from "@/components/public/OrgFacilityFilters";
import { mockupThemeVariables, useRotatingMockupOrg } from "./useRotatingMockupOrg";

const DESCRIPTION =
  "A nationally recognized, Joint Commission-accredited network of treatment centers offering detox, residential, PHP, IOP, and mental health programs across the country.";

export function PublicOrgSheetPreviewContent() {
  const organization = useRotatingMockupOrg();
  const brand = organization.brandColor;
  const description = organization.description?.trim() || DESCRIPTION;
  const previewFacilities = organization.facilities.slice(0, 4);
  const states = [...new Set(organization.facilities.map((facility) => facility.state).filter((state): state is string => Boolean(state)))];
  const levels = [...new Set(organization.facilities.flatMap((facility) => facility.levels_of_care ?? []))].slice(0, 6);
  const demoOrg = {
    id: organization.id,
    name: organization.name,
    logo_url: organization.logoUrl,
    description,
    tagline: organization.tagline,
    hq_city: organization.hqCity,
    hq_state: organization.hqState,
    cover_image_url: null as string | null,
    image_urls: null as string[] | null,
    verified: true,
  };

  return (
    <div
      className="relative flex flex-col h-full min-h-0 overflow-hidden bg-muted/30 text-foreground select-none pointer-events-none"
      style={mockupThemeVariables(brand)}
    >
      <div className="flex-1 min-h-0 overflow-hidden pb-[3.75rem]">
        <OrgHeroSection org={demoOrg} brand={brand} compact logoSize="mock" />

        <main className="px-3.5 pt-2.5 pb-2 space-y-2.5">
          <header className="space-y-1">
            <h1 className="sr-only">{organization.name}</h1>
            <ExpandableText text={description} brand={brand} clampLines={3} preview />
          </header>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold tracking-tight">Our Facilities</h2>
                <span className="text-[11px] text-muted-foreground">
                  {organization.facilityCount} locations
                </span>
              </div>
              {/* Demo network is large enough that filters appear on the live page */}
              <OrgFacilityFilters
                mode="button"
                states={states}
                selectedState="all"
                onStateChange={() => {}}
                levels={levels}
                selectedLevel="all"
                onLevelChange={() => {}}
                insurers={["Aetna", "Cigna"]}
                selectedInsurance="all"
                onInsuranceChange={() => {}}
                brand={brand}
                preview
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {previewFacilities.map((f) => (
                <FacilityGridCard key={f.id} facility={f} density="compact" />
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border px-3.5 pt-2 pb-2">
        <div
          className="h-9 w-full rounded-md text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
          style={{ backgroundColor: brand }}
        >
          <User className="h-4 w-4" aria-hidden />
          Refer a Patient
        </div>
      </div>
    </div>
  );
}
