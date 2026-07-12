/**
 * Desktop mock of the facility management page opened from the org dashboard.
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
  MapPin,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import facility1 from "@/assets/facility-1.jpg";
import facility2 from "@/assets/facility-2.jpg";
import facility3 from "@/assets/facility-3.jpg";

const navPrimary = [
  { label: "Home", icon: LayoutDashboard, active: false },
  { label: "Search", icon: SearchIcon, active: false },
  { label: "Network", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const navManage = [
  { label: "Members", icon: Users },
  { label: "Import", icon: Upload },
];

const payers = ["Aetna PPO", "Cigna PPO", "BCBS NC", "United Healthcare", "Magellan"];
const levels = ["Detox", "Residential", "PHP"];

export function FacilityManageDesktopPreview() {
  return (
    <div className="flex h-full w-full bg-muted/30 text-foreground select-none pointer-events-none">
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
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground"
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

      <main className="flex-1 min-w-0 overflow-hidden p-3 sm:p-4 lg:p-5 space-y-3">
        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span>Facilities</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate">Northbend Detox Center</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-base sm:text-lg font-bold tracking-tight truncate">
              Northbend Detox Center
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Asheville, NC 28801
            </p>
          </div>
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-[9px] font-semibold shrink-0">
            <Pencil className="h-3 w-3" /> Edit facility
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-2.5 min-h-0">
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="aspect-[16/9] bg-muted overflow-hidden">
              <img src={facility1} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="p-2 flex gap-1.5">
              {[facility1, facility2, facility3].map((src, i) => (
                <div
                  key={i}
                  className={`h-10 w-14 rounded-md overflow-hidden border ${
                    i === 0 ? "border-primary ring-1 ring-primary/30" : "border-border/60"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 min-w-0">
            <div className="rounded-xl border border-border/60 bg-card p-2.5 shadow-sm">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                Levels of Care
              </p>
              <div className="flex flex-wrap gap-1">
                {levels.map((l) => (
                  <span
                    key={l}
                    className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-600" /> In-Network Contracts
                </p>
                <span className="text-[8px] font-semibold text-primary">Edit</span>
              </div>
              <ul className="space-y-1">
                {payers.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-[10px] font-medium">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-2.5 shadow-sm">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                BD Contact
              </p>
              <p className="text-[11px] font-semibold">Elena Martinez</p>
              <p className="text-[9px] text-muted-foreground">Director of Business Development</p>
              <div className="mt-1.5 flex flex-col gap-0.5 text-[9px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3 text-primary" /> (828) 555-0142
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3 text-primary" /> elena@northbend.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
