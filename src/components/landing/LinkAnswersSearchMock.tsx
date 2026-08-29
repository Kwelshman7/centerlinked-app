/**
 * Live in-app search results mock for landing.
 * Mirrors AppLayout + /app/search/results with the real CenterLinked logo.
 */
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Search as SearchIcon,
  SlidersHorizontal,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
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
import { DEMO_GRID_FACILITIES, DEMO_ORG } from "./demoOrgData";

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

const navPrimary = [
  { label: "Home", icon: LayoutDashboard, active: false },
  { label: "Search", icon: SearchIcon, active: true },
  { label: "Network", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

export function LinkAnswersSearchMock() {
  const totalFacilities = MOCK_RESULTS.reduce((n, o) => n + o.facilities.length, 0);

  return (
    <div className="flex h-full w-full bg-muted/30 text-foreground select-none pointer-events-none">
      <aside className="flex w-[18%] max-w-[168px] min-w-[128px] flex-col bg-card border-r border-border/50 shrink-0">
        <div className="flex items-center justify-between gap-2 px-2.5 py-3 border-b border-border/50">
          <Logo to="" size="xs" className="pointer-events-none" />
          <span className="h-5 w-5 rounded-md grid place-items-center text-muted-foreground">
            <PanelLeftClose className="h-3 w-3" aria-hidden />
          </span>
        </div>

        <nav className="flex-1 py-2.5 px-1.5 space-y-0.5 overflow-hidden">
          {navPrimary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium ${
                  item.active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}

          <div className="pt-2.5 pb-1 px-2 text-[7px] uppercase tracking-wider font-semibold text-muted-foreground/70">
            Manage
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Members</span>
          </div>
        </nav>

        <div className="border-t border-border/50 px-2.5 py-2.5">
          <p className="text-[9px] font-medium truncate">{DEMO_ORG.userFullName}</p>
          <p className="text-[8px] text-muted-foreground truncate">{DEMO_ORG.userEmail}</p>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/60 bg-card/95 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-[13px] font-bold tracking-tight truncate">
                Aetna · matching partners
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {MOCK_RESULTS.length} organizations · {totalFacilities} matching facilities
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[9px] font-semibold text-success">
              Verified only
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-3">
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
      </main>
    </div>
  );
}
