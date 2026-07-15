import { BadgeCheck, MousePointerClick, ShieldAlert } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const points = [
  {
    icon: MousePointerClick,
    title: "One click when nothing changed",
    body: "Each month your team confirms the profile is still accurate. If it is, verification takes a single click.",
  },
  {
    icon: BadgeCheck,
    title: "Minutes when something did",
    body: "Update a payer, program, or contact in the dashboard — then verify in the same flow.",
  },
  {
    icon: ShieldAlert,
    title: "Stale profiles leave search",
    body: "Organizations that miss verification are temporarily removed from search until they confirm — so partners aren’t relying on old data.",
  },
];

export function VerifiedMonthly() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-70" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge icon={BadgeCheck}>Verified monthly</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Accuracy isn’t a feature.{" "}
            <DisplayAccent>It’s the product.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Monthly verification keeps your shared link trustworthy — and keeps the network
            useful for professionals placing patients.
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
