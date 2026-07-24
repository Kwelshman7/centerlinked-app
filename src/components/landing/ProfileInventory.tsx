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
import {
  BANYAN_DEMO,
  BANYAN_GRID_FACILITIES,
} from "./banyanDemoData";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";

const BRAND = BANYAN_DEMO.brandColor;

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

const ONE_PAGER_FACILITIES = BANYAN_GRID_FACILITIES.slice(0, 6).map((f) => {
  const state = f.state
    ? stateDisplayName(resolveStateCode(f.state) ?? f.state)
    : "";
  return {
    name: f.name,
    place: [f.city, state].filter(Boolean).join(", "),
    care: (f.levels_of_care ?? []).slice(0, 2).join(" · ") || "Treatment",
    image: f.image_urls?.[0] ?? null,
  };
});

const LEVELS = ["Detox", "Residential", "PHP", "IOP", "Outpatient", "Mental Health"];

const PAYERS = ["Aetna", "Cigna", "BCBS", "United", "Magellan", "Optum"];

export function ProfileInventory() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-secondary/35">
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

function OnePagerPdfMockup() {
  return (
    <div className="relative w-full max-w-[min(100%,420px)] mx-auto lg:mx-0 lg:ml-auto">
      {/* Paper stack */}
      <div
        className="absolute inset-x-0 top-2.5 bottom-[-5px] translate-x-2 rounded-[3px] bg-[#cfcbc2] shadow-md"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-1.5 bottom-[-2.5px] translate-x-1 rounded-[3px] bg-[#ebe8e0] border border-black/[0.06] shadow-md"
        aria-hidden
      />

      <article
        className="relative rounded-[3px] border border-black/10 bg-white overflow-hidden ring-1 ring-black/5"
        aria-label="Sample outdated Banyan Treatment Centers referral one-pager PDF"
        style={{
          boxShadow:
            "0 28px 56px -14px rgba(15, 23, 42, 0.32), 0 10px 20px -10px rgba(15, 23, 42, 0.2)",
        }}
      >
        {/* Document body */}
        <div className="relative text-[#14201a]">
          {/* Hero — logo left, photo reads cleanly on the right */}
          <div className="relative h-[72px] sm:h-[88px] overflow-hidden">
            <img
              src={BANYAN_DEMO.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
              draggable={false}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(12,22,16,0.88) 0%, rgba(12,22,16,0.55) 42%, rgba(12,22,16,0.18) 72%, transparent 100%)",
              }}
            />
            <div className="absolute inset-0 px-3 sm:px-3.5 flex items-center gap-2.5 sm:gap-3">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-md bg-white p-1 shadow-md border border-white/95 shrink-0">
                <img
                  src={BANYAN_DEMO.logo}
                  alt={BANYAN_DEMO.orgName}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-[0.18em] text-white/75">
                  Referral one-pager
                </p>
                <h3 className="font-heading text-[13px] sm:text-[15px] font-bold text-white leading-tight truncate drop-shadow-sm">
                  {BANYAN_DEMO.orgName}
                </h3>
                <p className="mt-0.5 text-[8px] text-white/80 truncate">
                  {BANYAN_DEMO.facilityCount} locations · HQ {BANYAN_DEMO.hqLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-3.5 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5 space-y-2.5">
            <p className="text-[9px] sm:text-[9.5px] text-[#3d4a42] leading-snug">
              Joint Commission–accredited network offering detox, residential, PHP, IOP, and
              mental health programs nationwide.
            </p>

            <section>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: BRAND }}
              >
                Levels of care
              </p>
              <div className="flex flex-wrap gap-1">
                {LEVELS.map((level) => (
                  <span
                    key={level}
                    className="text-[8px] font-semibold px-1.5 py-[3px] rounded-[3px] border"
                    style={{
                      color: BRAND,
                      backgroundColor: `${BRAND}12`,
                      borderColor: `${BRAND}22`,
                    }}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: BRAND }}
                >
                  Facilities
                </p>
                <p className="text-[7.5px] font-medium text-[#6b7280]">
                  Showing 6 of {BANYAN_DEMO.facilityCount}
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-1">
                {ONE_PAGER_FACILITIES.map((loc) => (
                  <li
                    key={loc.name}
                    className="flex items-center gap-2 rounded-[4px] border border-[#e2e6e3] bg-[#fafbfa] px-1.5 py-1 min-w-0"
                  >
                    <div className="h-8 w-10 rounded-[3px] bg-[#eef1ef] border border-[#e5e7eb] overflow-hidden shrink-0">
                      {loc.image ? (
                        <img
                          src={loc.image}
                          alt=""
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center">
                          <Building2 className="h-3.5 w-3.5 text-[#9ca3af]" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] sm:text-[10px] font-bold text-[#14201a] leading-tight truncate">
                        {loc.name}
                      </p>
                      <p className="text-[8px] text-[#6b7280] leading-tight mt-0.5 truncate">
                        <MapPin
                          className="inline h-2.5 w-2.5 mr-0.5 -mt-px"
                          style={{ color: BRAND }}
                          aria-hidden
                        />
                        {loc.place}
                        <span className="text-[#c4c9d2] mx-0.5">·</span>
                        {loc.care}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[7.5px] text-[#6b7280] italic">
                +{BANYAN_DEMO.facilityCount - ONE_PAGER_FACILITIES.length} additional locations
                nationwide
              </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <section className="min-w-0 rounded-[4px] border border-[#e2e6e3] bg-[#fafbfa] px-2 py-1.5">
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.14em] mb-1"
                  style={{ color: BRAND }}
                >
                  In-network
                </p>
                <ul className="space-y-0.5">
                  {PAYERS.map((payer) => (
                    <li
                      key={payer}
                      className="flex items-center gap-1 text-[8.5px] text-[#14201a] leading-snug min-w-0"
                    >
                      <Check
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ color: BRAND }}
                        aria-hidden
                      />
                      <span className="truncate">{payer}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                className="rounded-[4px] border px-2 py-1.5 min-w-0"
                style={{
                  backgroundColor: `${BRAND}0d`,
                  borderColor: `${BRAND}28`,
                }}
              >
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.14em] mb-1"
                  style={{ color: BRAND }}
                >
                  BD contact
                </p>
                <p className="text-[9.5px] sm:text-[10px] font-bold leading-tight">
                  Chris K
                </p>
                <p className="text-[8px] text-[#5b6560] leading-tight mt-0.5">
                  {BANYAN_DEMO.userTitle}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="flex items-center gap-1 text-[8px] text-[#14201a]">
                    <Phone
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ color: BRAND }}
                      aria-hidden
                    />
                    ###-###-####
                  </p>
                  <p className="flex items-center gap-1 text-[7.5px] sm:text-[8px] text-[#14201a] min-w-0">
                    <Mail
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ color: BRAND }}
                      aria-hidden
                    />
                    <span className="truncate">email@banyantreatment.com</span>
                  </p>
                </div>
              </section>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2 border-t border-[#e2e6e3]">
              <p className="text-[7px] sm:text-[7.5px] text-[#6b7280]">
                Printed materials · Last revised Jun 22, 2026
              </p>
              <p
                className="text-[7px] sm:text-[7.5px] font-bold tracking-[0.12em]"
                style={{ color: BRAND }}
              >
                CONFIDENTIAL
              </p>
            </footer>
          </div>

          {/* Outdated stamp */}
          <div
            className="pointer-events-none absolute right-2 sm:right-3 top-[46%] -translate-y-1/2 rotate-[-14deg] select-none"
            aria-hidden
          >
            <span className="inline-block border-[2.5px] border-rose-500/70 text-rose-600/80 px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.22em] rounded-[2px] bg-rose-50/55 shadow-sm backdrop-blur-[1px]">
              Outdated
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
