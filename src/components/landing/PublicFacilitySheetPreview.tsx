/**
 * Static mobile mock of a public facility page — real FacilitySheetView mobile sizes, cropped.
 * Insurance contracts stay above the fold; description uses the same Read more pattern as the org mock.
 */
import {
  MapPin,
  Calendar,
  Building2,
  Award,
  Clock,
  ShieldCheck,
  User,
  ChevronRight,
} from "lucide-react";
import { ExpandableText } from "@/components/public/ExpandableText";
import { BANYAN_DEMO, FEATURED_FACILITY } from "./banyanDemoData";

const BRAND = BANYAN_DEMO.brandColor;

/** Keep a few payers visible without crowding the frame. */
const PREVIEW_PAYERS = FEATURED_FACILITY.payers.slice(0, 5);

export function PublicFacilitySheetPreviewContent() {
  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-white text-foreground select-none pointer-events-none">
      <header
        className="shrink-0 border-b bg-white/95 backdrop-blur-xl px-3.5 h-12 flex items-center gap-2.5 min-w-0 z-10"
        style={{ borderColor: `${BRAND}30` }}
      >
        <div
          className="h-8 w-8 rounded-lg bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0"
          style={{ borderColor: `${BRAND}35` }}
        >
          <img
            src={BANYAN_DEMO.logo}
            alt=""
            className="w-full h-full object-contain p-0.5"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-[13px] truncate leading-tight">
            {BANYAN_DEMO.orgName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">
            {FEATURED_FACILITY.name}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-3.5 pt-3 pb-[4.75rem] space-y-3">
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="relative bg-muted">
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={FEATURED_FACILITY.gallery[0]}
                alt=""
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border-t border-border/60">
              {FEATURED_FACILITY.gallery.slice(0, 3).map((src, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 shrink-0 rounded-md overflow-hidden border ${
                    i === 0 ? "ring-2 ring-offset-1" : "border-border/60 opacity-85"
                  }`}
                  style={i === 0 ? { boxShadow: `0 0 0 1px ${BRAND}` } : undefined}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 flex flex-col gap-2.5 min-w-0 border-t border-border/50">
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
              <span className="truncate">{BANYAN_DEMO.orgName}</span>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
              <span className="font-medium text-foreground truncate">
                {FEATURED_FACILITY.name}
              </span>
            </nav>

            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight leading-tight">
                {FEATURED_FACILITY.name}
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span className="truncate">{FEATURED_FACILITY.location}</span>
              </p>
            </div>

            <ExpandableText
              text={FEATURED_FACILITY.description}
              brand={BRAND}
              clampLines={3}
              preview
            />

            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-0.5">
              <Meta icon={Calendar} label="Founded" value={FEATURED_FACILITY.founded} />
              <Meta icon={Building2} label="Facility Type" value={FEATURED_FACILITY.facilityType} />
              <Meta icon={Award} label="Accreditation" value={FEATURED_FACILITY.accreditation} />
              <Meta icon={Clock} label="Last Updated" value={FEATURED_FACILITY.lastUpdated} />
            </div>
          </div>
        </section>

        {/* In-network — kept in the first viewport so the feature is obvious */}
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="px-3.5 py-3 space-y-3">
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <h2 className="font-heading text-sm font-bold tracking-tight">
                  In-Network Contracts
                </h2>
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {FEATURED_FACILITY.payers.length} verified
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PREVIEW_PAYERS.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] font-semibold max-w-full"
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
              <h2 className="font-heading text-sm font-bold tracking-tight mb-2">
                Levels of Care
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_FACILITY.levels.slice(0, 4).map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: `${BRAND}14`, color: BRAND }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border px-3.5 pt-2 pb-2">
        <div
          className="h-10 w-full rounded-md text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
          style={{ backgroundColor: BRAND }}
        >
          <User className="h-4 w-4" aria-hidden />
          Refer a Patient
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
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: BRAND }} aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-xs font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  );
}
