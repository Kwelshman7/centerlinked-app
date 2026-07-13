import { Check, X, Shield } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const does = [
  "Hosts live organization referral profiles",
  "Keeps programs, payers, and contacts current",
  "Connects BD and admissions to referral partners",
  "Supports search by level of care, location, and insurance",
  "Requires monthly verification for network visibility",
  "Gives orgs one shareable link instead of PDFs",
];

const doesNot = [
  "Act as a patient-facing treatment directory",
  "Replace your CRM or EMR",
  "Substitute for your organization website",
  "Guarantee patient placement",
  "Publish unverified or stale profiles in search",
  "Sell consumer leads or ads",
];

export function PositioningBoundary() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-60" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={Shield}>Professional network</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Built for referrals.{" "}
            <DisplayAccent>Never a public directory.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            In behavioral healthcare, trust is the product. CenterLinked is the external
            profile partners see — professionals-only, always current, and organization-controlled.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-5">
              What CenterLinked does
            </p>
            <ul className="space-y-3.5">
              {does.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-5">
              What CenterLinked never does
            </p>
            <ul className="space-y-3.5">
              {doesNot.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="h-3 w-3" />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
