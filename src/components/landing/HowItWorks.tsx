import { Building2, Share2, UserPlus } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const stages = [
  {
    num: "01",
    icon: UserPlus,
    title: "Claim Your Organization",
    body: "Create your CenterLinked account.",
  },
  {
    num: "02",
    icon: Building2,
    title: "Build Your Profile",
    body: "Add your locations, insurance, programs, levels of care, contacts, photos, and referral information.",
    details: [
      "Locations",
      "Insurance",
      "Programs",
      "Levels of Care",
      "Contacts",
      "Photos",
      "Referral Information",
    ],
  },
  {
    num: "03",
    icon: Share2,
    title: "Share Your Link",
    body: "Every organization receives a professional public profile that can be shared by business development, admissions, marketing, executives, and referral partners.",
    details: [
      "Business Development",
      "Admissions",
      "Marketing",
      "Executives",
      "Referral Partners",
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-80" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>How it works</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Three steps to a live{" "}
            <DisplayAccent>referral profile.</DisplayAccent>
          </DisplayHeading>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-4 sm:gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {stages.map((step) => (
            <div
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-primary">{step.num}</span>
              </div>
              <h3 className="font-display text-xl text-foreground">{step.title}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed flex-1">
                {step.body}
              </p>
              {step.details && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {step.details.map((d) => (
                    <li
                      key={d}
                      className="text-[11px] font-semibold bg-muted text-foreground/80 px-2 py-1 rounded-md"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
