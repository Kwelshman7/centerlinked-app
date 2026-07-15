import { BadgeCheck, Link2, Building2, Users } from "lucide-react";

const signals = [
  { icon: Link2, text: "One live referral profile" },
  { icon: Building2, text: "Always current information" },
  { icon: BadgeCheck, text: "Verified monthly" },
  { icon: Users, text: "Built for behavioral healthcare" },
];

export function TrustStrip() {
  return (
    <section
      className="border-y border-border/60 bg-card/60 py-4 sm:py-5"
      aria-label="Trust signals"
    >
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4 sm:gap-6">
          {signals.map((s) => (
            <div
              key={s.text}
              className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <s.icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="font-medium text-center sm:text-left leading-snug">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
