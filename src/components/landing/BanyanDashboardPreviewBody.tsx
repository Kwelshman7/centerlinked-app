/**
 * Shared dashboard body for landing demos — mirrors OrgDashboard layout with live Banyan data.
 */
import {
  Building2,
  Users,
  BarChart3,
  Pencil,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  Palette,
  UserPlus,
  Plus,
  Share2,
} from "lucide-react";
import { FacilityGrid, FacilityGridCard } from "@/components/FacilityGridCard";
import {
  BANYAN_DEMO,
  BANYAN_GRID_FACILITIES,
  BANYAN_STATE_FILTERS,
  FEATURED_FACILITY_INDEX,
} from "./banyanDemoData";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Add facility", icon: Plus },
  { label: "Edit facilities", icon: Pencil },
  { label: "Manage team", icon: UserPlus },
  { label: "Full branding", icon: Palette },
  { label: "Share link", icon: Share2 },
  { label: "Public page", icon: ExternalLink },
];

export function BanyanDashboardPreviewBody({
  highlightFacilityIndex = null,
  /** Scale typography/spacing for phone vs laptop mock. */
  density = "desktop",
}: {
  highlightFacilityIndex?: number | null;
  density?: "desktop" | "mobile";
}) {
  const isMobile = density === "mobile";
  const brand = BANYAN_DEMO.brandColor;

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/30 text-foreground select-none pointer-events-none min-h-0",
        isMobile ? "gap-2.5 p-2.5" : "gap-1.5 p-2 sm:p-2.5",
      )}
    >
      <div className={cn("flex items-start justify-between gap-2 shrink-0", isMobile && "px-0.5")}>
        <div className="min-w-0 flex items-center gap-2">
          {!isMobile && (
            <div className="h-6 w-6 rounded-md bg-white border border-border/60 overflow-hidden p-0.5 shrink-0 hidden sm:grid place-items-center">
              <img src={BANYAN_DEMO.logo} alt="" className="h-full w-full object-contain" draggable={false} />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                "font-heading font-bold tracking-tight truncate",
                isMobile ? "text-[13px]" : "text-xs sm:text-sm",
              )}
            >
              Welcome back, {BANYAN_DEMO.userName}
            </h1>
            <p
              className={cn(
                "text-muted-foreground truncate",
                isMobile ? "text-[9px] mt-0.5" : "text-[8px] sm:text-[9px]",
              )}
            >
              {BANYAN_DEMO.orgName}
            </p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 shrink-0", isMobile ? "" : "hidden sm:flex")}>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border bg-background font-semibold",
              isMobile ? "h-6 px-1.5 text-[8px]" : "h-5 px-1.5 text-[7px]",
            )}
          >
            <ExternalLink className={isMobile ? "h-2.5 w-2.5" : "h-2.5 w-2.5"} /> Public page
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground font-semibold shadow-sm",
              isMobile ? "h-6 px-1.5 text-[8px]" : "h-5 px-1.5 text-[7px]",
            )}
          >
            <Plus className={isMobile ? "h-2.5 w-2.5" : "h-2.5 w-2.5"} /> Add facility
          </span>
        </div>
      </div>

      <div className={cn("grid shrink-0", isMobile ? "grid-cols-2 gap-1.5" : "grid-cols-4 gap-1")}>
        <KpiTile label="Facilities" value={String(BANYAN_DEMO.facilityCount)} hint="Active" icon={Building2} isMobile={isMobile} />
        <KpiTile label="Team" value={String(BANYAN_DEMO.teamCount)} hint="Members" icon={Users} isMobile={isMobile} />
        <KpiTile
          label="Engagement"
          value={String(BANYAN_DEMO.engagementTotal)}
          hint={`${BANYAN_DEMO.pageViews} views`}
          icon={BarChart3}
          isMobile={isMobile}
        />
        <ContactKpi isMobile={isMobile} />
      </div>

      {!isMobile && (
        <div className="grid grid-cols-[1.35fr_1fr] gap-1 shrink-0">
          <QuickActionsPanel />
          <ThemePanel brand={brand} />
        </div>
      )}

      {isMobile && (
        <>
          <QuickActionsPanel isMobile />
          <ThemePanel brand={brand} isMobile />
        </>
      )}

      <div
        className={cn(
          "rounded-md border border-border/60 bg-card shadow-sm flex flex-col min-h-0",
          isMobile ? "p-2 flex-1" : "p-1.5 flex-1",
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
          <div className="min-w-0">
            <h2 className={cn("font-heading font-bold", isMobile ? "text-[11px]" : "text-[10px]")}>
              Facilities
            </h2>
            <p className={cn("text-muted-foreground", isMobile ? "text-[8px]" : "text-[7px]")}>
              {BANYAN_DEMO.facilityCount} locations
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md bg-primary text-primary-foreground font-semibold",
                isMobile ? "h-5 px-1.5 text-[7.5px]" : "h-4 px-1.5 text-[6.5px]",
              )}
            >
              <Plus className="h-2 w-2" /> Add
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md border border-border font-semibold",
                isMobile ? "h-5 px-1.5 text-[7.5px]" : "h-4 px-1.5 text-[6.5px]",
              )}
            >
              <Pencil className="h-2 w-2" /> Manage
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 overflow-x-auto shrink-0 pb-1",
            isMobile ? "mb-1.5" : "mb-1.5",
          )}
        >
          {BANYAN_STATE_FILTERS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "rounded-full font-semibold shrink-0 whitespace-nowrap",
                isMobile ? "px-1.5 py-0.5 text-[7.5px]" : "px-1.5 py-0.5 text-[6.5px]",
                i === 0 ? "text-white shadow-sm" : "bg-muted text-muted-foreground",
              )}
              style={i === 0 ? { backgroundColor: brand } : undefined}
            >
              {s}
            </span>
          ))}
        </div>

        <div
          data-demo-scroll
          className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain", isMobile ? "pr-0.5" : "")}
        >
          <FacilityGrid count={BANYAN_GRID_FACILITIES.length} className="demo-facility-grid gap-1.5 sm:gap-1">
            {BANYAN_GRID_FACILITIES.map((f, i) => (
              <div
                key={f.id}
                data-demo-facility={i}
                className={cn(
                  "rounded-xl transition-all duration-200 h-full",
                  highlightFacilityIndex === i &&
                    "ring-2 ring-primary/40 shadow-md scale-[1.02] z-[1] relative",
                  highlightFacilityIndex === i && i === FEATURED_FACILITY_INDEX && "ring-primary/50",
                )}
              >
                <FacilityGridCard facility={f} density="compact" />
              </div>
            ))}
          </FacilityGrid>
        </div>
      </div>
    </div>
  );
}

