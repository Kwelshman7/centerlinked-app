import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const plans = [
  {
    name: "Get started",
    price: "Free",
    period: "",
    priceNote: "For approved treatment organizations creating a profile.",
    description:
      "Build your live referral profile, invite your team, and start sharing a link partners can trust.",
    features: [
      "Full organization profile — every section",
      "Shareable profile link for your BD team",
      "Verified listing in the CenterLinked network",
      "Organization dashboard for ongoing updates",
      "No credit card required",
    ],
    cta: "Create Your Organization Profile",
    featured: true,
  },
  {
    name: "Organization plan",
    price: "$99",
    period: "/month",
    priceNote: "Simple flat rate for the whole organization.",
    description:
      "One rate for BD, admissions, and leadership — no per-seat fees as your team grows.",
    features: [
      "Organization-controlled live profile",
      "Full team access — BD, admissions, leadership",
      "Network search visibility",
      "Ongoing dashboard updates",
      "No per-seat fees — ever",
    ],
    cta: "Create Your Organization Profile",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>Pricing</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Straightforward pricing.{" "}
            <DisplayAccent>No surprises.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Create your organization profile free. When you&apos;re ready for the full
            organization plan, it&apos;s a simple $99/month — whole team included.
          </p>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
                plan.featured
                  ? "bg-card border-primary/40 shadow-lg shadow-primary/10 ring-1 ring-primary/15"
                  : "bg-card border-border shadow-sm hover:shadow-md hover:border-primary/25"
              }`}
            >
              <div>
                <h3 className="font-display text-xl text-foreground">{plan.name}</h3>
                <div className="mt-5 flex items-baseline gap-1 flex-wrap">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.priceNote}</p>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full bg-success/20">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm text-foreground leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.featured ? "hero" : "hero-outline"}
                size="lg"
                className="mt-7 w-full group rounded-full"
              >
                <Link to="/request-access">
                  {plan.cta}
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          BD reps and admissions team members are included under your organization account.
        </p>
      </div>
    </section>
  );
}
