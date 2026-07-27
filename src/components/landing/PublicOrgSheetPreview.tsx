/**
 * Mobile mock of /o/:slug — logo + title heading, filters, natural 2×2 facility cards,
 * sticky Refer a Patient.
 */
import { User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FacilityGridCard } from "@/components/FacilityGridCard";
import { OrgHeroSection } from "@/components/public/OrgHeroSection";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgLocFilter } from "@/components/public/OrgLocFilter";
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
        <main className="px-3.5 pt-2.5 pb-2 space-y-2.5">
          <OrgHeroSection
            org={demoOrg}
            brand={BRAND}
            description={DESCRIPTION}
            facilityCount={BANYAN_DEMO.facilityCount}
            compact
          />

          <section className="space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-heading text-base font-bold tracking-tight">Our Facilities</h2>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {BANYAN_DEMO.facilityCount} locations
                </span>
              </div>
              <OrgStateFilter
                states={BANYAN_STATE_CODES}
                selected="all"
                onSelect={() => {}}
                brand={BRAND}
                className="pb-0"
              />
              <OrgLocFilter
                levels={PREVIEW_LEVELS}
                selected="all"
                onSelect={() => {}}
                brand={BRAND}
                className="pb-0"
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
