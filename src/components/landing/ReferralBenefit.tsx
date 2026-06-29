import { CheckCircle2 } from "lucide-react";

const points = [
  "Fewer missed details",
  "Fewer repeated questions",
  "A smoother path from relationship to referral",
];

export function ReferralBenefit() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            For referral partners
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-tight">
            Your referral partners should not have to{" "}
            <span className="text-primary">chase your information</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            When someone is trying to place a client, they do not have time to search through emails, old flyers, screenshots, or contact lists. They need to know if your organization is a fit. CenterLinked gives them a clean place to check.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
            {points.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-left shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
