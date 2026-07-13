import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const audiences = [
  {
    group: "Treatment providers",
    items: ["Treatment centers", "Mental health programs", "Hospitals"],
  },
  {
    group: "Care coordination",
    items: ["Emergency departments", "Case management teams", "Social work departments"],
  },
  {
    group: "Referral partners",
    items: [
      "Employee assistance programs",
      "Universities",
      "Drug courts",
      "Community organizations",
    ],
  },
];

export function WhoFor() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-center">
          <div className="space-y-5 max-w-lg">
            <SectionBadge>Built for professionals</SectionBadge>
            <DisplayHeading as="h2">
              Designed for teams{" "}
              <DisplayAccent>coordinating patient care.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Unlike public treatment directories, CenterLinked is built for behavioral health
              professionals who need accurate placement information — not patients browsing
              online.
            </p>
            <p className="text-base text-foreground/90 font-medium leading-relaxed">
              Spend less time searching. More time helping patients access care.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {audiences.map((a) => (
              <div
                key={a.group}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-3">
                  {a.group}
                </p>
                <ul className="space-y-2.5">
                  {a.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm font-medium text-foreground/90 leading-snug"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
