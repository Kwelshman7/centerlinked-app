import {
  FileText,
  MapPin,
  Phone,
  Mail,
  Shield,
  UserPlus,
  Building2,
  HeartHandshake,
  Check,
} from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import logoRidgeview from "@/assets/logo-ridgeview.png";
import logoNorthbendPhp from "@/assets/logo-northbend-php.png";

const staleReasons = [
  {
    icon: Shield,
    text: "Your insurance contracts changed",
  },
  {
    icon: UserPlus,
    text: "You hired a new BD rep",
  },
  {
    icon: Building2,
    text: "You added a new location",
  },
  {
    icon: HeartHandshake,
    text: "You now offer a specialized track for veterans",
  },
];

export function ProfileInventory() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-center">
          <div className="space-y-6 max-w-lg min-w-0">
            <SectionBadge icon={FileText}>What you&apos;re replacing</SectionBadge>
            <DisplayHeading as="h2">
              The one-page PDF you sent out a month ago is{" "}
              <DisplayAccent>no longer accurate.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Treatment centers change constantly. The brochure in someone&apos;s inbox
              doesn&apos;t.
            </p>

            <ul className="space-y-3.5 pt-1">
              {staleReasons.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border text-primary shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="pt-1.5 text-sm sm:text-base font-medium text-foreground leading-snug">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
              CenterLinked replaces that static one-pager with one live referral link — always
              current, always shareable.
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end w-full min-w-0">
            <div
              className="pointer-events-none absolute -inset-4 sm:-inset-8 bg-primary/8 blur-3xl rounded-full opacity-70"
              aria-hidden
            />
            <OnePagerPdfMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

const facilities = [
  {
    name: "Northbend Detox",
    city: "Asheville, NC",
    care: "Detox · Medical",
    logo: logoNorthbend,
  },
  {
    name: "Ridgeview Residential",
    city: "Black Mountain, NC",
    care: "Residential",
    logo: logoRidgeview,
  },
  {
    name: "Northbend PHP/IOP",
    city: "Asheville, NC",
    care: "PHP · IOP · OP",
    logo: logoNorthbendPhp,
  },
] as const;

function OnePagerPdfMockup() {
  return (
    <div className="relative w-full max-w-[min(100%,400px)] mx-auto lg:mx-0 lg:ml-auto">
      {/* Straight paper stack (offset only, no tilt) */}
      <div
        className="absolute inset-x-0 top-2 bottom-[-4px] translate-x-1.5 rounded-[2px] bg-[#d9d6cf] shadow-md"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-1 bottom-[-2px] translate-x-0.5 rounded-[2px] bg-[#f0eee8] border border-black/[0.06] shadow-md"
        aria-hidden
      />

      <article
        className="relative rounded-[2px] border border-black/10 bg-[#fbfaf7] overflow-hidden ring-1 ring-black/5"
        aria-label="Sample outdated treatment center one-pager PDF"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 8px 16px -8px rgba(15, 23, 42, 0.18)",
        }}
      >
        {/* PDF viewer chrome */}
        <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 bg-gradient-to-b from-[#eceae4] to-[#e2dfd7] border-b border-black/10">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] bg-rose-600 shadow-sm">
              <FileText className="h-3 w-3 text-white" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold text-[#2a2f38] truncate leading-tight">
                Northbend_Recovery_OnePager.pdf
              </p>
              <p className="text-[7.5px] sm:text-[8px] text-[#6b7280] leading-tight truncate">
                1 page · Email attachment
              </p>
            </div>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-[0.1em] text-rose-800 bg-rose-100/90 border border-rose-200 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
            32 days old
          </span>
        </div>

        {/* Document */}
        <div className="relative text-[#1a2332]">
          <div className="relative h-[64px] sm:h-[80px] overflow-hidden">
            <img
              src={northbendCover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f2438]/90 via-[#0f2438]/45 to-[#0f2438]/20" />
            <div className="absolute inset-x-0 bottom-0 px-2.5 sm:px-3.5 pb-2 sm:pb-2.5 flex items-end justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-[0.16em] text-white/75">
                  Referral one-pager
                </p>
                <h3 className="font-display text-[13px] sm:text-[15px] font-bold text-white leading-tight truncate">
                  Northbend Recovery
                </h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-white p-1 shadow-md border border-white/80 shrink-0">
                <img
                  src={logoNorthbend}
                  alt="Northbend Recovery"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className="px-2.5 sm:px-3.5 pt-2.5 sm:pt-3 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3">
            <p className="text-[9px] sm:text-[9.5px] text-[#4a5568] leading-snug">
              Dual-diagnosis continuum of care across Western North Carolina
            </p>

            <section>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#1e4a6e] mb-1.5">
                Levels of care
              </p>
              <div className="flex flex-wrap gap-1">
                {["Detox", "Residential", "PHP", "IOP", "OP", "MAT"].map((level) => (
                  <span
                    key={level}
                    className="text-[8px] sm:text-[8.5px] font-semibold bg-[#1e4a6e]/[0.08] text-[#1e4a6e] px-1.5 py-[3px] rounded-[2px] border border-[#1e4a6e]/10"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#1e4a6e] mb-1.5">
                Locations
              </p>
              <ul className="space-y-1.5">
                {facilities.map((loc) => (
                  <li
                    key={loc.name}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-[3px] border border-[#d8dde6] bg-white px-1.5 py-1.5 shadow-[0_1px_0_rgba(15,23,42,0.03)] min-w-0"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-[3px] bg-white border border-[#e5e7eb] flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                      <img
                        src={loc.logo}
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] sm:text-[10px] font-bold text-[#1a2332] leading-tight truncate">
                        {loc.name}
                      </p>
                      <p className="text-[8px] sm:text-[8.5px] text-[#6b7280] leading-tight mt-0.5 truncate">
                        <MapPin
                          className="inline h-2.5 w-2.5 mr-0.5 -mt-px text-[#1e4a6e]/70"
                          aria-hidden
                        />
                        {loc.city}
                        <span className="text-[#c4c9d2] mx-0.5">·</span>
                        {loc.care}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2 sm:gap-2.5">
              <section className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#1e4a6e] mb-1.5">
                  In-network
                </p>
                <ul className="grid grid-cols-2 min-[340px]:grid-cols-1 gap-x-2 gap-y-0.5">
                  {["Aetna", "Cigna", "BCBS NC", "United", "Magellan", "Optum"].map((payer) => (
                    <li
                      key={payer}
                      className="flex items-center gap-1 text-[8.5px] sm:text-[9px] text-[#1a2332] leading-snug min-w-0"
                    >
                      <Check className="h-2.5 w-2.5 text-[#1e4a6e] shrink-0" aria-hidden />
                      <span className="truncate">{payer}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[3px] bg-[#eef2f6] border border-[#d8dde6] px-2 py-1.5 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#1e4a6e] mb-1">
                  BD contact
                </p>
                <p className="text-[9.5px] sm:text-[10px] font-bold leading-tight">Elena Martinez</p>
                <p className="text-[8px] text-[#6b7280] leading-tight mt-0.5">
                  Director of BD
                </p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="flex items-center gap-1 text-[8px] text-[#1a2332]">
                    <Phone className="h-2.5 w-2.5 text-[#1e4a6e] shrink-0" aria-hidden />
                    (828) 555-0142
                  </p>
                  <p className="flex items-center gap-1 text-[8px] text-[#1a2332] min-w-0">
                    <Mail className="h-2.5 w-2.5 text-[#1e4a6e] shrink-0" aria-hidden />
                    <span className="truncate">referrals@northbend.co</span>
                  </p>
                </div>
              </section>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2 border-t border-[#d5d9e0]">
              <p className="text-[7px] sm:text-[7.5px] text-[#6b7280]">
                Printed materials · Last revised Jan 14, 2026
              </p>
              <p className="text-[7px] sm:text-[7.5px] font-bold tracking-[0.12em] text-[#1e4a6e]">
                CONFIDENTIAL
              </p>
            </footer>
          </div>

          {/* Stamp keeps a slight angle — document itself is straight */}
          <div
            className="pointer-events-none absolute right-1.5 sm:right-2.5 top-[48%] -translate-y-1/2 rotate-[-16deg] select-none"
            aria-hidden
          >
            <span className="inline-block border-2 sm:border-[2.5px] border-rose-500/65 text-rose-600/75 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] rounded-[2px] bg-rose-50/50 shadow-sm backdrop-blur-[1px]">
              Outdated
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
