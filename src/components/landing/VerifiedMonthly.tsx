import { BadgeCheck, MousePointerClick, ShieldAlert } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-70" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
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

        <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          {points.map((p, i) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-primary">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-lg text-foreground leading-snug">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
