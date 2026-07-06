import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { EarlyAccessDialog } from "@/components/EarlyAccessDialog";

const plans = [
  {
    name: "Early Access",
    price: "Free",
    period: "",
    priceNote: null as string | null,
    description:
      "For approved treatment organizations joining CenterLinked during early access. Full profile, full network visibility, full feature set — no cost while we're in early access.",
    features: [
      "Organization profile with all sections",
      "Shareable profile link for your entire BD team",
      "Verified listing in the CenterLinked network",
      "Early access to new features as they launch",
    ],
    cta: "Create Your Free Profile",
    featured: true,
    badge: "Current Offer",
  },
  {
    name: "Organization Plan",
    price: "$99",
    period: "/month",
    priceNote: "Starts after early access ends.",
    description:
      "For treatment organizations that want to maintain an accurate, professional, shareable profile after early access. Your whole team is included — no per-seat fees.",
    features: [
      "Organization-controlled profile",
      "Full team access — BD reps, admissions, leadership",
      "Network search visibility",
      "Ongoing updates from your dashboard",
    ],
    cta: "Create Your Free Profile",
    featured: false,
    badge: null,
  },
];

export function Pricing() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Pricing
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Straightforward pricing.{" "}
            <span className="text-primary">No surprises.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Join free during early access. When early access ends, keep your profile active for $99/month. Your whole team — BD reps, admissions, leadership — is included under one organization account. No per-seat fees.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto items-start">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
                plan.featured
                  ? "bg-card border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                  : "bg-card border-border shadow-sm hover:shadow-md hover:border-primary/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={plan.featured ? "pt-2" : ""}>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground min-h-0 sm:min-h-[3.5rem]">
                  {plan.description}
                </p>

                <div className="mt-5 flex items-baseline gap-1 flex-wrap">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                {plan.priceNote && (
                  <p className="mt-1 text-xs text-muted-foreground">{plan.priceNote}</p>
                )}
              </div>

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full bg-success/20">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm text-foreground leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <EarlyAccessDialog>
                <Button
                  variant={plan.featured ? "hero" : "outline"}
                  size="lg"
                  className="mt-7 w-full group"
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </EarlyAccessDialog>
            </div>
          ))}
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs text-muted-foreground max-w-2xl mx-auto px-2">
          BD reps and admissions team members are included as users under your organization account.
        </p>
      </div>
    </section>
  );
}
