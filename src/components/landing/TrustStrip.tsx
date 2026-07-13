import { BadgeCheck, Building2, Phone, HeartPulse } from "lucide-react";

const signals = [
  { icon: BadgeCheck, text: "Verified monthly" },
  { icon: Building2, text: "Live organization profiles" },
  { icon: Phone, text: "Direct referral contacts" },
  { icon: HeartPulse, text: "Built for behavioral health" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card/80 py-4 sm:py-5" aria-label="Trust signals">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4 sm:gap-6">
          {signals.map((s) => (
            <div
              key={s.text}
              className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground"
            >
              <s.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span className="font-medium text-center sm:text-left leading-snug">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
