import {
  CheckCircle2, MapPin, Phone, Mail, Share2,
  Shield, BadgeCheck, ChevronRight, Globe,
} from "lucide-react";
import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { PhoneFrame } from "./PhoneFrame";
import { DashboardPreviewContent } from "./DashboardPreview";
import { SearchResultsPreviewContent } from "./SearchResultsPreview";

function FacilityProfileContent() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-3.5 pt-1 pb-2.5 flex items-center justify-between border-b border-border bg-background shrink-0">
        <img src={centerlinkedLogo} alt="CenterLinked" className="h-3.5 w-auto object-contain" draggable={false} />
      </div>

      <div className="relative h-24 shrink-0 overflow-hidden">
        <img src={northbendCover} alt="Northbend Recovery" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 rounded-full px-1.5 py-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 text-success" />
          <span className="text-[8.5px] font-bold text-success">Verified</span>
        </div>
      </div>

      <div className="px-3.5 -mt-5 relative z-10 shrink-0">
        <div className="h-11 w-11 rounded-xl bg-white border-2 border-background shadow-md flex items-center justify-center overflow-hidden p-1 shrink-0">
          <img src={logoNorthbend} alt="Northbend" className="h-full w-full object-contain" />
        </div>
        <h3 className="font-bold text-[12.5px] mt-1.5 leading-tight text-foreground">Northbend Detox Center</h3>
        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
          <MapPin className="h-2.5 w-2.5 shrink-0" /> Asheville, NC
        </p>
      </div>

      <div className="px-3.5 mt-2.5 grid grid-cols-3 gap-1.5 shrink-0">
        <button type="button" className="h-7 rounded-lg bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Share2 className="h-2.5 w-2.5" /> Share
        </button>
        <button type="button" className="h-7 rounded-lg bg-muted text-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Phone className="h-2.5 w-2.5" /> Call
        </button>
        <button type="button" className="h-7 rounded-lg bg-muted text-foreground text-[9px] font-bold flex items-center justify-center gap-1">
          <Mail className="h-2.5 w-2.5" /> Email
        </button>
      </div>

      <div className="px-3.5 mt-3 shrink-0">
        <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Levels of Care</p>
        <div className="flex flex-wrap gap-1">
          {["Detox", "Residential", "PHP", "IOP"].map((l) => (
            <span key={l} className="text-[9px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l}</span>
          ))}
        </div>
      </div>

      <div className="px-3.5 mt-3 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold">In-Network</p>
          <span className="text-[8px] text-success font-bold flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" /> Verified
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {["Aetna", "Cigna", "BCBS", "United"].map((p) => (
            <div key={p} className="flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1">
              <BadgeCheck className="h-2.5 w-2.5 text-success shrink-0" />
              <span className="text-[9px] font-semibold truncate">{p}</span>
            </div>
          ))}
        </div>
      </div>

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

      <div className="px-3.5 mt-3 shrink-0 pb-3">
        <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">How to Refer</p>
        <div className="bg-card border border-border rounded-xl p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Phone className="h-3 w-3 text-primary shrink-0" /> (828) 555-0142</div>
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Mail className="h-3 w-3 text-primary shrink-0" /> referrals@northbend.co</div>
          <div className="flex items-center gap-1.5 text-[9px] text-foreground"><Globe className="h-3 w-3 text-primary shrink-0" /> northbendrecovery.com</div>
        </div>
      </div>
    </div>
  );
}

const views = [
  {
    label: "What your partners see",
    caption:
      "A clean, shareable profile with levels of care, verified insurance, BD contact, and how to refer — ready for a clinical decision.",
    content: <FacilityProfileContent />,
    center: false,
  },
  {
    label: "Your team's dashboard",
    caption:
      "Manage facilities, keep the profile current, and see engagement so your BD team knows what's working.",
    content: <DashboardPreviewContent />,
    center: true,
  },
  {
    label: "How partners find you",
    caption:
      "Search by level of care, location, and insurance. Verified profiles surface first when someone's placing a client.",
    content: <SearchResultsPreviewContent />,
    center: false,
  },
];

export function ProductShowcase() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16 px-1">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            See it in action
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Three views.{" "}
            <span className="text-primary">One live profile.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Here's what CenterLinked looks like for your referral partners, your team,
            and the people searching for a placement.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-10 lg:gap-12 max-w-5xl mx-auto">
          {views.map((v) => (
            <div
              key={v.label}
              className={`flex flex-col items-center gap-4 sm:gap-5 w-full max-w-[280px] mx-auto md:max-w-none md:w-auto md:mx-0 ${
                v.center ? "md:relative md:z-10" : "md:translate-y-8 md:opacity-95"
              }`}
            >
              <div className={`w-full flex justify-center ${v.center ? "md:scale-110 origin-bottom" : ""}`}>
                <PhoneFrame className="mx-auto">{v.content}</PhoneFrame>
              </div>

              <div className="text-center max-w-[260px] px-2">
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
