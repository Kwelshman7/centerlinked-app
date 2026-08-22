import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatSetupPackage,
  formatSubscriptionStatus,
  isSubscriptionActive,
  type OrgBilling,
} from "@/lib/billing";
import { PRICING_SUMMARY } from "@/lib/pricing";

type Props = {
  billing: OrgBilling | null;
  canManage: boolean;
  onRefresh?: () => void;
};

export function OrgBillingCard({ billing, canManage }: Props) {
  const status = billing?.subscription_status || "none";
  const active = isSubscriptionActive(status);

  const renewal =
    billing?.subscription_current_period_end &&
    new Date(billing.subscription_current_period_end).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold inline-flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{PRICING_SUMMARY}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
            Status
          </p>
          <p className="font-heading font-semibold mt-0.5">{formatSubscriptionStatus(status)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
            Setup
          </p>
          <p className="font-heading font-semibold mt-0.5">
            {formatSetupPackage(billing?.setup_package)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
            {active ? "Renews" : "Period end"}
          </p>
          <p className="font-heading font-semibold mt-0.5">{renewal || "—"}</p>
        </div>
      </div>

      {canManage ? (
        <Button asChild>
          <Link to="/app/billing">{active ? "Manage billing" : "Choose a plan"}</Link>
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ask an organization admin to manage billing for this account.
        </p>
      )}
    </Card>
  );
}
