import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  formatSetupPackage,
  formatSubscriptionStatus,
  isSubscriptionActive,
  openBillingPortal,
  startCheckout,
  type OrgBilling,
} from "@/lib/billing";

type Props = {
  billing: OrgBilling | null;
  canManage: boolean;
  onRefresh?: () => void;
};

export function OrgBillingCard({ billing, canManage }: Props) {
  const [loading, setLoading] = useState<"membership" | "done_for_you" | "portal" | null>(null);

  const status = billing?.subscription_status || "none";
  const active = isSubscriptionActive(status);
  const hasCustomer = !!billing?.stripe_customer_id;
  const hasDfy = billing?.setup_package === "done_for_you";

  const run = async (kind: "membership" | "done_for_you" | "portal") => {
    if (!canManage) {
      toast.error("Only organization admins can manage billing.");
      return;
    }
    setLoading(kind);
    try {
      const url =
        kind === "portal" ? await openBillingPortal() : await startCheckout(kind);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Billing request failed");
      setLoading(null);
    }
  };

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
          <p className="text-xs text-muted-foreground mt-1">
            Organization membership is $99/month. Optionally add a one-time $499 Done For You setup.
          </p>
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
            Plan
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
        <div className="flex flex-wrap gap-2">
          {!active && (
            <Button
              type="button"
              onClick={() => run("membership")}
              disabled={!!loading}
            >
              {loading === "membership" && <Loader2 className="h-4 w-4 animate-spin" />}
              Subscribe · $99/mo
            </Button>
          )}
          {!hasDfy && (
            <Button
              type="button"
              variant={active ? "default" : "outline"}
              onClick={() => run("done_for_you")}
              disabled={!!loading}
            >
              {loading === "done_for_you" && <Loader2 className="h-4 w-4 animate-spin" />}
              {active ? "Add Done For You · $499" : "Done For You · $499 + $99/mo"}
            </Button>
          )}
          {hasCustomer && (
            <Button
              type="button"
              variant="outline"
              onClick={() => run("portal")}
              disabled={!!loading}
            >
              {loading === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
              Manage billing
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ask an organization admin to manage billing for this account.
        </p>
      )}
    </Card>
  );
}
