import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/billing";
import {
  DFY_PACKAGES,
  ENTERPRISE,
  MEMBERSHIP_INCLUDED,
  MEMBERSHIP_TIERS,
  PRICING_HEADING,
  dfyPriceLabel,
  formatUsdFromCents,
  membershipPriceLabel,
  type BillingInterval,
  type MembershipTierId,
} from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LoadingKey = `${MembershipTierId}-${"self" | "dfy"}` | "enterprise" | null;

export function Pricing() {
  const { user, profile, isFacilityAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);

  const handleCheckout = async (membershipTier: MembershipTierId, doneForYou: boolean) => {
    if (authLoading) return;

    if (!user) {
      navigate("/signup", {
        state: {
          from: "/setup-organization",
          checkoutPlan: { membershipTier, interval, doneForYou },
        },
      });
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

    const key: LoadingKey = `${membershipTier}-${doneForYou ? "dfy" : "self"}`;
    setLoadingKey(key);
    try {
      const url = await startCheckout({ membershipTier, interval, doneForYou });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setLoadingKey(null);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>Pricing</SectionBadge>
          <DisplayHeading as="h2" align="center">
            {PRICING_HEADING.titleBefore}{" "}
            <DisplayAccent>{PRICING_HEADING.titleAccent}</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {PRICING_HEADING.summary}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
            {(["month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setInterval(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  interval === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "month" ? "Monthly" : "Yearly · 2 months free"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
          {MEMBERSHIP_TIERS.map((tier) => {
            const dfy = DFY_PACKAGES.find((pkg) => pkg.id === tier.id)!;
            const selfKey: LoadingKey = `${tier.id}-self`;
            const dfyKey: LoadingKey = `${tier.id}-dfy`;
            return (
              <div
                key={tier.id}
                className={`relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
                  tier.featured
                    ? "bg-card border-primary/40 shadow-lg shadow-primary/10 ring-1 ring-primary/15"
                    : "bg-card border-border shadow-sm hover:shadow-md hover:border-primary/25"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    {tier.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl text-foreground">{tier.name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{tier.facilityLabel}</p>
                  <div className="mt-5 flex items-baseline gap-1 flex-wrap">
                    <span className="text-4xl font-bold text-foreground">
                      {membershipPriceLabel(tier, interval)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {interval === "year" ? "/year" : "/month"}
                    </span>
                  </div>
                  {interval === "year" && (
                    <p className="mt-1.5 text-sm font-medium text-foreground/80">
                      {formatUsdFromCents(tier.monthlyCents)}/month billed annually
                    </p>
                  )}
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{tier.description}</p>
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {MEMBERSHIP_INCLUDED.map((feature) => (
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
                  variant={tier.featured ? "hero" : "hero-outline"}
                  size="lg"
                  className="mt-7 w-full group rounded-full"
                  disabled={!!loadingKey || authLoading}
                  onClick={() => handleCheckout(tier.id, false)}
                >
                  {loadingKey === selfKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="mt-2 w-full rounded-full"
                  disabled={!!loadingKey || authLoading}
                  onClick={() => handleCheckout(tier.id, true)}
                >
                  {loadingKey === dfyKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  We’ll build it · {dfyPriceLabel(dfy)} setup
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 max-w-6xl mx-auto rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg text-foreground">{ENTERPRISE.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ENTERPRISE.facilityLabel}. Custom membership from {formatUsdFromCents(ENTERPRISE.monthlyFromCents)}/month.
              {" "}{ENTERPRISE.description}
            </p>
          </div>
          <Button asChild variant="hero-outline" className="rounded-full shrink-0">
            <Link to="/request-access">
              Request access
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Prefer to talk first?{" "}
          <Link to="/request-access" className="underline underline-offset-2 hover:text-foreground">
            Request access
          </Link>
          . Team seats are unlimited on every plan. Referral partners who only open your public profile are not billed.
        </p>
      </div>
    </section>
  );
}
