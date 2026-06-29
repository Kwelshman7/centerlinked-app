import { BadgeCheck, Lock, Users } from "lucide-react";

const signals = [
  { icon: BadgeCheck, text: "Verified profiles only" },
  { icon: Lock, text: "Invite-only network" },
  { icon: Users, text: "Built for behavioral health BD teams" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card py-6">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
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

