import { Building2, BadgeCheck, Share2, Search } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const stages = [
  {
    num: "01",
    icon: Building2,
    title: "Build your profile",
    body: "Add facilities, levels of care, insurance networks, specialty programs, and the contacts partners should reach.",
  },
  {
    num: "02",
    icon: BadgeCheck,
    title: "Verify monthly",
    body: "Confirm everything is still accurate. Nothing changed? One click. Something did? Update it in minutes.",
  },
  {
    num: "03",
    icon: Share2,
    title: "Share your link",
    body: "Send one organization URL to BD partners, hospitals, and care coordinators — instead of another PDF.",
  },
  {
    num: "04",
    icon: Search,
    title: "Get discovered",
    body: "Professionals search by level of care, location, and insurance — and find profiles they can trust.",
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
            From collateral stack to{" "}
            <DisplayAccent>professional referral network.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Build once, verify monthly, share your link — and stay findable when partners need
            to place.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {stages.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {s.num}
                </span>
                {s.title.split(" ")[0]}
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
