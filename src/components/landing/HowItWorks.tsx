import { Building2, BadgeCheck, Share2, Search } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const stages = [
  {
    num: "01",
    icon: Building2,
    title: "Build",
    body: "Showcase facilities, programs, insurance networks, specialty services, and the contacts referral partners should reach.",
  },
  {
    num: "02",
    icon: BadgeCheck,
    title: "Verify",
    body: "Each month, confirm your information is current. If nothing changed, it takes one click. If something did, update it in minutes.",
  },
  {
    num: "03",
    icon: Share2,
    title: "Share",
    body: "Send one live link to BD partners, hospitals, and care coordinators — instead of another PDF or brochure.",
  },
  {
    num: "04",
    icon: Search,
    title: "Discover",
    body: "Professionals search by level of care, location, and insurance — and find organizations they can trust.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-80" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>How it works</SectionBadge>
          <DisplayHeading as="h2" align="center">
            One system.{" "}
            <DisplayAccent>Always current.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Four coordinated stages — from building your profile to getting discovered by the
            professionals placing patients.
          </p>
        </div>

        {/* Stage pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {stages.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {s.num}
                </span>
                {s.title}
              </span>
              {i < stages.length - 1 && (
                <span className="hidden sm:block h-px w-6 bg-border" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {stages.map((step) => (
            <div
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-primary">{step.num}</span>
              </div>
              <h3 className="font-display text-xl text-foreground">{step.title}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed flex-1">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
