import {
  Search as SearchIcon,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";
import logoPalmHarbor from "@/assets/logo-palm-harbor.png";
import logoCoastalBridge from "@/assets/logo-coastal-bridge.png";
import logoEverglade from "@/assets/logo-everglade.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

const SELECTED_PAYER = "Aetna";
const SELECTED_STATE = "Florida";

/** Mirrors live OrgResultCard shape used on /app/search/results */
const results = [
  {
    org_name: "Palm Harbor Health Group",
    hq: "Boca Raton, FL",
    logo: logoPalmHarbor,
    in_your_network: true,
    facilities: [
      {
        name: "Palm Harbor Recovery",
        place: "Boca Raton, FL",
        level: "Detox",
        payer: SELECTED_PAYER,
      },
      {
        name: "Palm Harbor PHP",
        place: "Boca Raton, FL",
        level: "PHP",
        payer: SELECTED_PAYER,
      },
    ],
  },
  {
    org_name: "Coastal Bridge Partners",
    hq: "Delray Beach, FL",
    logo: logoCoastalBridge,
    in_your_network: false,
    facilities: [
      {
        name: "Coastal Bridge Wellness",
        place: "Delray Beach, FL",
        level: "Residential",
        payer: SELECTED_PAYER,
      },
    ],
  },
  {
    org_name: "Everglade Health Network",
    hq: "Naples, FL",
    logo: logoEverglade,
    in_your_network: false,
    facilities: [
      {
        name: "Everglade Behavioral Health",
        place: "Naples, FL",
        level: "PHP",
        payer: SELECTED_PAYER,
      },
    ],
  },
];

const totalFacilities = results.reduce((n, o) => n + o.facilities.length, 0);

export function SearchResultsPreviewContent() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* App chrome — compact header */}
      <div className="px-3 pt-2 pb-2 border-b border-border/60 shrink-0 flex items-center justify-between gap-2 min-w-0">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-3.5 w-auto max-w-[55%] object-contain object-left"
          draggable={false}
        />
        <span className="text-[8px] font-semibold text-success bg-success/10 border border-success/20 rounded-full px-1.5 py-0.5 whitespace-nowrap shrink-0">
          Verified only
        </span>
      </div>

      {/* Search form — mirrors SearchForm field order */}
      <div className="px-3 pt-2.5 pb-2.5 border-b border-border/60 shrink-0 bg-card">
        <h2 className="text-[12px] font-bold font-heading text-foreground leading-tight">
          Find in-network facilities
        </h2>
        <p className="text-[8.5px] text-muted-foreground mt-0.5 leading-snug">
          Search verified treatment contracts by insurance, location, and level of care.
        </p>

        <div className="mt-2 space-y-1.5">
          <div className="min-w-0">
            <label className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
              Insurance
            </label>
            <div className="mt-0.5 h-7 rounded-md border border-input bg-background px-2 flex items-center justify-between gap-1 min-w-0">
              <span className="text-[10px] font-medium text-foreground truncate">
                {SELECTED_PAYER}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <div className="min-w-0">
              <label className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
                State
              </label>
              <div className="mt-0.5 h-7 rounded-md border border-input bg-background px-2 flex items-center justify-between gap-1 min-w-0">
                <span className="text-[10px] font-medium text-foreground truncate">
                  {SELECTED_STATE}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
                City
              </label>
              <div className="mt-0.5 h-7 rounded-md border border-input bg-background px-2 flex items-center min-w-0">
                <span className="text-[10px] text-muted-foreground truncate">Any city</span>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
              Level of care
            </label>
            <div className="mt-0.5 h-7 rounded-md border border-input bg-background px-2 flex items-center justify-between gap-1 min-w-0">
              <span className="text-[10px] text-muted-foreground truncate">Any level of care</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
            </div>
          </div>

          <button
            type="button"
            className="w-full h-7 rounded-md bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
          >
            <SearchIcon className="h-3 w-3 shrink-0" aria-hidden />
            Search facilities
          </button>
        </div>
      </div>

      {/* Results summary — mirrors SearchResults */}
      <div className="px-3 pt-2 pb-1.5 shrink-0 min-w-0">
        <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
          {SELECTED_PAYER} · in {SELECTED_STATE}
        </p>
        <p className="text-[8.5px] text-muted-foreground mt-0.5">
          {results.length} organizations · {totalFacilities} matching facilities
        </p>
      </div>

      {/* Org result cards — mirrors OrgResultCard */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 pb-4 space-y-2">
        {results.map((o) => (
          <div
            key={o.org_name}
            className={`relative rounded-xl bg-card border overflow-hidden ${
              o.in_your_network ? "border-primary/60 shadow-sm" : "border-border"
            }`}
          >
            <div className="flex gap-2 p-2 min-w-0">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center p-1.5 shrink-0">
                {o.logo ? (
                  <img
                    src={o.logo}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <p className="font-heading font-bold text-[11px] leading-snug line-clamp-2 min-w-0 flex-1">
                    {o.org_name}
                  </p>
                  {o.in_your_network && (
                    <span className="shrink-0 bg-primary text-primary-foreground text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-0.5 mt-0.5">
                      <Star className="h-2 w-2 fill-current shrink-0" aria-hidden />
                      Preferred
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[8.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5 min-w-0">
                    <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    <span className="truncate">{o.hq}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-foreground/80 font-semibold">
                    <ShieldCheck className="h-2.5 w-2.5 text-success shrink-0" aria-hidden />
                    {o.facilities.length}{" "}
                    {o.facilities.length === 1 ? "match" : "matches"}
                  </span>
                  {o.in_your_network && (
                    <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                      <Users className="h-2.5 w-2.5 shrink-0" aria-hidden />
                      In your network
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-2 pb-2">
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
                {o.facilities.map((f) => (
                  <li key={f.name}>
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold truncate leading-tight">
                          {f.name}
                        </p>
                        <p className="text-[8px] text-muted-foreground truncate leading-tight">
                          {f.place} · {f.level}
                        </p>
                      </div>
                      <span className="text-[8px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        {f.payer}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-2 pb-2">
              <div className="h-6 w-full rounded-md bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center gap-1">
                View organization page
                <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
