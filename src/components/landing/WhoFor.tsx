import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const audiences = [
  "Detox",
  "Residential",
  "PHP",
  "IOP",
  "Mental Health Program",
  "MAT Provider",
  "Eating Disorder Program",
  "Psychiatric Hospital",
];

export function WhoFor() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-center">
          <div className="space-y-5 max-w-lg">
            <SectionBadge>Who it's for</SectionBadge>
            <DisplayHeading as="h2">
              Built For Behavioral Healthcare{" "}
              <DisplayAccent>Organizations</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Whether you&apos;re a:
            </p>
          </div>

          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {audiences.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-border bg-card px-5 py-4 text-sm sm:text-base font-medium text-foreground shadow-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed">
              CenterLinked helps your organization present accurate referral information
              professionally.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
