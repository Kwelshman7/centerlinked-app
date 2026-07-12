/**
 * Desktop mock of the real org dashboard (/app/dashboard + AppLayout).
 * Mirrors OrgDashboard + sidebar so landing visitors see the onboarded experience.
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
  Plus,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  BarChart3,
  Share2,
  ArrowRight,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";

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

const facilities = [
  { name: "Northbend Detox Center", loc: "Asheville, NC", image: facility1, updated: "Updated 2d ago" },
  { name: "Northbend Residential", loc: "Asheville, NC", image: facility2, updated: "Updated 5d ago" },
  { name: "Northbend PHP/IOP", loc: "Asheville, NC", image: facility3, updated: "Updated 1w ago" },
];

const quickActions = [
  {
    label: "Update Facility Information",
    description: "Make sure program info is always current",
    icon: Pencil,
  },
  {
    label: "View & Share Public Link",
    description: "Copy the org page BD reps will share",
    icon: Share2,
  },
  {
    label: "Organization settings",
    description: "Logo, colors, and referral contact",
    icon: Building2,
  },
  {
    label: "Shared program links",
    description: "Copy links for each facility program sheet",
    icon: BarChart3,
  },
];

export function OrgDashboardDesktopPreview({
  highlightFacilityIndex = null,
}: {
  /** Highlights a facility row during the demo click animation. */
  highlightFacilityIndex?: number | null;
}) {
  return (
    <div className="flex h-full w-full bg-muted/30 text-foreground select-none pointer-events-none">
      {/* Sidebar — mirrors AppLayout desktop rail */}
      <aside className="hidden sm:flex w-[22%] max-w-[200px] min-w-[148px] flex-col bg-card border-r border-border/50 shrink-0">
        <div className="flex items-center justify-between gap-2 px-3 py-3.5 border-b border-border/50">
          <img
            src={centerlinkedLogo}
            alt="CenterLinked"
            className="h-6 w-auto object-contain"
            draggable={false}
          />
          <span className="h-6 w-6 rounded-md grid place-items-center text-muted-foreground">
            <PanelLeftClose className="h-3.5 w-3.5" />
          </span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
          {navPrimary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}

          <div className="pt-3 pb-1 px-2.5 text-[8px] uppercase tracking-wider font-semibold text-muted-foreground/70">
            Manage
          </div>
          {navManage.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border/50 px-3 py-3">
          <p className="text-[10px] font-medium truncate">Elena Martinez</p>
          <p className="text-[9px] text-muted-foreground truncate">elena@northbend.com</p>
        </div>
      </aside>

      {/* Main — mirrors OrgDashboard */}
      <main className="flex-1 min-w-0 overflow-hidden p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-base sm:text-lg lg:text-xl font-bold tracking-tight truncate">
              Welcome back, Elena
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              Northbend Recovery
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-background text-[9px] font-semibold">
              <ExternalLink className="h-3 w-3" /> View public page
            </span>
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-primary text-primary-foreground text-[9px] font-semibold shadow-sm">
              <Pencil className="h-3 w-3" /> Manage facilities
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <StatCard
            label="Facilities"
            value="3"
            sublabel="Active facilities"
            linkLabel="Manage facilities"
            icon={Building2}
          />
          <StatCard
            label="BD Team Members"
            value="6"
            sublabel="Active users"
            linkLabel="Manage team"
            icon={Users}
          />
          <div className="rounded-xl border border-border/60 bg-card p-2 sm:p-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-1 mb-2">
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate">
                  Contact engagement
                </p>
                <p className="text-[7px] text-muted-foreground mt-0.5 leading-snug line-clamp-2 hidden sm:block">
                  When partners tap call, text, or email
                </p>
              </div>
              <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <BarChart3 className="h-3 w-3" />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {[
                { label: "Calls", value: "24", icon: Phone },
                { label: "Texts", value: "18", icon: MessageSquare },
                { label: "Emails", value: "41", icon: Mail },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-md border border-border/60 bg-muted/30 px-1 py-1.5 text-center"
                >
                  <m.icon className="h-2.5 w-2.5 text-primary mx-auto mb-0.5" />
                  <p className="font-heading text-[11px] sm:text-sm font-bold leading-none">{m.value}</p>
                  <p className="text-[7px] text-muted-foreground mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[7px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/60">
              312 profile views · all time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 min-h-0 flex-1">
          <div className="sm:col-span-2 rounded-xl border border-border/60 bg-card p-2.5 sm:p-3 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-[11px] sm:text-xs font-bold">Recent facilities</h2>
              <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-semibold text-primary">
                <Plus className="h-3 w-3" /> Add facility
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {facilities.map((f, i) => (
                <li
                  key={f.name}
                  data-demo-facility={i}
                  className={`flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md transition-colors duration-200 ${
                    highlightFacilityIndex === i
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : ""
                  }`}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-muted shrink-0">
                    <img src={f.image} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold truncate">{f.name}</p>
                    <p className="text-[8px] text-muted-foreground truncate">{f.loc}</p>
                  </div>
                  <span className="hidden md:block text-[8px] text-muted-foreground shrink-0">
                    {f.updated}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-2.5 sm:p-3 shadow-sm min-w-0">
            <h2 className="font-heading text-[11px] sm:text-xs font-bold mb-2">Quick Actions</h2>
            <ul className="space-y-1.5">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <li
                    key={a.label}
                    className="flex items-start gap-2 p-1.5 rounded-lg border border-border/60 bg-card"
                  >
                    <span className="h-6 w-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] font-semibold truncate">{a.label}</p>
                      <p className="text-[7.5px] sm:text-[8px] text-muted-foreground line-clamp-1">
                        {a.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  linkLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  sublabel: string;
  linkLabel: string;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-2 sm:p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate">{label}</p>
        <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-1 font-heading text-lg sm:text-xl font-bold tracking-tight leading-none">{value}</p>
      <p className="text-[7.5px] sm:text-[8px] text-muted-foreground mt-0.5">{sublabel}</p>
      <span className="mt-1.5 inline-flex items-center gap-0.5 text-[8px] font-semibold text-primary">
        {linkLabel} <ArrowRight className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}
