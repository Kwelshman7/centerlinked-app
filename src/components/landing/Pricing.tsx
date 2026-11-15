import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PricingInquiryDialog } from "./PricingInquiryDialog";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/billing";
import {
  ENTERPRISE,
  LISTED_TIER,
  MEMBERSHIP_INCLUDED,
  PRICING_HEADING,
  PRICING_SLIDER_MIN,
  formatUsdFromCents,
  membershipQuoteForFacilityCount,
  type BillingInterval,
  type MembershipTierId,
} from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LoadingKey = `${MembershipTierId}-${"self" | "dfy"}` | "enterprise" | null;

const YEARLY_SAVE_PERCENT = 20;

const SLIDER_END = 15;

const SLIDER_TICKS = [
  { value: 1, label: "1" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 15, label: "15+" },
] as const;

/**
 * [job to be done, what the free offer covers, what membership bundles]
 *
 * Membership rows come from MEMBERSHIP_INCLUDED. These describe what each
 * offer includes, not a hard feature lock — billing is soft-gated.
 */
const FREE_VS_MEMBERSHIP: Array<[string, string, string]> = [
  ["Search by payer, level of care, and city", "Yes — free with a work email", "Yes"],
  ["See the business development contact on a result", "Yes", "Yes"],
  ["Keep the people you call in Contacts", "Yes", "Yes"],
  ["Be found by partners searching", "Yes — listing is free", "Yes"],
  ["Claim your organization", "Yes — no card required", "Yes"],
  ["Maintained organization profile and dashboard", "Not part of the free offer", "Included"],
  ["Monthly verification on every facility", "Not part of the free offer", "Included"],
  ["Unlimited team seats", "Not part of the free offer", "Included"],
  ["Price", "$0", "From $99/month by facility count, 20% off annual"],
];

