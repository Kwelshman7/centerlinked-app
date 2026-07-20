import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const plans = [
  {
    name: "Build It Yourself",
    price: "$99",
    period: "/month",
    priceNote: "Organization Profile",
    description:
      "Perfect for organizations that want to manage their own live referral profile.",
    features: [
      "Organization Dashboard",
      "Public Shareable Profile",
      "Unlimited Profile Updates",
      "Monthly Verification",
      "Team Access",
      "Referral Contact Management",
      "Insurance & Level of Care Listings",
    ],
    cta: "Get Started",
    featured: false,
    badge: null as string | null,
  },
  {
    name: "Done For You",
    price: "$499",
    period: "",
    priceNote: "One-Time Setup",
    description:
      "We’ll build your entire CenterLinked profile for you. Simply send us your materials — then log in anytime to make future updates.",
    features: [
      "Professional Profile Setup",
      "Logo, facility information & photos",
      "Insurance contracts & programs",
      "Contact information included",
      "Share-ready profile for referral partners",
      "Recommended for busy organizations",
    ],
    cta: "Get Started",
    featured: true,
    badge: "Recommended",
  },
];

export function Pricing() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>Pricing</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Simple{" "}
            <DisplayAccent>Pricing</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Build your live referral profile yourself — or let us set it up for you.
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
              {plan.badge && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  {plan.badge}
                </div>
              )}
              <div>
                <h3 className="font-display text-xl text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{plan.priceNote}</p>
                <div className="mt-5 flex items-baseline gap-1 flex-wrap">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
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
      </div>
    </section>
  );
}
