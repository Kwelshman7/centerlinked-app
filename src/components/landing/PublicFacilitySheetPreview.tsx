/**
 * Static mobile mock of a public facility page — real FacilitySheetView mobile sizes, cropped.
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
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-muted/30 text-foreground select-none pointer-events-none">
      {/* Program org header — real h-14 */}
      <header
        className="shrink-0 border-b bg-card/95 backdrop-blur-xl px-4 h-14 flex items-center gap-3 min-w-0 z-10"
        style={{ borderColor: `${BRAND}30` }}
      >
        <div
          className="h-9 w-9 rounded-lg bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0"
          style={{ borderColor: `${BRAND}35` }}
        >
          <img
            src={BANYAN_DEMO.logo}
            alt=""
            className="w-full h-full object-contain p-1"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-sm truncate leading-tight">
            {BANYAN_DEMO.orgName}
          </p>
          <p className="text-xs text-muted-foreground truncate leading-tight">
            {FEATURED_FACILITY.name}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-4 py-5 pb-[5.5rem] space-y-5">
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="relative bg-muted">
            <div className="aspect-[16/10] w-full overflow-hidden">
              <img
                src={FEATURED_FACILITY.gallery[0]}
                alt=""
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-t border-border/60">
              {FEATURED_FACILITY.gallery.map((src, i) => (
                <div
                  key={i}
                  className={`h-11 w-11 shrink-0 rounded-md overflow-hidden border ${
                    i === 0 ? "ring-2 ring-offset-1" : "border-border/60 opacity-85"
                  }`}
                  style={i === 0 ? { boxShadow: `0 0 0 1px ${BRAND}` } : undefined}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3 min-w-0 border-t border-border/50">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <span className="truncate">{BANYAN_DEMO.orgName}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground truncate">
                {FEATURED_FACILITY.name}
              </span>
            </nav>

            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {FEATURED_FACILITY.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span className="truncate">{FEATURED_FACILITY.location}</span>
              </p>
            </div>

            <p className="text-sm leading-relaxed text-foreground/80">
              {FEATURED_FACILITY.description}
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-0.5">
              <Meta icon={Calendar} label="Founded" value={FEATURED_FACILITY.founded} />
              <Meta icon={Building2} label="Facility Type" value={FEATURED_FACILITY.facilityType} />
              <Meta icon={Award} label="Accreditation" value={FEATURED_FACILITY.accreditation} />
              <Meta icon={Clock} label="Last Updated" value={FEATURED_FACILITY.lastUpdated} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-4 space-y-5">
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-bold tracking-tight mb-2.5">
                In-Network Contracts
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_FACILITY.payers.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-semibold max-w-full"
                  >
                    <ShieldCheck
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: BRAND }}
                      aria-hidden
                    />
                    <span className="truncate">{p}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="font-heading text-sm font-bold tracking-tight mb-2.5">
                Levels of Care
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_FACILITY.levels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${BRAND}14`, color: BRAND }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="font-heading text-sm font-bold tracking-tight mb-2.5">
                Program Details
              </h2>
              <ul className="grid grid-cols-1 gap-2">
                {FEATURED_FACILITY.features.map((item) => (
                  <li key={item} className="flex items-start gap-2 min-w-0">
                    <Sparkles
                      className="h-3.5 w-3.5 shrink-0 mt-0.5"
                      style={{ color: BRAND }}
                      aria-hidden
                    />
                    <span className="text-xs text-foreground/85 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile action bar — Share + Contact */}
      <div className="absolute inset-x-0 bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-3">
        <div className="flex gap-2">
          <div
            className="flex-1 h-11 rounded-md text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: BRAND }}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share Facility
          </div>
          <div
            className="flex-1 h-11 rounded-md text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: BRAND }}
          >
            <User className="h-4 w-4" aria-hidden />
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
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: BRAND }} aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}