export function Pricing() {
  const { user, profile, isFacilityAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [facilityCount, setFacilityCount] = useState(PRICING_SLIDER_MIN);
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const quote = membershipQuoteForFacilityCount(facilityCount);
  const sliderProgress = (facilityCount - PRICING_SLIDER_MIN) / (SLIDER_END - PRICING_SLIDER_MIN);

  const handleCheckout = async (membershipTier: MembershipTierId, doneForYou: boolean) => {
    if (authLoading) return;

    if (!user) {
      navigate("/join", {
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
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2088b8]">Pricing</p>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-[#0c2c33] sm:text-4xl lg:text-5xl">
            {PRICING_HEADING.titleBefore}{" "}
            <span className="text-[#2088b8]">{PRICING_HEADING.titleAccent}</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#4d656c] sm:text-lg">
            {PRICING_HEADING.summary}
          </p>
        </div>

        <p className="mt-10 text-center text-sm text-[#4d656c] sm:mt-12 sm:text-base">
          {LISTED_TIER.tableNote}
        </p>

        <div className="mt-4 overflow-hidden rounded-3xl border border-[#003048]/10 bg-white shadow-sm sm:mt-5">
          <div className="flex justify-center border-b border-[#003048]/8 bg-[#e7f3f8]/50 px-6 py-4 sm:py-5">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <div className="inline-flex rounded-full border border-[#003048]/10 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setInterval("month")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8]/45",
                    interval === "month"
                      ? "bg-[#003048] text-white"
                      : "text-[#4d656c] hover:text-[#003048]",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("year")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8]/45",
                    interval === "year"
                      ? "bg-[#003048] text-white"
                      : "text-[#4d656c] hover:text-[#003048]",
                  )}
                >
                  Yearly
                </button>
              </div>
              <span className="rounded-full bg-[#2088b8]/12 px-2.5 py-1 text-[11px] font-semibold text-[#2088b8]">
                Save {YEARLY_SAVE_PERCENT}%
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold text-[#0c2c33]">Every organization gets</p>
              <ul className="mt-5 grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1 lg:gap-y-3.5">
                {MEMBERSHIP_INCLUDED.map((feature) => (
                  <li key={feature} className="flex min-w-0 items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2088b8]" aria-hidden />
                    <span className="text-sm leading-snug text-[#14343c]/90">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#003048]/8 bg-[#f4f8fb] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="text-center lg:text-left">
                <p className="text-sm font-semibold text-[#4d656c]">How many facilities?</p>
                <p className="mt-2 font-heading text-3xl font-bold text-[#0c2c33] sm:text-4xl">
                  {facilityCount >= SLIDER_END ? "15+" : quote.facilityLabel}
                </p>
              </div>

              <div className="facility-count-slider-wrap mt-6">
                <label className="sr-only" htmlFor="facility-count-slider">
                  Number of live facilities
                </label>
                <input
                  id="facility-count-slider"
                  type="range"
                  min={PRICING_SLIDER_MIN}
                  max={SLIDER_END}
                  step={1}
                  value={facilityCount}
                  onChange={(e) => setFacilityCount(Number(e.target.value))}
                  aria-valuemin={PRICING_SLIDER_MIN}
                  aria-valuemax={SLIDER_END}
                  aria-valuenow={facilityCount}
                  aria-valuetext={
                    quote.isEnterprise
                      ? "16 or more facilities, custom pricing"
                      : quote.isListed
                        ? quote.facilityLabel
                        : `${quote.facilityLabel}, ${formatUsdFromCents(interval === "year" ? quote.annualCents : quote.monthlyCents)} ${interval === "year" ? "per year" : "per month"}`
                  }
                  className="facility-count-slider w-full cursor-pointer appearance-none bg-transparent"
                  style={{
                    ["--slider-progress" as string]: String(sliderProgress),
                  }}
                />
                <div className="relative mt-2 h-5 text-[11px] font-medium text-[#4d656c] sm:text-xs">
                  {SLIDER_TICKS.map((tick) => {
                    const progress =
                      (tick.value - PRICING_SLIDER_MIN) / (SLIDER_END - PRICING_SLIDER_MIN);
                    const isFirst = tick.value === PRICING_SLIDER_MIN;
                    const isLast = tick.value === SLIDER_END;
                    return (
                      <button
                        key={tick.value}
                        type="button"
                        className={cn(
                          "absolute top-0 tabular-nums transition-colors hover:text-[#003048] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8]/45",
                          isFirst ? "translate-x-0" : isLast ? "-translate-x-full" : "-translate-x-1/2",
                          facilityCount === tick.value && "font-semibold text-[#2088b8]",
                        )}
                        style={{
                          left: `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${progress})`,
                        }}
                        onClick={() => setFacilityCount(tick.value)}
                      >
                        {tick.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 text-center lg:text-left">
                {quote.isEnterprise ? (
                  <>
                    <p className="font-heading text-4xl font-extrabold tracking-tight text-[#0c2c33] sm:text-5xl">
                      Custom
                    </p>
                    <p className="mt-2 text-sm text-[#4d656c]">
                      Membership from {formatUsdFromCents(ENTERPRISE.monthlyFromCents)}/month.
                      We’ll quote Done For You for your footprint.
                    </p>
                  </>
                ) : quote.isListed ? null : (
                  <>
                    <div className="flex items-baseline justify-center gap-1.5 lg:justify-start">
                      <span className="font-heading text-4xl font-extrabold tracking-tight text-[#0c2c33] sm:text-5xl">
                        {formatUsdFromCents(interval === "year" ? quote.annualCents : quote.monthlyCents)}
                      </span>
                      <span className="text-sm text-[#4d656c]">
                        {interval === "year" ? "/year" : "/month"}
                      </span>
                    </div>
                    {interval === "year" ? (
                      <p className="mt-1.5 text-sm font-medium text-[#14343c]/80">
                        {formatUsdFromCents(quote.monthlyCents)}/month billed annually
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-[#4d656c]">
                      {quote.facilityCount === 1
                        ? "One live facility on your organization link."
                        : `${quote.facilityLabel} on one organization link.`}
                    </p>
                  </>
                )}
              </div>

              {quote.isEnterprise ? (
                <Button
                  asChild
                  variant="hero"
                  size="lg"
                  className="mt-8 w-full rounded-full bg-[#003048] text-white hover:bg-[#062838]"
                >
                  <Link to="/join">
                    Create your account
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : quote.isListed ? null : (
                <>
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="mt-8 w-full rounded-full bg-[#003048] text-white hover:bg-[#062838] group"
                    disabled={!!loadingKey || authLoading}
                    onClick={() => handleCheckout(quote.tier.id, false)}
                  >
                    {loadingKey === `${quote.tier.id}-self` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="mt-2 w-full rounded-full text-[#003048] hover:bg-[#e7f3f8] hover:text-[#003048]"
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

        <section aria-labelledby="free-vs-membership" className="mt-12 sm:mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="free-vs-membership"
              className="font-heading text-2xl font-bold leading-tight text-[#0c2c33] sm:text-3xl"
            >
              What free covers, and what membership adds.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4d656c] sm:text-base">
              Free is not a trial that runs out. It is how the directory gets useful: a program nobody can find is not
              worth searching, and a search nobody runs is not worth listing on. So being found stays free, and
              searching stays free. Membership is for the organization that wants the profile maintained.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-[#003048]/10">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                What a free account covers compared with a paid organization membership
              </caption>
              <thead>
                <tr className="bg-[#e7f3f8]/60">
                  <th scope="col" className="px-4 py-3.5 font-semibold text-[#0c2c33] sm:px-6">
                    What you want to do
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-[#0c2c33] sm:px-6">
                    Free
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-[#0c2c33] sm:px-6">
                    Membership
                  </th>
                </tr>
              </thead>
              <tbody>
                {FREE_VS_MEMBERSHIP.map(([job, free, paid]) => (
                  <tr key={job} className="border-t border-[#003048]/8 align-top">
                    <th scope="row" className="px-4 py-3.5 font-medium text-[#14343c] sm:px-6">
                      {job}
                    </th>
                    <td className="px-4 py-3.5 text-[#4d656c] sm:px-6">{free}</td>
                    <td className="px-4 py-3.5 text-[#4d656c] sm:px-6">{paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6">
              <h3 className="font-heading text-lg font-bold text-[#0c2c33]">What claiming an organization costs</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">
                Nothing. Claiming your organization and keeping it listed is free, and no card is required. Membership
                is a separate decision you make later, when keeping facilities, contracts, and contacts current is
                worth more than reprinting a one-pager.
              </p>
              <Link
                to="/join"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2088b8] underline-offset-2 hover:underline"
              >
                Claim your organization
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
            <article className="rounded-3xl border border-[#d3e3ee] bg-[#f4f8fb] p-6">
              <h3 className="font-heading text-lg font-bold text-[#0c2c33]">Changing or cancelling</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4d656c]">
                Membership is month to month unless you choose annual billing. Open Billing in the app and use
                “Cancel or manage plan”; it opens the Stripe customer portal, where you change the plan or cancel.
                A cancellation runs to the end of the period you have already paid for. It does not delete your
                organization — the listing goes back to free.
              </p>
            </article>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-[#4d656c]">
          Prefer to talk first?{" "}
          <button
            type="button"
            className="font-medium text-[#2088b8] underline underline-offset-2 hover:text-[#003048] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8]/45"
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
        .facility-count-slider-wrap {
          --thumb: 1.25rem;
        }
        .facility-count-slider {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #2088b8 calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--slider-progress)),
            #d5e4ea calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--slider-progress))
          );
        }
        .facility-count-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--thumb);
          height: var(--thumb);
          border-radius: 999px;
          background: #2088b8;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(32, 136, 184, 0.35), 0 2px 8px rgba(32, 136, 184, 0.28);
          margin-top: calc((8px - var(--thumb)) / 2);
        }
        .facility-count-slider::-moz-range-thumb {
          width: var(--thumb);
          height: var(--thumb);
          border-radius: 999px;
          background: #2088b8;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(32, 136, 184, 0.35), 0 2px 8px rgba(32, 136, 184, 0.28);
        }
        .facility-count-slider::-moz-range-track {
          background: transparent;
        }
        .facility-count-slider:focus-visible {
          outline: none;
        }
        .facility-count-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(32, 136, 184, 0.35);
        }
      `}</style>
    </section>
  );
}
