import { BadgeCheck, Lock, Users } from "lucide-react";

const signals = [
  { icon: BadgeCheck, text: "Verified profiles only" },
  { icon: Lock, text: "Invite-only early access" },
  { icon: Users, text: "Built for behavioral health BD & admissions" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card py-5 sm:py-6" aria-label="Trust signals">
      <div className="container">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-12">
          {signals.map((s) => (
            <div key={s.text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
