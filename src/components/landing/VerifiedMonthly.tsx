import { BadgeCheck, MousePointerClick, ShieldAlert } from "lucide-react";

const points = [
  {
    icon: MousePointerClick,
    title: "One-click when nothing changed",
    body: "Each month your team confirms the profile is still accurate. If it is, verification takes a single click.",
  },
  {
    icon: BadgeCheck,
    title: "Minutes when something did",
    body: "Need to update a payer, program, or contact? Make the change in your dashboard and verify in the same flow.",
  },
  {
    icon: ShieldAlert,
    title: "Search stays trustworthy",
    body: "Organizations that miss verification are temporarily removed from search until they confirm — so partners aren't relying on stale data.",
  },
];

export function VerifiedMonthly() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
            Verified monthly
          </span>
          <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Because outdated referral information{" "}
            <span className="text-primary">helps no one.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Accuracy is the product. Monthly verification keeps CenterLinked useful for the
            professionals placing patients — and fair to the organizations they trust.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm text-left"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
