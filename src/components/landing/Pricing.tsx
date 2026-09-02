import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { PricingInquiryDialog } from "./PricingInquiryDialog";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/billing";
import {
  ENTERPRISE,
  MEMBERSHIP_INCLUDED,
  PRICING_HEADING,
  PRICING_SLIDER_MAX,
  formatUsdFromCents,
  membershipQuoteForFacilityCount,
  type BillingInterval,
  type MembershipTierId,
} from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LoadingKey = `${MembershipTierId}-${"self" | "dfy"}` | "enterprise" | null;

const YEARLY_SAVE_PERCENT = 20;

const SLIDER_TICKS = [
  { value: 1, label: "1" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 16, label: "16+" },
] as const;

export function Pricing() {
  const { user, profile, isFacilityAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [facilityCount, setFacilityCount] = useState(1);
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const quote = membershipQuoteForFacilityCount(facilityCount);
  const fillPct = ((facilityCount - 1) / (PRICING_SLIDER_MAX - 1)) * 100;

  const handleCheckout = async (membershipTier: MembershipTierId, doneForYou: boolean) => {
    if (authLoading) return;

    if (!user) {
      navigate("/signup", {
        state: {
          from: "/setup-organization",
          checkoutPlan: { membershipTier, interval, doneForYou, facilityCount },
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
      const url = await startCheckout({ membershipTier, interval, doneForYou, facilityCount });
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

        <div className="mt-10 sm:mt-12 mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex justify-center border-b border-border/70 px-6 py-4 sm:py-5">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setInterval("month")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    interval === "month"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("year")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    interval === "year"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Yearly
                </button>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                Save {YEARLY_SAVE_PERCENT}%
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold text-foreground">Every organization gets</p>
              <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 sm:gap-x-8 lg:grid-cols-1 lg:gap-y-3.5">
                {MEMBERSHIP_INCLUDED.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 min-w-0">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm text-foreground/90 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border/70 bg-secondary/35 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="text-center lg:text-left">
                <p className="text-sm font-semibold text-muted-foreground">How many facilities?</p>
                <p className="mt-2 font-display text-3xl sm:text-4xl text-foreground">
                  {quote.facilityLabel}
                </p>
              </div>

              <div className="mt-6">
                <label className="sr-only" htmlFor="facility-count-slider">
                  Number of live facilities
                </label>
                <input
                  id="facility-count-slider"
                  type="range"
                  min={1}
                  max={PRICING_SLIDER_MAX}
                  step={1}
                  value={facilityCount}
                  onChange={(e) => setFacilityCount(Number(e.target.value))}
                  aria-valuemin={1}
                  aria-valuemax={PRICING_SLIDER_MAX}
                  aria-valuenow={facilityCount}
                  aria-valuetext={
                    quote.isEnterprise
                      ? "16 or more facilities, custom pricing"
                      : `${quote.facilityLabel}, ${formatUsdFromCents(interval === "year" ? quote.annualCents : quote.monthlyCents)} ${interval === "year" ? "per year" : "per month"}`
                  }
                  className="facility-count-slider w-full cursor-pointer appearance-none bg-transparent"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${fillPct}%, hsl(var(--border)) ${fillPct}%)`,
                    height: "8px",
                    borderRadius: "999px",
                  }}
                />
                <div className="mt-2 flex justify-between text-[11px] sm:text-xs font-medium text-muted-foreground">
                  {SLIDER_TICKS.map((tick) => (
                    <button
                      key={tick.value}
                      type="button"
                      className={cn(
                        "tabular-nums hover:text-foreground transition-colors",
                        facilityCount === tick.value && "text-primary font-semibold",
                      )}
                      onClick={() => setFacilityCount(tick.value)}
                    >
                      {tick.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center lg:text-left">
                {quote.isEnterprise ? (
                  <>
                    <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                      Custom
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Membership from {formatUsdFromCents(ENTERPRISE.monthlyFromCents)}/month.
                      We’ll quote Done For You for your footprint.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center lg:justify-start gap-1.5">
                      <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                        {formatUsdFromCents(interval === "year" ? quote.annualCents : quote.monthlyCents)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {interval === "year" ? "/year" : "/month"}
                      </span>
                    </div>
                    {interval === "year" ? (
                      <p className="mt-1.5 text-sm font-medium text-foreground/80">
                        {formatUsdFromCents(quote.monthlyCents)}/month billed annually
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {quote.facilityCount === 1
                        ? "One live facility on your organization link."
                        : `${quote.facilityLabel} on one organization link.`}
                    </p>
                  </>
                )}
              </div>

              {quote.isEnterprise ? (
                <Button asChild variant="hero" size="lg" className="mt-8 w-full rounded-full">
                  <Link to="/signup">
                    Create your account
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="mt-8 w-full group rounded-full"
                    disabled={!!loadingKey || authLoading}
                    onClick={() => handleCheckout(quote.tier.id, false)}
                  >
                    {loadingKey === `${quote.tier.id}-self` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="mt-2 w-full rounded-full"
                    disabled={!!loadingKey || authLoading}
                    onClick={() => handleCheckout(quote.tier.id, true)}
                  >
                    {loadingKey === `${quote.tier.id}-dfy` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    We’ll build it · {formatUsdFromCents(quote.dfyCents)} setup
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prefer to talk first?{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setInquiryOpen(true)}
          >
            Send us a message
          </button>
          .
        </p>
        <PricingInquiryDialog
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          defaultName={profile?.full_name ?? ""}
          defaultEmail={user?.email ?? ""}
        />
      </div>

      <style>{`
        .facility-count-slider {
          --thumb: 1.25rem;
        }
        .facility-count-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--thumb);
          height: var(--thumb);
          border-radius: 999px;
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--card));
          box-shadow: 0 0 0 1px hsl(var(--primary) / 0.35), 0 2px 8px hsl(var(--primary) / 0.28);
          margin-top: calc((8px - var(--thumb)) / 2);
        }
        .facility-count-slider::-moz-range-thumb {
          width: var(--thumb);
          height: var(--thumb);
          border-radius: 999px;
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--card));
          box-shadow: 0 0 0 1px hsl(var(--primary) / 0.35), 0 2px 8px hsl(var(--primary) / 0.28);
        }
        .facility-count-slider::-moz-range-track {
          background: transparent;
        }
        .facility-count-slider:focus-visible {
          outline: none;
        }
        .facility-count-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px hsl(var(--ring) / 0.35);
        }
      `}</style>
    </section>
  );
}
