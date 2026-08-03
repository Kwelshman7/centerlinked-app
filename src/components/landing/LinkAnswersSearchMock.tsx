/**
 * Crisp search-results UI for the landing desktop visual.
 * Mirrors /app/search/results with the real CenterLinked logo + OrgResultCards.
 */
import { Search as SearchIcon, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  OrgResultCard,
  OrgResultGrid,
  type OrgSearchResult,
} from "@/components/app/search/OrgResultCard";
import logoPalmHarbor from "@/assets/logo-palm-harbor.png";
import logoCoastalBridge from "@/assets/logo-coastal-bridge.png";
import logoEverglade from "@/assets/logo-everglade.png";
import logoNorthbend from "@/assets/logo-northbend.png";
import { DEMO_GRID_FACILITIES } from "./demoOrgData";

const MOCK_RESULTS: OrgSearchResult[] = [
  {
    org_id: "demo-palm-harbor",
    org_name: "Palm Harbor Health Group",
    org_slug: null,
    logo_url: logoPalmHarbor,
    hq_city: "Boca Raton",
    hq_state: "FL",
    in_your_network: true,
    latest_verified_at: null,
    facilities: [
      {
        id: "ph-1",
        name: "Palm Harbor Recovery",
        slug: null,
        city: "Boca Raton",
        state: "FL",
        matched_payer: "Aetna",
        levels_of_care: ["Detox", "Residential"],
      },
      {
        id: "ph-2",
        name: "Palm Harbor PHP",
        slug: null,
        city: "Boca Raton",
        state: "FL",
        matched_payer: "Aetna",
        levels_of_care: ["PHP", "IOP"],
      },
    ],
  },
  {
    org_id: "demo-northbend",
    org_name: "Northbend Recovery",
    org_slug: null,
    logo_url: logoNorthbend,
    hq_city: "Asheville",
    hq_state: "NC",
    in_your_network: false,
    latest_verified_at: null,
    facilities: DEMO_GRID_FACILITIES.slice(0, 3).map((f) => ({
      id: f.id,
      name: f.name,
      slug: null,
      city: f.city,
      state: f.state,
      matched_payer: "Aetna",
      levels_of_care: f.levels_of_care ?? [],
    })),
  },
  {
    org_id: "demo-coastal",
    org_name: "Coastal Bridge Partners",
    org_slug: null,
    logo_url: logoCoastalBridge,
    hq_city: "Delray Beach",
    hq_state: "FL",
    in_your_network: false,
    latest_verified_at: null,
    facilities: [
      {
        id: "cb-1",
        name: "Coastal Bridge Wellness",
        slug: null,
        city: "Delray Beach",
        state: "FL",
        matched_payer: "Aetna",
        levels_of_care: ["Residential", "PHP"],
      },
    ],
  },
  {
    org_id: "demo-everglade",
    org_name: "Everglade Health Network",
    org_slug: null,
    logo_url: logoEverglade,
    hq_city: "Naples",
    hq_state: "FL",
    in_your_network: false,
    latest_verified_at: null,
    facilities: [
      {
        id: "eg-1",
        name: "Everglade Behavioral Health",
        slug: null,
        city: "Naples",
        state: "FL",
        matched_payer: "Aetna",
        levels_of_care: ["PHP", "IOP"],
      },
      {
        id: "eg-2",
        name: "Everglade Outpatient",
        slug: null,
        city: "Naples",
        state: "FL",
        matched_payer: "Aetna",
        levels_of_care: ["IOP", "OP"],
      },
    ],
  },
];

const FILTER_CHIPS = ["Any state", "Any level of care", "Any insurance"] as const;

export function LinkAnswersSearchMock() {
  const totalFacilities = MOCK_RESULTS.reduce((n, o) => n + o.facilities.length, 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30 text-foreground select-none pointer-events-none">
      <header className="shrink-0 border-b border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="flex h-11 items-center justify-between gap-3 px-3.5">
          <Logo to="" size="sm" className="pointer-events-none" />
          <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[9px] font-semibold text-success">
            Verified only
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-3.5 py-3 space-y-3">
        <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-9 items-center rounded-md border border-border/70 bg-background pl-9 pr-2.5 text-[11px] font-medium text-foreground">
              Aetna
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CHIPS.map((label) => (
              <span
                key={label}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 bg-background px-2.5 text-[10px] font-medium text-muted-foreground"
              >
                {label}
                <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
              </span>
            ))}
            <span className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 bg-background px-2.5 text-[10px] font-semibold text-foreground">
              <SlidersHorizontal className="h-3 w-3" aria-hidden />
              Filters
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="font-heading text-[13px] font-bold tracking-tight">
            Aetna · matching partners
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {MOCK_RESULTS.length} organizations · {totalFacilities} matching facilities
          </p>
        </div>

        <OrgResultGrid className="!grid-cols-2 !gap-2.5">
          {MOCK_RESULTS.map((org) => (
            <OrgResultCard
              key={org.org_id}
              o={org}
              facilityLimit={2}
              collapsibleFacilities={false}
              className="shadow-sm"
            />
          ))}
        </OrgResultGrid>
      </div>
    </div>
  );
}
