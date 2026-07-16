/**
 * Mobile mock of the real public facility page (/p/:slug → FacilitySheetView).
 * Matches the live ProgramSheet layout partners see for a facility link.
 */
import {
  MapPin,
  Calendar,
  Building2,
  Award,
  Clock,
  ShieldCheck,
  Sparkles,
  User,
  Share2,
  ChevronRight,
} from "lucide-react";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";

const BRAND = "#0E7490";

const payers = ["Aetna PPO", "Cigna PPO", "BCBS of NC", "United Healthcare"];
const levels = ["Detox", "Residential", "PHP"];
const features = [
  "24/7 nursing support",
  "Dual-diagnosis capable",
  "Private & semi-private rooms",
];
const gallery = [facility1, facility2, facility3];

export function PublicFacilitySheetPreviewContent() {
  return (
    <div className="relative flex flex-col h-full min-h-0 bg-background text-foreground select-none">
      {/* ProgramOrgHeader */}
      <header
        className="shrink-0 border-b bg-card/95 backdrop-blur-xl px-2.5 h-10 flex items-center justify-between gap-2 min-w-0"
        style={{ borderColor: `${BRAND}30` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="h-7 w-7 rounded-md bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0"
            style={{ borderColor: `${BRAND}35` }}
          >
            <img
              src={logoNorthbend}
              alt=""
              className="w-full h-full object-contain p-0.5"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-[10px] truncate leading-tight">
              Northbend Recovery
            </p>
            <p className="text-[8px] text-muted-foreground truncate leading-tight">
              Northbend Detox Center
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-2.5 pb-14 space-y-2.5">
        {/* Hero card — mirrors FacilitySheetView mobile (stacked) */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="p-2.5 space-y-2 min-w-0">
            <nav className="flex items-center gap-1 text-[8.5px] text-muted-foreground min-w-0">
              <span className="truncate">Northbend Recovery</span>
              <ChevronRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground truncate">Northbend Detox Center</span>
            </nav>

            <div>
              <h1 className="font-heading text-[14px] font-bold tracking-tight leading-tight">
                Northbend Detox Center
              </h1>
              <p className="mt-1 text-[9px] text-muted-foreground inline-flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span className="truncate">Asheville, NC 28801</span>
              </p>
            </div>

            <p className="text-[9px] text-foreground/80 leading-snug">
              Medically supervised detox with 24/7 nursing in the Blue Ridge mountains.
            </p>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <Meta icon={Calendar} label="Founded" value="2014" />
              <Meta icon={Building2} label="Facility Type" value="Detox" />
              <Meta icon={Award} label="Accreditation" value="Joint Commission" />
              <Meta icon={Clock} label="Last Updated" value="2 days ago" />
            </div>

            <div
              className="h-7 w-full rounded-md text-white text-[9.5px] font-semibold flex items-center justify-center gap-1 shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              <Share2 className="h-3 w-3" aria-hidden />
              Share Facility
            </div>
          </div>

          <div className="px-2.5 pb-2.5">
            <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted">
              <img
                src={facility1}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div className="mt-1.5 flex gap-1">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  className={`h-9 flex-1 rounded-md overflow-hidden border ${
                    i === 0 ? "border-primary ring-1 ring-primary/30" : "border-border/60"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Unified details */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden divide-y divide-border/50">
          <div className="px-2.5 py-2.5 space-y-3">
            <div className="min-w-0">
              <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">
                In-Network Contracts
              </h2>
              <div className="flex flex-wrap gap-1">
                {payers.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[8px] font-semibold max-w-full"
                  >
                    <ShieldCheck
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ color: BRAND }}
                      aria-hidden
                    />
                    <span className="truncate">{p}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">
                Levels of Care
              </h2>
              <div className="flex flex-wrap gap-1">
                {levels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-semibold"
                    style={{ backgroundColor: `${BRAND}14`, color: BRAND }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-2.5 py-2.5">
            <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">
              Program Details
            </h2>
            <ul className="space-y-1">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-1.5 min-w-0">
                  <Sparkles
                    className="h-3 w-3 shrink-0 mt-0.5"
                    style={{ color: BRAND }}
                    aria-hidden
                  />
                  <span className="text-[9px] text-foreground/85 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-2.5 py-2.5 bg-muted/15">
            <p
              className="text-[8px] uppercase tracking-wider font-bold mb-2"
              style={{ color: BRAND }}
            >
              For Referrals
            </p>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-9 w-9 rounded-full grid place-items-center shrink-0 font-heading font-bold text-[10px] border"
                style={{
                  backgroundColor: `${BRAND}14`,
                  color: BRAND,
                  borderColor: `${BRAND}30`,
                }}
              >
                EM
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[10px] truncate">Elena Martinez</p>
                <p className="text-[8px] text-muted-foreground">BD Representative</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MobileContactBar — scoped inside phone */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-card/95 backdrop-blur-md border-t border-border px-2.5 pt-2 pb-3">
        <div
          className="h-9 w-full rounded-md shadow-md text-[11px] font-semibold text-white flex items-center justify-center gap-1.5"
          style={{ backgroundColor: BRAND }}
        >
          <User className="h-3.5 w-3.5" aria-hidden />
          Contact
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <Icon className="h-3 w-3 shrink-0 mt-0.5" style={{ color: BRAND }} aria-hidden />
      <div className="min-w-0">
        <p className="text-[7.5px] uppercase tracking-wide font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-[9px] font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}
