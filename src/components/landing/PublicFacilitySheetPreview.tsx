/**
 * Mobile mock of the real public facility page — matches ProgramSheet + FacilitySheetView mobile layout.
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
import { BANYAN_DEMO, FEATURED_FACILITY } from "./banyanDemoData";

const BRAND = BANYAN_DEMO.brandColor;

export function PublicFacilitySheetPreviewContent() {
  return (
    <div className="relative flex flex-col h-full min-h-0 bg-muted/30 text-foreground select-none">
      {/* ProgramOrgHeader */}
      <header
        className="shrink-0 border-b bg-card/95 backdrop-blur-xl px-2.5 h-10 flex items-center gap-2 min-w-0 z-10"
        style={{ borderColor: `${BRAND}30` }}
      >
        <div
          className="h-7 w-7 rounded-md bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0"
          style={{ borderColor: `${BRAND}35` }}
        >
          <img src={BANYAN_DEMO.logo} alt="" className="w-full h-full object-contain p-0.5" draggable={false} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-[10px] truncate leading-tight">{BANYAN_DEMO.orgName}</p>
          <p className="text-[8px] text-muted-foreground truncate leading-tight">{FEATURED_FACILITY.name}</p>
        </div>
      </header>

      {/* Scrollable content — images first, then details */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 pb-[3.25rem] space-y-2">
        {/* Hero card: gallery on top */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="relative bg-muted">
            <div className="aspect-[16/10] w-full overflow-hidden">
              <img src={FEATURED_FACILITY.gallery[0]} alt="" className="w-full h-full object-cover object-center" draggable={false} />
            </div>
            <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-t border-border/60">
              {FEATURED_FACILITY.gallery.map((src, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 shrink-0 rounded-md overflow-hidden border ${
                    i === 0 ? "ring-2 ring-offset-1" : "border-border/60 opacity-85"
                  }`}
                  style={i === 0 ? { boxShadow: `0 0 0 1px ${BRAND}` } : undefined}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Facility details under images */}
          <div className="p-2.5 space-y-2 min-w-0 border-t border-border/50">
            <nav className="flex items-center gap-1 text-[8.5px] text-muted-foreground min-w-0">
              <span className="truncate">{BANYAN_DEMO.orgName}</span>
              <ChevronRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground truncate">{FEATURED_FACILITY.name}</span>
            </nav>

            <div>
              <h1 className="font-heading text-[14px] font-bold tracking-tight leading-tight">
                {FEATURED_FACILITY.name}
              </h1>
              <p className="mt-1 text-[9px] text-muted-foreground inline-flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span className="truncate">{FEATURED_FACILITY.location}</span>
              </p>
            </div>

            <p className="text-[9px] text-foreground/80 leading-snug">
              {FEATURED_FACILITY.description}
            </p>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <Meta icon={Calendar} label="Founded" value={FEATURED_FACILITY.founded} />
              <Meta icon={Building2} label="Facility Type" value={FEATURED_FACILITY.facilityType} />
              <Meta icon={Award} label="Accreditation" value={FEATURED_FACILITY.accreditation} />
              <Meta icon={Clock} label="Last Updated" value={FEATURED_FACILITY.lastUpdated} />
            </div>
          </div>
        </section>

        {/* Program details card */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden divide-y divide-border/50">
          <div className="px-2.5 py-2.5 space-y-3">
            <div className="min-w-0">
              <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">
                In-Network Contracts
              </h2>
              <div className="flex flex-wrap gap-1">
                {FEATURED_FACILITY.payers.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[8px] font-semibold max-w-full"
                  >
                    <ShieldCheck className="h-2.5 w-2.5 shrink-0" style={{ color: BRAND }} aria-hidden />
                    <span className="truncate">{p}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">Levels of Care</h2>
              <div className="flex flex-wrap gap-1">
                {FEATURED_FACILITY.levels.map((l) => (
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
            <h2 className="font-heading text-[10px] font-bold tracking-tight mb-1.5">Program Details</h2>
            <ul className="space-y-1">
              {FEATURED_FACILITY.features.map((item) => (
                <li key={item} className="flex items-start gap-1.5 min-w-0">
                  <Sparkles className="h-3 w-3 shrink-0 mt-0.5" style={{ color: BRAND }} aria-hidden />
                  <span className="text-[9px] text-foreground/85 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-2.5 py-2.5 bg-muted/15">
            <p className="text-[8px] uppercase tracking-wider font-bold mb-2" style={{ color: BRAND }}>
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
                {BANYAN_DEMO.userInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[10px] truncate">{BANYAN_DEMO.userFullName}</p>
                <p className="text-[8px] text-muted-foreground">{BANYAN_DEMO.userTitle}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Share + Contact — matches mobile action bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-card/95 backdrop-blur-md border-t border-border px-2 pt-1.5 pb-2">
        <div className="flex gap-1.5">
          <div
            className="flex-1 h-8 rounded-md text-white text-[9px] font-semibold flex items-center justify-center gap-1 shadow-sm"
            style={{ backgroundColor: BRAND }}
          >
            <Share2 className="h-3 w-3" aria-hidden />
            Share Facility
          </div>
          <div
            className="flex-1 h-8 rounded-md text-white text-[9px] font-semibold flex items-center justify-center gap-1 shadow-sm"
            style={{ backgroundColor: BRAND }}
          >
            <User className="h-3 w-3" aria-hidden />
            Contact now
          </div>
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
        <p className="text-[7.5px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</p>
        <p className="text-[9px] font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}
