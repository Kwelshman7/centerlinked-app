import { Building2, Shield, Users, Award } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const groups = [
  {
    icon: Building2,
    title: "Organization & facilities",
    items: [
      "Organization overview",
      "Every facility location",
      "Levels of care",
      "Specialty programs",
      "Populations served",
      "Housing availability",
    ],
  },
  {
    icon: Shield,
    title: "Insurance",
    items: [
      "In-network contracts",
      "Out-of-network accepted plans",
      "Medicaid & Medicare",
      "State-specific networks",
    ],
  },
  {
    icon: Users,
    title: "Who to contact",
    items: [
      "Business development reps",
      "Admissions contacts",
      "Direct phone numbers",
      "Email addresses",
      "How to refer",
    ],
  },
  {
    icon: Award,
    title: "Credentials & extras",
    items: [
      "Accreditations",
      "Licensure",
      "Languages spoken",
      "Transportation",
    ],
  },
];

export function ProfileInventory() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:items-start">
          <div className="lg:sticky lg:top-24 space-y-5 max-w-md">
            <SectionBadge>What’s on your link</SectionBadge>
            <DisplayHeading as="h2">
              Everything a partner needs before they{" "}
              <DisplayAccent>make the call.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Your organization profile is the live page behind the link you share — facilities,
              coverage, contacts, and referral steps in one place.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <div
                key={g.title}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <g.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg text-foreground leading-snug">{g.title}</h3>
                </div>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                      <span className="leading-snug text-foreground/85">{item}</span>
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
