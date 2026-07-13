import { Building2, Shield, Users, Award } from "lucide-react";

const groups = [
  {
    icon: Building2,
    title: "Organization information",
    items: [
      "Organization overview",
      "Facility locations",
      "Levels of care",
      "Housing availability",
      "Specialty programs",
      "Age populations served",
    ],
  },
  {
    icon: Shield,
    title: "Insurance",
    items: [
      "In-network contracts",
      "Out-of-network accepted plans",
      "Medicaid & Medicare participation",
      "State-specific networks",
    ],
  },
  {
    icon: Users,
    title: "Referral contacts",
    items: [
      "Business development representatives",
      "Admissions contacts",
      "Direct phone numbers",
      "Email addresses",
      "Referral instructions",
    ],
  },
  {
    icon: Award,
    title: "Credentials & details",
    items: [
      "Accreditations",
      "Licensure",
      "Accepted patient populations",
      "Languages spoken",
      "Transportation availability",
    ],
  },
];

export function ProfileInventory() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:items-start">
          <div className="lg:sticky lg:top-24 space-y-5 max-w-md">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              Organization profile
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Everything referral partners need{" "}
              <span className="text-primary">in one place.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Stop asking partners to dig through emails and outdated materials. Give them a single,
              professional source of truth they can open in seconds.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <div
                key={g.title}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <g.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">{g.title}</h3>
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
