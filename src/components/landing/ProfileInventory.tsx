import { Check } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const controls = [
  "Insurance Contracts",
  "Levels of Care",
  "Facility Locations",
  "Specialty Programs",
  "Admissions Contact Information",
  "Referral Instructions",
  "Business Development Contacts",
];

export function ProfileInventory() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:items-center">
          <div className="space-y-5 max-w-lg">
            <SectionBadge>Always current</SectionBadge>
            <DisplayHeading as="h2">
              Trusted Information.{" "}
              <DisplayAccent>Always Current.</DisplayAccent>
            </DisplayHeading>
            <div className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
              <p>Referral partners need accurate information.</p>
              <p>Not brochures from six months ago.</p>
              <p className="text-foreground/90 font-medium">
                Every CenterLinked organization controls its own profile including:
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <ul className="space-y-3.5">
              {controls.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm sm:text-base font-medium text-foreground leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-5 border-t border-border text-sm sm:text-base text-muted-foreground leading-relaxed">
              Your profile becomes the single source of truth your referral partners can rely on.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