function QuickActionsPanel({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className={cn("rounded-md border border-border/60 bg-card shadow-sm", isMobile ? "p-2" : "p-1.5")}>
      <p className={cn("font-heading font-bold mb-1", isMobile ? "text-[10px] mb-1.5" : "text-[9px]")}>
        Quick actions
      </p>
      <div className={cn("grid gap-1", isMobile ? "grid-cols-2" : "grid-cols-3")}>
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.label}
              className={cn(
                "rounded-md border border-border/70 bg-background inline-flex items-center gap-1 font-semibold text-foreground/90",
                isMobile ? "h-7 px-1.5 text-[8.5px]" : "h-6 px-1 text-[7px]",
              )}
            >
              <Icon className={cn("text-primary shrink-0", isMobile ? "h-3 w-3" : "h-2.5 w-2.5")} />
              <span className="truncate">{a.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemePanel({ brand, isMobile = false }: { brand: string; isMobile?: boolean }) {
  return (
    <div className={cn("rounded-md border border-border/60 bg-card shadow-sm", isMobile ? "p-2" : "p-1.5")}>
      <p
        className={cn(
          "font-heading font-bold inline-flex items-center gap-1",
          isMobile ? "text-[10px] mb-1.5" : "text-[9px] mb-1",
        )}
      >
        <Palette className={cn("text-primary", isMobile ? "h-3 w-3" : "h-2.5 w-2.5")} /> Theme colors
      </p>
      <div className="flex items-center gap-1">
        <span className="h-4 w-4 rounded border border-border shrink-0" style={{ backgroundColor: brand }} />
        <span
          className="h-4 w-4 rounded border border-border shrink-0"
          style={{ backgroundColor: BANYAN_DEMO.themeSecondary }}
        />
        <div
          className="h-4 flex-1 rounded-md border border-border/60"
          style={{
            background: `linear-gradient(135deg, ${brand} 0%, ${BANYAN_DEMO.themeSecondary} 100%)`,
          }}
        />
        <span
          className={cn(
            "px-1.5 rounded-md bg-primary text-primary-foreground font-bold grid place-items-center shrink-0",
            isMobile ? "h-5 text-[8px]" : "h-4 text-[6.5px]",
          )}
        >
          Save
        </span>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  isMobile,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Building2;
  isMobile: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-card shadow-sm", isMobile ? "p-2" : "p-1.5")}>
      <div className="flex items-start justify-between gap-1">
        <p className={cn("font-medium text-muted-foreground truncate", isMobile ? "text-[8px]" : "text-[7px]")}>
          {label}
        </p>
        <span
          className={cn(
            "rounded bg-primary/10 text-primary grid place-items-center shrink-0",
            isMobile ? "h-5 w-5" : "h-4 w-4",
          )}
        >
          <Icon className={isMobile ? "h-2.5 w-2.5" : "h-2.5 w-2.5"} />
        </span>
      </div>
      <p
        className={cn(
          "mt-0.5 font-heading font-bold tracking-tight leading-none tabular-nums",
          isMobile ? "text-base" : "text-sm",
        )}
      >
        {value}
      </p>
      <p className={cn("text-muted-foreground mt-0.5", isMobile ? "text-[7.5px]" : "text-[7px]")}>{hint}</p>
    </div>
  );
}

function ContactKpi({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card flex items-center justify-around",
        isMobile ? "p-2 gap-0.5" : "px-1 py-1",
      )}
    >
      {[
        { label: "Calls", value: BANYAN_DEMO.calls, icon: Phone },
        { label: "Texts", value: BANYAN_DEMO.texts, icon: MessageSquare },
        { label: "Emails", value: BANYAN_DEMO.emails, icon: Mail },
      ].map((m) => (
        <div key={m.label} className="text-center min-w-0 px-0.5">
          <m.icon className={cn("text-primary mx-auto", isMobile ? "h-2.5 w-2.5" : "h-2 w-2")} />
          <p
            className={cn(
              "font-heading font-bold leading-none tabular-nums mt-0.5",
              isMobile ? "text-[11px]" : "text-[10px]",
            )}
          >
            {m.value}
          </p>
          <p className={cn("text-muted-foreground", isMobile ? "text-[7px]" : "text-[6px]")}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}
