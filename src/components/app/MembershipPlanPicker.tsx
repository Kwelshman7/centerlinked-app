import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DFY_PACKAGES,
  MEMBERSHIP_INCLUDED,
  MEMBERSHIP_TIERS,
  dfyPriceLabel,
  formatUsdFromCents,
  membershipPriceLabel,
  type BillingInterval,
  type MembershipTierId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export type PlanPickerLoading = `${MembershipTierId}-${"self" | "dfy"}` | null;

type Props = {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  loadingKey: PlanPickerLoading;
  disabled?: boolean;
  onSubscribe: (tier: MembershipTierId, doneForYou: boolean) => void;
};

export function MembershipPlanPicker({
  interval,
  onIntervalChange,
  loadingKey,
  disabled,
  onSubscribe,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center sm:justify-start">
        <div className="inline-flex rounded-full border border-border bg-background p-1">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onIntervalChange(value)}
              className={cn(
                "rounded-full px-3.5 py-1 text-sm font-semibold transition-colors",
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

      <div className="grid gap-4 lg:grid-cols-3">
        {MEMBERSHIP_TIERS.map((tier) => {
          const dfy = DFY_PACKAGES.find((pkg) => pkg.id === tier.id)!;
          const selfKey: PlanPickerLoading = `${tier.id}-self`;
          const dfyKey: PlanPickerLoading = `${tier.id}-dfy`;
          return (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl border p-4 sm:p-5 flex flex-col",
                tier.featured ? "border-primary/40 ring-1 ring-primary/15" : "border-border/70",
              )}
            >
              {tier.badge ? (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  {tier.badge}
                </span>
              ) : null}
              <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
              <p className="text-xs font-medium text-primary mt-0.5">{tier.facilityLabel}</p>
              <p className="font-heading text-2xl font-bold mt-3">
                {membershipPriceLabel(tier, interval)}
                <span className="text-sm font-medium text-muted-foreground">
                  {interval === "year" ? "/year" : "/mo"}
                </span>
              </p>
              {interval === "year" ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatUsdFromCents(tier.monthlyCents)}/mo billed annually
                </p>
              ) : null}
              <ul className="mt-3 space-y-1.5 flex-1">
                {MEMBERSHIP_INCLUDED.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-foreground/90">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
                <li className="text-xs text-muted-foreground">Unlimited seats · Search · verification</li>
              </ul>
              <Button
                type="button"
                className="mt-4 w-full"
                variant={tier.featured ? "default" : "outline"}
                disabled={disabled || !!loadingKey}
                onClick={() => onSubscribe(tier.id, false)}
              >
                {loadingKey === selfKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Subscribe · {membershipPriceLabel(tier, interval)}
                {interval === "year" ? "/yr" : "/mo"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-1.5 w-full"
                disabled={disabled || !!loadingKey}
                onClick={() => onSubscribe(tier.id, true)}
              >
                {loadingKey === dfyKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                We’ll build it · {dfyPriceLabel(dfy)}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
