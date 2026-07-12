/**
 * Desktop mock of the facility detail page (/app/facilities/:id).
 * Mirrors FacilitySheetView in internal mode — what users see after opening a facility.
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
  ShieldCheck,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
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

const payers = ["Aetna PPO", "Cigna PPO", "BCBS of NC", "United Healthcare", "Magellan"];
const levels = ["Detox", "Residential", "PHP"];
const features = [
  "24/7 nursing support",
  "Dual-diagnosis capable",
  "Private & semi-private rooms",
  "Family programming",
];
const treat = ["Substance Use", "Co-Occurring", "Alcohol Use"];

export function FacilityManageDesktopPreview() {
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

      <main className="flex-1 min-w-0 overflow-hidden p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-end gap-1.5">
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border bg-background text-[8px] font-semibold">
            <ExternalLink className="h-2.5 w-2.5" /> View Organization
          </span>
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border bg-background text-[8px] font-semibold">
            <Pencil className="h-2.5 w-2.5" /> Edit Facility
          </span>
        </div>

        {/* Hero — mirrors FacilitySheetView */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-2.5 sm:p-3 space-y-2 min-w-0">
              <div>
                <h1 className="font-heading text-sm sm:text-[15px] font-bold tracking-tight leading-tight">
                  Northbend Detox Center
                </h1>
                <p className="mt-1 text-[9px] text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  Asheville, NC 28801
                </p>
              </div>
              <p className="text-[8.5px] sm:text-[9px] text-foreground/80 leading-snug line-clamp-2">
                Medically supervised detox with 24/7 nursing in the Blue Ridge mountains.
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <Meta icon={Calendar} label="Founded" value="2014" />
                <Meta icon={Building2} label="Facility Type" value="Detox" />
                <Meta icon={Award} label="Accreditation" value="Joint Commission" />
                <Meta icon={Clock} label="Last Updated" value="2 days ago" />
              </div>
            </div>

            <div className="p-2 min-w-0">
              <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted">
                <img src={facility1} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="mt-1.5 flex gap-1">
                {[facility1, facility2, facility3].map((src, i) => (
                  <div
                    key={i}
                    className={`h-8 flex-1 rounded-md overflow-hidden border ${
                      i === 0 ? "border-primary ring-1 ring-primary/30" : "border-border/60"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Details + referral sidebar */}
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_140px] sm:grid-cols-[1fr_160px]">
            <div className="min-w-0 divide-y divide-border/50">
              <div className="px-2.5 py-2 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                    In-Network Contracts
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {payers.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[7.5px] font-semibold"
                      >
                        <ShieldCheck className="h-2.5 w-2.5 text-primary shrink-0" />
                        <span className="truncate">{p}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                    Levels of Care
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {levels.map((l) => (
                      <span
                        key={l}
                        className="inline-flex items-center rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[7.5px] font-semibold"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-2.5 py-2">
                <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                  Program Details
                </p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2">
                  {features.map((item) => (
                    <li key={item} className="flex items-start gap-1 min-w-0">
                      <Sparkles className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-[8px] text-foreground/85 leading-snug truncate">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                  What We Treat
                </p>
                <div className="flex flex-wrap gap-1">
                  {treat.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded-md border border-border bg-background text-[7.5px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border-l border-border/50 bg-muted/20 p-2.5 flex flex-col gap-2">
              <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">
                For Referrals
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground text-[8px] font-bold shrink-0">
                  EM
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold truncate leading-tight">Elena Martinez</p>
                  <p className="text-[7px] text-muted-foreground truncate">Director of BD</p>
                </div>
              </div>
              <div className="space-y-1 mt-auto">
                <span className="h-6 w-full rounded-md bg-primary text-primary-foreground text-[8px] font-semibold inline-flex items-center justify-center gap-1">
                  <Mail className="h-2.5 w-2.5" /> Email
                </span>
                <span className="h-6 w-full rounded-md border border-border bg-background text-[8px] font-semibold inline-flex items-center justify-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5" /> Text
                </span>
                <span className="h-6 w-full rounded-md border border-border bg-background text-[8px] font-semibold inline-flex items-center justify-center gap-1">
                  <Phone className="h-2.5 w-2.5" /> Call
                </span>
              </div>
            </aside>
          </div>
        </section>
      </main>
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
    <div className="min-w-0">
      <p className="text-[7px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-0.5">
        <Icon className="h-2.5 w-2.5 text-primary" /> {label}
      </p>
      <p className="text-[8.5px] font-semibold truncate">{value}</p>
    </div>
  );
}
