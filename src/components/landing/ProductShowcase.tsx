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
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

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
    title: "A profile ready for clinical decisions",
    caption:
      "Levels of care, verified insurance, BD contact, and clear referral instructions — everything a partner needs before they pick up the phone.",
    content: <FacilityProfileContent />,
    reverse: false,
  },
  {
    label: "Your team's dashboard",
    title: "Keep every detail current from one place",
    caption:
      "Manage facilities, update the live profile, and understand engagement so your BD team knows which conversations are working.",
    content: <DashboardPreviewContent />,
    reverse: true,
  },
  {
    label: "How partners find you",
    title: "Search that matches real placement criteria",
    caption:
      "Professionals filter by level of care, location, and insurance. Verified profiles surface when someone is ready to place a patient.",
    content: <SearchResultsPreviewContent />,
    reverse: false,
  },
];

export function ProductShowcase() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-60" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-14 sm:mb-16 space-y-5">
          <SectionBadge>See it in action</SectionBadge>
          <DisplayHeading as="h2" align="center">
            One live profile.{" "}
            <DisplayAccent>Three perspectives.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Understand how CenterLinked works for your referral partners, your internal team,
            and professionals searching for a placement.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-20 lg:space-y-24 max-w-5xl mx-auto">
          {views.map((v) => (
            <div
              key={v.label}
              className={`grid gap-8 lg:gap-14 lg:items-center ${
                v.reverse ? "lg:grid-cols-[1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1fr]"
              }`}
            >
              <div className={`flex justify-center ${v.reverse ? "lg:order-2" : ""}`}>
                <PhoneFrame className="w-[240px] sm:w-[260px] max-w-full">{v.content}</PhoneFrame>
              </div>
              <div className={`max-w-md mx-auto lg:mx-0 space-y-3 ${v.reverse ? "lg:order-1" : ""}`}>
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-primary">
                  {v.label}
                </p>
                <h3 className="font-display text-2xl sm:text-3xl text-foreground leading-tight">
                  {v.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">{v.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
