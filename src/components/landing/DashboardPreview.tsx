/**
 * Mobile mock of the real org dashboard (/app/dashboard → OrgDashboard).
 * Uses the same structure, labels, and Northbend demo data as OrgDashboardDesktopPreview.
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
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import logoNorthbend from "@/assets/logo-northbend.png";
import { DEMO_FACILITIES } from "./OrgDashboardDesktopPreview";

const quickActions = [
  { label: "Add facility", icon: Plus },
  { label: "Edit facilities", icon: Pencil },
  { label: "Manage team", icon: UserPlus },
  { label: "Full branding", icon: Palette },
  { label: "Share link", icon: Share2 },
  { label: "Public page", icon: ExternalLink },
];

export function DashboardPreviewContent() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground select-none">
      {/* Compact app header */}
      <div className="px-3 pt-2 pb-2 border-b border-border/60 shrink-0 flex items-center justify-between gap-2 min-w-0">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-3.5 w-auto max-w-[55%] object-contain object-left"
          draggable={false}
        />
        <div className="h-6 w-6 rounded-md bg-white border border-border overflow-hidden p-0.5 shrink-0">
          <img
            src={logoNorthbend}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-2.5 space-y-2.5">
        {/* Welcome — mirrors OrgDashboard header */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="font-heading text-[13px] font-bold tracking-tight leading-tight truncate">
              Welcome back, Elena
            </h1>
            <p className="text-[9px] text-muted-foreground truncate mt-0.5">
              Northbend Recovery
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="inline-flex items-center gap-0.5 h-6 px-1.5 rounded-md border border-border bg-background text-[8px] font-semibold whitespace-nowrap">
              <ExternalLink className="h-2.5 w-2.5 shrink-0" aria-hidden />
              Public
            </span>
            <span className="inline-flex items-center gap-0.5 h-6 px-1.5 rounded-md bg-primary text-primary-foreground text-[8px] font-semibold whitespace-nowrap shadow-sm">
              <Plus className="h-2.5 w-2.5 shrink-0" aria-hidden />
              Add
            </span>
          </div>
        </div>

        {/* Compact KPIs — 2×2 on mobile like real OrgDashboard */}
        <div className="grid grid-cols-2 gap-1.5">
          <KpiTile label="Facilities" value="4" hint="Active" icon={Building2} />
          <KpiTile label="Team" value="6" hint="Members" icon={Users} />
          <KpiTile label="Engagement" value="83" hint="312 views" icon={BarChart3} />
          <div className="rounded-lg border border-border/60 bg-card p-2 flex items-center justify-around gap-0.5 min-w-0">
            {[
              { label: "Calls", value: "24", icon: Phone },
              { label: "Texts", value: "18", icon: MessageSquare },
              { label: "Emails", value: "41", icon: Mail },
            ].map((m) => (
              <div key={m.label} className="text-center min-w-0 px-0.5">
                <m.icon className="h-2.5 w-2.5 text-primary mx-auto" aria-hidden />
                <p className="font-heading text-[11px] font-bold leading-none tabular-nums mt-0.5">
                  {m.value}
                </p>
                <p className="text-[7px] text-muted-foreground truncate">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-lg border border-border/60 bg-card p-2 shadow-sm">
          <p className="font-heading text-[10px] font-bold mb-1.5">Quick actions</p>
          <div className="grid grid-cols-2 gap-1">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="h-7 rounded-md border border-border/70 bg-background px-1.5 inline-flex items-center gap-1 text-[8.5px] font-semibold text-foreground/90 min-w-0"
                >
                  <Icon className="h-3 w-3 text-primary shrink-0" aria-hidden />
                  <span className="truncate">{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme colors */}
        <div className="rounded-lg border border-border/60 bg-card p-2 shadow-sm">
          <p className="font-heading text-[10px] font-bold mb-1.5 inline-flex items-center gap-1">
            <Palette className="h-3 w-3 text-primary shrink-0" aria-hidden />
            Theme colors
          </p>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-5 w-5 rounded border border-border bg-[#0E7490] shrink-0" />
            <span className="h-5 w-5 rounded border border-border bg-[#E0EDFF] shrink-0" />
            <div
              className="h-5 flex-1 min-w-0 rounded-md border border-border/60"
              style={{ background: "linear-gradient(135deg, #0E7490 0%, #E0EDFF 100%)" }}
            />
            <span className="h-5 px-2 rounded-md bg-primary text-primary-foreground text-[8px] font-bold grid place-items-center shrink-0">
              Save
            </span>
          </div>
        </div>

        {/* Facilities — mirrors OrgDashboard facilities card */}
        <div className="rounded-lg border border-border/60 bg-card p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
            <div className="min-w-0">
              <h2 className="font-heading text-[11px] font-bold leading-tight">Facilities</h2>
              <p className="text-[8px] text-muted-foreground">4 locations</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md bg-primary text-primary-foreground text-[7.5px] font-semibold">
                <Plus className="h-2.5 w-2.5" aria-hidden /> Add
              </span>
              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md border border-border text-[7.5px] font-semibold">
                <Pencil className="h-2.5 w-2.5" aria-hidden /> Manage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-1.5 overflow-x-auto min-w-0">
            {["All Locations", "NC", "SC"].map((s, i) => (
              <span
                key={s}
                className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-semibold shrink-0 whitespace-nowrap ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_FACILITIES.map((f) => (
              <div
                key={f.name}
                className="rounded-lg border border-border/60 bg-card overflow-hidden min-w-0"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img
                    src={f.image}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <div className="p-1.5 space-y-0.5 min-w-0">
                  <p className="font-semibold text-[8.5px] leading-snug line-clamp-2">
                    {f.name}
                  </p>
                  <p className="text-[7.5px] text-muted-foreground truncate">{f.loc}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {f.levels.slice(0, 2).map((l) => (
                      <span
                        key={l}
                        className="text-[6.5px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1 py-px rounded"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[8px] font-medium text-muted-foreground truncate">{label}</p>
        <span className="h-5 w-5 rounded bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-2.5 w-2.5" aria-hidden />
        </span>
      </div>
      <p className="mt-0.5 font-heading text-base font-bold tracking-tight leading-none tabular-nums">
        {value}
      </p>
      <p className="text-[7.5px] text-muted-foreground mt-0.5 truncate">{hint}</p>
    </div>
  );
}
