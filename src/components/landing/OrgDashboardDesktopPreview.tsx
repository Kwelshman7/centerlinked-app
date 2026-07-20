/**
 * Desktop mock of the real org dashboard (/app/dashboard).
 * Mirrors OrgDashboard + AppLayout with live Banyan Treatment Centers data.
 */
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Upload,
  Search as SearchIcon,
  PanelLeftClose,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { BANYAN_DEMO, DEMO_FACILITIES } from "./banyanDemoData";
import { BanyanDashboardPreviewBody } from "./BanyanDashboardPreviewBody";

export { DEMO_FACILITIES };

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

export function OrgDashboardDesktopPreview({
  highlightFacilityIndex = null,
}: {
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
          <p className="text-[9px] font-medium truncate">{BANYAN_DEMO.userFullName}</p>
          <p className="text-[8px] text-muted-foreground truncate">{BANYAN_DEMO.userEmail}</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <BanyanDashboardPreviewBody highlightFacilityIndex={highlightFacilityIndex} density="desktop" />
      </main>
    </div>
  );
}
