import {
  Search as SearchIcon,
  ChevronDown,
  MapPin,
  BadgeCheck,
  Star,
  ShieldCheck,
} from "lucide-react";
import logoPalmHarbor from "@/assets/logo-palm-harbor.png";
import logoCoastalBridge from "@/assets/logo-coastal-bridge.png";
import logoEverglade from "@/assets/logo-everglade.png";
import logoAtlanticSands from "@/assets/logo-atlantic-sands.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { PhoneFrame } from "./PhoneFrame";

const SELECTED_PAYER = "Aetna";
const SELECTED_STATE = "Florida";

const results = [
  {
    name: "Palm Harbor Recovery",
    org: "Palm Harbor Health Group",
    city: "Boca Raton, FL",
    levels: ["Detox", "Residential", "PHP"],
    logo: logoPalmHarbor,
    preferred: true,
    verifiedDays: 2,
  },
  {
    name: "Coastal Bridge Wellness",
    org: "Coastal Bridge Partners",
    city: "Delray Beach, FL",
    levels: ["Residential", "PHP"],
    logo: logoCoastalBridge,
    preferred: false,
    verifiedDays: 5,
  },
  {
    name: "Everglade Behavioral Health",
    org: "Everglade Health Network",
    city: "Naples, FL",
    levels: ["PHP", "IOP", "OP"],
    logo: logoEverglade,
    preferred: false,
    verifiedDays: 8,
  },
  {
    name: "Atlantic Sands Detox",
    org: "Atlantic Sands Group",
    city: "Jupiter, FL",
    levels: ["Detox", "Residential"],
    logo: logoAtlanticSands,
    preferred: false,
    verifiedDays: 11,
  },
];

export function SearchResultsPreviewContent() {
  return (
    <div className="flex flex-col h-full bg-secondary/40">
      <div className="px-4 pt-3.5 pb-3.5 bg-background border-b border-border/60 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <img
            src={centerlinkedLogo}
            alt="CenterLinked"
            className="h-5 w-auto object-contain"
            draggable={false}
          />
          <span className="text-[9px] font-semibold text-success bg-success/10 border border-success/20 rounded-full px-1.5 py-0.5">
            Verified only
          </span>
        </div>
        <h2 className="text-[15px] font-bold font-heading text-foreground leading-tight">
          Find in-network facilities
        </h2>

        <div className="mt-3 space-y-2">
          <div>
            <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Insurance</label>
            <div className="mt-0.5 h-8 rounded-md border-2 border-primary/60 bg-primary/5 px-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11.5px] font-bold text-foreground truncate">{SELECTED_PAYER}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">State</label>
              <div className="mt-0.5 h-8 rounded-md border-2 border-primary/60 bg-primary/5 px-2.5 flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-foreground truncate">{SELECTED_STATE}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Level of care</label>
              <div className="mt-0.5 h-8 rounded-md border border-border bg-card px-2.5 flex items-center justify-between">
                <span className="text-[11.5px] text-muted-foreground truncate">Any</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
          <button type="button" className="mt-1 w-full h-8 rounded-md bg-primary text-primary-foreground text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-sm">
            <SearchIcon className="h-3 w-3" /> Search facilities
          </button>
        </div>
      </div>

      <div className="px-4 pt-2.5 pb-1.5 flex items-center justify-between shrink-0">
        <p className="text-[11px] font-bold text-foreground">
          <span className="text-primary">{results.length}+</span> matches
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-2.5 w-2.5" /> {SELECTED_STATE}
        </p>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-2 overflow-hidden">
        {results.map((r) => (
          <div
            key={r.name}
            className={`relative rounded-xl bg-card border shadow-sm p-2.5 ${r.preferred ? "border-primary/60" : "border-border"}`}
          >
            {r.preferred && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-bl-md rounded-tr-xl flex items-center gap-0.5">
                <Star className="h-2 w-2 fill-current" /> Preferred
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div className="h-12 w-12 rounded-lg bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                <img src={r.logo} alt={`${r.name} logo`} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-foreground truncate leading-tight">{r.name}</p>
                <p className="text-[9.5px] text-muted-foreground truncate leading-tight">{r.org}</p>
                <p className="text-[9.5px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-2.5 w-2.5" /> {r.city}
                </p>
              </div>
            </div>

            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/30 px-2 py-0.5">
              <BadgeCheck className="h-3 w-3 text-success" />
              <span className="text-[9.5px] font-bold text-success">In-network: {SELECTED_PAYER}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 mt-2">
              {r.levels.map((l) => (
                <span key={l} className="text-[9px] font-semibold text-foreground bg-muted rounded-full px-1.5 py-0.5">
                  {l}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-semibold text-muted-foreground">
                <ShieldCheck className="h-2.5 w-2.5 text-success" /> {r.verifiedDays}d
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  contentOnly?: boolean;
}

export function SearchResultsPreview({ contentOnly = false }: Props) {
  if (contentOnly) return <SearchResultsPreviewContent />;
  return (
    <PhoneFrame>
      <SearchResultsPreviewContent />
    </PhoneFrame>
  );
}
