import { BadgeCheck, MousePointerClick, ShieldAlert } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { VerificationInteractiveDemo } from "./VerificationInteractiveDemo";

const points = [
  {
    icon: MousePointerClick,
    title: "Nothing changed?",
    body: "Each month, organizations receive a quick verification request. If nothing has changed, simply click “No Changes.”",
  },
  {
    icon: BadgeCheck,
    title: "Need an update?",
    body: "If updates are needed, edit your profile in seconds — then confirm everything is current.",
  },
  {
    icon: ShieldAlert,
    title: "Unverified profiles are flagged",
    body: "Organizations that don’t verify their information are flagged until their profile is confirmed, helping keep referral information accurate and trustworthy.",
  },
];

export function VerifiedMonthly() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-70" aria-hidden />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={BadgeCheck}>Monthly verification</SectionBadge>
          <DisplayHeading as="h2" align="center">
            One of the biggest problems in healthcare directories is{" "}
            <DisplayAccent>outdated information.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            CenterLinked solves this differently. Monthly verification keeps your shared profile
            accurate — so referral partners can trust what they open.
          </p>
        </div>

        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center max-w-5xl mx-auto">
          <div className="flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-full max-w-[320px]">
              <div
                className="pointer-events-none absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-70"
                aria-hidden
              />
              <VerificationInteractiveDemo />
            </div>
          </div>

          <div className="space-y-3 order-1 lg:order-2 min-w-0">
            {points.map((p, i) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm text-left flex gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[11px] font-bold tabular-nums text-primary">0{i + 1}</span>
                    <h3 className="font-display text-base sm:text-lg text-foreground leading-snug">
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
