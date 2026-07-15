import { Check, Shield } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const knows = [
  "Who you are",
  "What you offer",
  "Who you help",
  "Which insurance you accept",
  "How to contact you",
];

export function PositioningBoundary() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-60" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={Shield}>Why CenterLinked?</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Because referral partners shouldn&apos;t have to{" "}
            <DisplayAccent>wonder.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            When someone is looking for the right program, they should immediately know:
          </p>
        </div>

        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <ul className="space-y-3.5">
            {knows.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" />
                </span>
                <span className="leading-snug font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 pt-5 border-t border-border text-sm sm:text-base text-muted-foreground leading-relaxed">
            Without digging through emails or outdated brochures.
          </p>
        </div>
      </div>
    </section>
  );
}
