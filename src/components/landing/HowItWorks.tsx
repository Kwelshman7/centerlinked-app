import { Building2, BadgeCheck, Search } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Build your profile",
    body: "Showcase facilities, programs, insurance networks, specialty services, and the contacts referral partners should reach.",
  },
  {
    icon: BadgeCheck,
    title: "Keep it verified",
    body: "Each month, confirm your information is current. If nothing changed, it takes one click. If something did, update it in minutes.",
  },
  {
    icon: Search,
    title: "Get discovered",
    body: "Professionals search by the criteria that matter — level of care, location, and insurance — and find organizations they can trust.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
            How it works
          </span>
          <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Build. Verify.{" "}
            <span className="text-primary">Get discovered.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Three steps from outdated materials to a live profile your partners can rely on.
          </p>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col">
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[-1.25rem] h-px bg-border"
                  aria-hidden
                />
              )}
              <div className="flex flex-col h-full rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed flex-1">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
