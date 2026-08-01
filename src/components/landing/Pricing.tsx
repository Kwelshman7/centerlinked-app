import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout, type BillingPlan } from "@/lib/billing";
import { toast } from "sonner";

const plans = [
  {
    id: "membership" as BillingPlan,
    name: "Build It Yourself",
    priceNote: "Build your own profile",
    price: "$99",
    period: "/month",
    priceDetail: null as string | null,
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
    id: "done_for_you" as BillingPlan,
    name: "Done For You",
    priceNote: "We build your profile",
    price: "$499",
    period: " one-time setup",
    priceDetail: "then $99/month",
    description:
      "We’ll build your entire CenterLinked profile for you. After setup, you stay on the same $99/month membership — and can update anytime.",
    features: [
      "Everything in Build It Yourself",
      "Professional profile setup by our team",
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
  const { user, profile, isFacilityAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);

  const handleCheckout = async (plan: BillingPlan) => {
    if (authLoading) return;

    if (!user) {
      navigate("/signup", { state: { from: "/setup-organization", checkoutPlan: plan } });
      toast.message("Create an account to join or set up your organization");
      return;
    }

    if (!profile?.organization_id) {
      navigate("/setup-organization", { replace: false });
      toast.message("Set up your organization before subscribing");
      return;
    }

    if (!isFacilityAdmin && !isSuperAdmin) {
      navigate("/app", { replace: false });
      toast.message("Your organization is already set up. An organization admin can choose its subscription.");
      return;
    }

    setLoadingPlan(plan);
    try {
      const url = await startCheckout(plan);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setLoadingPlan(null);
    }
  };

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
            Every organization is $99/month. Build your own profile, or add a one-time $499 setup and we’ll build it for you.
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
                {plan.priceDetail && (
                  <p className="mt-1.5 text-base font-semibold text-foreground">
                    {plan.priceDetail}
                  </p>
                )}
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
                type="button"
                variant={plan.featured ? "hero" : "hero-outline"}
                size="lg"
                className="mt-7 w-full group rounded-full"
                disabled={!!loadingPlan || authLoading}
                onClick={() => handleCheckout(plan.id)}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {plan.cta}
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Prefer to talk first?{" "}
                <Link to="/request-access" className="underline underline-offset-2 hover:text-foreground">
                  Request access
                </Link>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
