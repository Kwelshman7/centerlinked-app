import { Search, FileText, Handshake, Target, Clock } from "lucide-react";

const reasons = [
  {
    icon: Search,
    title: "Increase referral visibility",
    body: "Appear when professionals search for organizations that match a patient's clinical and insurance needs.",
    featured: true,
  },
  {
    icon: FileText,
    title: "Replace outdated materials",
    body: "Stop redistributing brochures every time something changes. Maintain one profile that's always current.",
  },
  {
    icon: Handshake,
    title: "Strengthen partner trust",
    body: "Give referral partners one reliable place to access your latest information whenever they need it.",
  },
  {
    icon: Target,
    title: "Improve referral accuracy",
    body: "Help professionals confirm fit — level of care, coverage, and contacts — before they make the call.",
  },
  {
    icon: Clock,
    title: "Save your team time",
    body: "Reduce repetitive questions about insurance, programs, locations, and who to contact for a referral.",
  },
];

export function AlwaysAccurate() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:items-start">
          <div className="space-y-5 max-w-md lg:sticky lg:top-24">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              Why organizations join
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Easier to find. Easier to trust.{" "}
              <span className="text-primary">Easier to refer to.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              CenterLinked helps treatment organizations become the clear, accurate option when a
              partner needs to place a patient quickly.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {reasons.map((r) => (
              <div
                key={r.title}
                className={`group p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all duration-300 ${
                  r.featured ? "sm:col-span-2 sm:flex sm:gap-5 sm:items-start" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 ${
                    r.featured ? "mb-0" : "mb-4"
                  }`}
                >
                  <r.icon className="h-5 w-5" />
                </div>
                <div className={r.featured ? "mt-4 sm:mt-0" : ""}>
                  <h3 className="font-heading text-base font-bold text-foreground">{r.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
