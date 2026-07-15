import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const questions = [
  "Are you in network with BCBS?",
  "Which locations offer PHP?",
  "Who handles referrals?",
  "Can you send me your brochure?",
];

export function AlwaysAccurate() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:items-center">
          <div className="space-y-5 max-w-lg">
            <SectionBadge>Why organizations join</SectionBadge>
            <DisplayHeading as="h2">
              Save Time. Build Trust.{" "}
              <DisplayAccent>Increase Referral Confidence.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Your team shouldn&apos;t spend every day answering questions like:
            </p>
          </div>

          <div className="space-y-6">
            <ul className="divide-y divide-border border-y border-border">
              {questions.map((q) => (
                <li
                  key={q}
                  className="py-4 text-base sm:text-lg font-medium text-foreground leading-snug"
                >
                  {q}
                </li>
              ))}
            </ul>
            <p className="text-base text-muted-foreground leading-relaxed">
              CenterLinked makes that information available in one professional profile that can
              be shared anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
