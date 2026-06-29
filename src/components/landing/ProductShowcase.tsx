import {
  CheckCircle2, MapPin, Phone, Mail, Share2,
  Shield, BadgeCheck, ChevronRight, Globe, Bell,
} from "lucide-react";
import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { DashboardPreview } from "./DashboardPreview";
import { SearchResultsPreview } from "./SearchResultsPreview";

// All three phones use the same frame so sizing is identical.
// The middle phone gets a larger scale applied by its wrapper.
const PHONE_WIDTH = 260;

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: PHONE_WIDTH, aspectRatio: "393 / 852" }}
    >
      <div className="absolute inset-0 rounded-[3.2rem] bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl p-[5px]">
        <div className="relative h-full w-full rounded-[2.95rem] bg-black p-[2px]">
          <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -left-[3px] top-[240px] h-14 w-[3px] rounded-l-sm bg-neutral-700" />
          <span className="absolute -right-[3px] top-[190px] h-20 w-[3px] rounded-r-sm bg-neutral-700" />
          <div className="relative h-full w-full rounded-[2.85rem] overflow-hidden bg-background">
            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 h-11 flex items-center justify-between px-7 z-30 text-foreground">
              <span className="text-[11px] font-semibold tracking-tight">9:41</span>
              <span className="text-[10px] font-semibold flex items-center gap-1">5G ●●●●</span>
            </div>
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[30px] w-[110px] rounded-full bg-black z-40" />
            {/* Content */}
            <div className="absolute inset-0 pt-11 overflow-hidden bg-background">
              {children}
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-foreground/80 z-40" />
            {/* Top fade */}
            <div className="pointer-events-none absolute top-11 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View 1: Facility public profile (/p/:slug) ──────────────────────────────
function FacilityProfileContent() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Top nav bar with real logo */}
      <div className="px-3.5 pt-1 pb-2.5 flex items-center justify-between border-b border-border bg-background shrink-0">
        <img src={centerlinkedLogo} alt="CenterLinked" className="h-3.5 w-auto object-contain" draggable={false} />
        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Cover photo — same image as Hero for consistency */}
      <div className="relative h-24 shrink-0 overflow-hidden">
        <img src={northbendCover} alt="Northbend Recovery" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 rounded-full px-1.5 py-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 text-success" />
          <span className="text-[8.5px] font-bold text-success">Verified</span>
        </div>
      </div>

      {/* Org identity */}
      <div className="px-3.5 -mt-5 relative z-10 shrink-0">
        <div className="h-11 w-11 rounded-xl bg-white border-2 border-background shadow-md flex items-center justify-center overflow-hidden p-1 shrink-0">
          <img src={logoNorthbend} alt="Northbend" className="h-full w-full object-contain" />
        </div>
        <h3 className="font-bold text-[12.5px] mt-1.5 leading-tight text-foreground">Northbend Detox Center</h3>
        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
          <MapPin className="h-2.5 w-2.5" /> Asheville, NC
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-3.5 mt-2.5 grid grid-cols-3 gap-1.5 shrink-0">
        <button className="h-7 rounded-lg bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Share2 className="h-2.5 w-2.5" /> Share
        </button>
        <button className="h-7 rounded-lg bg-muted text-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Phone className="h-2.5 w-2.5" /> Call
        </button>
        <button className="h-7 rounded-lg bg-muted text-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Mail className="h-2.5 w-2.5" /> Email
        </button>
      </div>

      {/* Levels of care */}
      <div className="px-3.5 mt-3 shrink-0">
        <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Levels of Care</p>
        <div className="flex flex-wrap gap-1">
          {["Detox", "Residential", "PHP", "IOP"].map(l => (
            <span key={l} className="text-[9px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l}</span>
          ))}
        </div>
      </div>

      {/* In-network */}
      <div className="px-3.5 mt-3 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold">In-Network</p>
          <span className="text-[8px] text-success font-bold flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" /> Verified
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {["Aetna", "Cigna", "BCBS", "United"].map(p => (
            <div key={p} className="flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1">
              <BadgeCheck className="h-2.5 w-2.5 text-success shrink-0" />
              <span className="text-[9px] font-semibold truncate">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BD contact */}
      <div className="px-3.5 mt-3 shrink-0">
        <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">BD Contact</p>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
            EM
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold truncate leading-tight">Elena Martinez</p>
            <p className="text-[8.5px] text-muted-foreground truncate">Director of BD</p>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* Contact */}
      <div className="px-3.5 mt-3 shrink-0">
        <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">How to Refer</p>
        <div className="bg-card border border-border rounded-xl p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Phone className="h-3 w-3 text-primary" /> (828) 555-0142</div>
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Mail className="h-3 w-3 text-primary" /> referrals@northbend.co</div>
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Globe className="h-3 w-3 text-primary" /> northbendrecovery.com</div>
        </div>
      </div>
    </div>
  );
}

// ─── View 2: Dashboard — extract just the content, render inside PhoneShell ──
// DashboardPreview includes its own phone frame. To keep all frames identical
// we render DashboardPreview inside a fixed-width container and clip/scale it.
function DashboardShell() {
  return (
    <PhoneShell>
      {/* Pull in DashboardPreview content by rendering it clipped to our frame */}
      <div className="absolute inset-0 scale-[0.765] origin-top-left" style={{ width: `${Math.round(100 / 0.765)}%` }}>
        <DashboardPreview />
      </div>
    </PhoneShell>
  );
}

// ─── View 3: Search — same trick ─────────────────────────────────────────────
function SearchShell() {
  return (
    <PhoneShell>
      <div className="absolute inset-0 scale-[0.765] origin-top-left" style={{ width: `${Math.round(100 / 0.765)}%` }}>
        <SearchResultsPreview />
      </div>
    </PhoneShell>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
const views = [
  {
    label: "What your partners see",
    caption: "A clean, shareable profile showing your LOC, insurance, BD contact, and referral instructions.",
    node: <PhoneShell><FacilityProfileContent /></PhoneShell>,
    center: false,
  },
  {
    label: "Your team's dashboard",
    caption: "Manage your network, track engagement, and see who's sharing your profile.",
    node: <DashboardShell />,
    center: true,
  },
  {
    label: "How partners find you",
    caption: "Search by level of care, location, and insurance — your verified profile surfaces first.",
    node: <SearchShell />,
    center: false,
  },
];

export function ProductShowcase() {
  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            See it in action
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three views.{" "}
            <span className="text-primary">One product.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Here's what CenterLinked looks like for your team, your referral partners, and the people searching for a placement.
          </p>
        </div>

        {/* Three phones: side phones pushed down so the center appears to come forward */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-8 lg:gap-10 max-w-5xl mx-auto">
          {views.map((v) => (
            <div
              key={v.label}
              className={`flex flex-col items-center gap-5 transition-all ${
                v.center
                  ? "md:relative md:z-10 md:-mb-0"
                  : "md:translate-y-10 md:opacity-90"
              }`}
            >
              {/* Scale the center phone up; keep side phones natural */}
              <div className={v.center ? "md:scale-[1.12] origin-bottom" : ""}>
                {v.node}
              </div>

              <div className="text-center max-w-[220px]">
                <p className="font-semibold text-foreground text-sm">{v.label}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
