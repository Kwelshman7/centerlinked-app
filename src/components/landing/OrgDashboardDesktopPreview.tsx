/**
 * Desktop mock of the real org dashboard (/app/dashboard).
 * Mirrors OrgDashboard + AppLayout so landing visitors see the onboarded experience.
 */
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Upload,
  Search as SearchIcon,
  PanelLeftClose,
  Pencil,
  ExternalLink,
  Phone,
  MessageSquare,
  Mail,
  BarChart3,
  Share2,
  Palette,
  UserPlus,
  Plus,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";

const navPrimary = [
  { label: "Home", icon: LayoutDashboard, active: true },
  { label: "Search", icon: SearchIcon, active: false },
  { label: "Network", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const navManage = [
  { label: "Members", icon: Users },
  { label: "Import", icon: Upload },
];

export const DEMO_FACILITIES = [
  {
    name: "Northbend Detox Center",
    loc: "Asheville, NC",
    image: facility1,
    levels: ["Detox", "Residential"],
  },
  {
    name: "Northbend Residential",
    loc: "Asheville, NC",
    image: facility2,
    levels: ["Residential", "PHP"],
  },
  {
    name: "Northbend PHP/IOP",
    loc: "Asheville, NC",
    image: facility3,
    levels: ["PHP", "IOP", "OP"],
  },
  {
    name: "Ridgeview Sober Living",
    loc: "Black Mountain, NC",
    image: facility2,
    levels: ["Sober Living"],
  },
];

const quickActions = [
  { label: "Add facility", icon: Plus },
  { label: "Edit facilities", icon: Pencil },
  { label: "Manage team", icon: UserPlus },
  { label: "Full branding", icon: Palette },
  { label: "Share link", icon: Share2 },
  { label: "Public page", icon: ExternalLink },
];

export function OrgDashboardDesktopPreview({
  highlightFacilityIndex = null,
}: {
  /** Highlights a facility card during the demo click animation. */
  highlightFacilityIndex?: number | null;
}) {
  return (
    <div className="flex h-full w-full bg-muted/30 text-foreground select-none pointer-events-none">
      <aside className="hidden sm:flex w-[20%] max-w-[180px] min-w-[132px] flex-col bg-card border-r border-border/50 shrink-0">
        <div className="flex items-center justify-between gap-2 px-2.5 py-3 border-b border-border/50">
          <img
            src={centerlinkedLogo}
            alt="CenterLinked"
            className="h-5 w-auto object-contain"
            draggable={false}
          />
          <span className="h-5 w-5 rounded-md grid place-items-center text-muted-foreground">
            <PanelLeftClose className="h-3 w-3" />
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
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}

          <div className="pt-2.5 pb-1 px-2 text-[7px] uppercase tracking-wider font-semibold text-muted-foreground/70">
            Manage
          </div>
          {navManage.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border/50 px-2.5 py-2.5">
          <p className="text-[9px] font-medium truncate">Elena Martinez</p>
          <p className="text-[8px] text-muted-foreground truncate">elena@northbend.com</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden p-2 sm:p-2.5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white border border-border/60 overflow-hidden p-0.5 shrink-0 hidden sm:grid place-items-center">
              <img src={logoNorthbend} alt="" className="h-full w-full object-contain" draggable={false} />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xs sm:text-sm font-bold tracking-tight truncate">
                Welcome back, Elena
              </h1>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">
                Northbend Recovery
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md border border-border bg-background text-[7px] font-semibold">
              <ExternalLink className="h-2.5 w-2.5" /> Public page
            </span>
            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-primary text-primary-foreground text-[7px] font-semibold shadow-sm">
              <Plus className="h-2.5 w-2.5" /> Add facility
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 shrink-0">
          <KpiTile label="Facilities" value="4" hint="Active" icon={Building2} />
          <KpiTile label="Team" value="6" hint="Members" icon={Users} />
          <KpiTile label="Engagement" value="83" hint="312 views" icon={BarChart3} />
          <div className="rounded-md border border-border/60 bg-card px-1 py-1 flex items-center justify-around">
            {[
              { label: "Calls", value: "24", icon: Phone },
              { label: "Texts", value: "18", icon: MessageSquare },
              { label: "Emails", value: "41", icon: Mail },
            ].map((m) => (
              <div key={m.label} className="text-center min-w-0 px-0.5">
                <m.icon className="h-2 w-2 text-primary mx-auto" />
                <p className="font-heading text-[10px] font-bold leading-none tabular-nums mt-0.5">
                  {m.value}
                </p>
                <p className="text-[6px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1.35fr_1fr] gap-1 shrink-0">
          <div className="rounded-md border border-border/60 bg-card p-1.5 shadow-sm">
            <p className="font-heading text-[9px] font-bold mb-1">Quick actions</p>
            <div className="grid grid-cols-3 gap-1">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.label}
                    className="h-6 rounded-md border border-border/70 bg-background px-1 inline-flex items-center gap-1 text-[7px] font-semibold text-foreground/90"
                  >
                    <Icon className="h-2.5 w-2.5 text-primary shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-card p-1.5 shadow-sm">
            <p className="font-heading text-[9px] font-bold mb-1 inline-flex items-center gap-1">
              <Palette className="h-2.5 w-2.5 text-primary" /> Theme colors
            </p>
            <div className="flex items-center gap-1">
              <span className="h-4 w-4 rounded border border-border bg-[#0E7490]" />
              <span className="h-4 w-4 rounded border border-border bg-[#1A73E8]" />
              <div
                className="h-4 flex-1 rounded-md border border-border/60"
                style={{ background: "linear-gradient(135deg, #0E7490 0%, #1A73E8 100%)" }}
              />
              <span className="h-4 px-1.5 rounded-md bg-primary text-primary-foreground text-[6.5px] font-bold grid place-items-center">
                Save
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border/60 bg-card p-1.5 shadow-sm flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
            <div className="min-w-0">
              <h2 className="font-heading text-[10px] font-bold">Facilities</h2>
              <p className="text-[7px] text-muted-foreground">4 locations</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded-md bg-primary text-primary-foreground text-[6.5px] font-semibold">
                <Plus className="h-2 w-2" /> Add
              </span>
              <span className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded-md border border-border text-[6.5px] font-semibold">
                <Pencil className="h-2 w-2" /> Manage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-1.5 overflow-hidden shrink-0">
            {["All Locations", "NC", "SC"].map((s, i) => (
              <span
                key={s}
                className={`px-1.5 py-0.5 rounded-full text-[6.5px] font-semibold shrink-0 ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0 content-start">
            {DEMO_FACILITIES.map((f, i) => (
              <div
                key={f.name}
                data-demo-facility={i}
                className={`rounded-md border bg-card overflow-hidden transition-all duration-200 h-fit ${
                  highlightFacilityIndex === i
                    ? "border-primary ring-2 ring-primary/35 shadow-md scale-[1.02]"
                    : "border-border/60"
                }`}
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img
                    src={f.image}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <div className="p-1 space-y-0.5">
                  <p className="font-semibold text-[7.5px] sm:text-[8px] leading-snug line-clamp-2">
                    {f.name}
                  </p>
                  <p className="text-[6.5px] text-muted-foreground truncate">{f.loc}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {f.levels.slice(0, 2).map((l) => (
                      <span
                        key={l}
                        className="text-[6px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1 py-px rounded"
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
      </main>
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
    <div className="rounded-lg border border-border/60 bg-card p-1.5 shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[7px] font-medium text-muted-foreground truncate">{label}</p>
        <span className="h-4 w-4 rounded bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-2.5 w-2.5" />
        </span>
      </div>
      <p className="mt-0.5 font-heading text-sm font-bold tracking-tight leading-none">{value}</p>
      <p className="text-[7px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}
