/**
 * Mobile mock of /o/:slug — logo sits cleanly on top, compact filter icon,
 * natural 2×2 facility cards, sticky Refer a Patient.
 */
import { User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FacilityGridCard } from "@/components/FacilityGridCard";
import { ExpandableText } from "@/components/public/ExpandableText";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrgFacilityFilters } from "@/components/public/OrgFacilityFilters";
import {
  BANYAN_DEMO,
  BANYAN_GRID_FACILITIES,
  BANYAN_STATE_CODES,
} from "./banyanDemoData";

const BRAND = BANYAN_DEMO.brandColor;

const DESCRIPTION =
  "A nationally recognized, Joint Commission-accredited network of treatment centers offering detox, residential, PHP, IOP, and mental health programs across the country.";

const PREVIEW_FACILITIES = BANYAN_GRID_FACILITIES.slice(0, 4);
const PREVIEW_LEVELS = ["Detox", "Residential", "PHP", "IOP"];

const demoOrg = {
  id: "banyan-demo",
  name: BANYAN_DEMO.orgName,
  logo_url: BANYAN_DEMO.logo,
  description: DESCRIPTION,
  tagline: "Deep roots. Lasting recovery.",
  hq_city: "Gulf Breeze",
  hq_state: "FL",
  cover_image_url: null as string | null,
  image_urls: null as string[] | null,
  verified: true,
};

export function PublicOrgSheetPreviewContent() {
  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-muted/30 text-foreground select-none pointer-events-none">
      <header className="shrink-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/60">
        <div className="h-11 px-3.5 flex items-center justify-between gap-3">
          <Logo to="/" size="sm" className="shrink-0 pointer-events-none" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Sign in
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden pb-[3.75rem]">
        <OrgHeroSection org={demoOrg} brand={BRAND} compact logoSize="mock" />

        <main className="px-3.5 pt-2.5 pb-2 space-y-2.5">
          <header className="space-y-1">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: BRAND,
                backgroundColor: `${BRAND}12`,
                borderColor: `${BRAND}28`,
              }}
            >
              Verified
            </span>
            <h1 className="sr-only">{BANYAN_DEMO.orgName}</h1>
            <ExpandableText text={DESCRIPTION} brand={BRAND} clampLines={3} preview />
          </header>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold tracking-tight">Our Facilities</h2>
                <span className="text-[11px] text-muted-foreground">
                  {BANYAN_DEMO.facilityCount} locations
                </span>
              </div>
              <OrgFacilityFilters
                mode="button"
                states={BANYAN_STATE_CODES}
                selectedState="all"
                onStateChange={() => {}}
                levels={PREVIEW_LEVELS}
                selectedLevel="all"
                onLevelChange={() => {}}
                brand={BRAND}
                preview
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PREVIEW_FACILITIES.map((f) => (
                <FacilityGridCard key={f.id} facility={f} density="compact" />
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border px-3.5 pt-2 pb-2">
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
