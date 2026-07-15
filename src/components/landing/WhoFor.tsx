import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const audiences = [
  {
    group: "Treatment organizations",
    items: ["Treatment centers", "Mental health programs", "Multi-facility networks", "Hospital systems"],
  },
  {
    group: "Teams who share the link",
    items: ["Business development", "Admissions", "Outreach & partnerships", "Leadership"],
  },
  {
    group: "Partners who open it",
    items: [
      "Hospitals & EDs",
      "Case management",
      "EAPs & universities",
      "Courts & community orgs",
    ],
  },
];

export function WhoFor() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-center">
          <div className="space-y-5 max-w-lg">
            <SectionBadge>Who it’s for</SectionBadge>
            <DisplayHeading as="h2">
              Built for professionals{" "}
              <DisplayAccent>coordinating care — not browsing patients.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              CenterLinked is a professional referral network. Organizations share their link;
              partners use it to confirm facilities and place with confidence.
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
