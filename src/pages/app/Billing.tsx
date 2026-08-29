import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Receipt,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MembershipPlanPicker,
  type PlanPickerLoading,
} from "@/components/app/MembershipPlanPicker";
import {
  fetchBillingOverview,
  formatSetupPackage,
  formatSubscriptionStatus,
  isSubscriptionActive,
  openBillingPortal,
  startCheckout,
  type BillingOverview,
} from "@/lib/billing";
import {
  ENTERPRISE,
  PRICING_SUMMARY,
  dfyPackageForFacilityCount,
  dfyPriceLabel,
  formatUsdFromCents,
  type BillingInterval,
  type MembershipTierId,
} from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function Billing() {
  const { profile, isFacilityAdmin, isSuperAdmin } = useAuth();
  const canManage = isFacilityAdmin || isSuperAdmin;
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [facilityCount, setFacilityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingKey, setLoadingKey] = useState<PlanPickerLoading>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [dfyLoading, setDfyLoading] = useState(false);

  const load = useCallback(async () => {
    if (!canManage || !profile?.organization_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchBillingOverview();
      setOverview(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load billing");
    }
    try {
      const countRes = await supabase
        .from("facilities")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);
      if (!countRes.error) setFacilityCount(countRes.count ?? 0);
    } catch {
      /* Facility count only prices DFY; don't block billing. */
    } finally {
      setLoading(false);
    }
  }, [canManage, profile?.organization_id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      toast.success("Billing updated — welcome aboard");
      const next = new URLSearchParams(searchParams);
      next.delete("billing");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
      void load();
    }
  }, [searchParams, setSearchParams, load]);

  if (!canManage) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (!profile?.organization_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <Card className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Join or create an organization before managing billing.
          </p>
          <Button asChild>
            <Link to="/setup-organization">Set up organization</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const org = overview?.organization;
  const status = org?.subscription_status || "none";
  const active = isSubscriptionActive(status);
  const hasCustomer = !!org?.stripe_customer_id;
  const hasDfy = org?.setup_package === "done_for_you";
  const canceling = !!overview?.subscription?.cancel_at_period_end;
  const renewal = overview?.subscription?.current_period_end || org?.subscription_current_period_end;
  const pm = overview?.payment_method;
  const dfyPkg = dfyPackageForFacilityCount(facilityCount);
  const busy = !!loadingKey || portalLoading || dfyLoading;

  const subscribe = async (membershipTier: MembershipTierId, doneForYou: boolean) => {
    const key: PlanPickerLoading = `${membershipTier}-${doneForYou ? "dfy" : "self"}`;
    setLoadingKey(key);
    try {
      const url = await startCheckout({ membershipTier, interval, doneForYou });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Billing request failed");
      setLoadingKey(null);
    }
  };

  const addDfy = async () => {
    if (dfyPkg === "enterprise") return;
    setDfyLoading(true);
    try {
      const url = await startCheckout({
        membershipTier: dfyPkg.id,
        interval,
        doneForYou: true,
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Billing request failed");
      setDfyLoading(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      window.location.href = await openBillingPortal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Billing request failed");
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold inline-flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{PRICING_SUMMARY}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !overview ? (
        <Card className="p-8 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </Card>
      ) : (
        <>
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current subscription
                </p>
                <h2 className="font-heading text-xl font-bold mt-1">
                  {overview?.subscription?.product_name || "CenterLinked Membership"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {org?.name}
                  {org?.billing_email ? ` · ${org.billing_email}` : ""}
                </p>
              </div>
              <Badge variant={active ? "default" : "secondary"} className="shrink-0">
                {formatSubscriptionStatus(status)}
                {canceling ? " · Cancels at period end" : ""}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Price
                </p>
                <p className="font-heading font-semibold mt-0.5">
                  {overview?.subscription?.amount_label
                    ? `${overview.subscription.amount_label}/${overview.subscription.interval}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Setup package
                </p>
                <p className="font-heading font-semibold mt-0.5">
                  {formatSetupPackage(org?.setup_package)}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  {canceling ? "Ends" : active ? "Renews" : "Period end"}
                </p>
                <p className="font-heading font-semibold mt-0.5">{fmtDate(renewal)}</p>
              </div>
            </div>

            {pm?.last4 ? (
              <div className="rounded-xl border border-border/60 px-3 py-2.5 flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {pm.brand} ···· {pm.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {pm.exp_month}/{pm.exp_year}
                  </p>
                </div>
              </div>
            ) : null}

            {!active && (
              <MembershipPlanPicker
                interval={interval}
                onIntervalChange={setInterval}
                loadingKey={loadingKey}
                disabled={busy}
                onSubscribe={(tier, doneForYou) => void subscribe(tier, doneForYou)}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {active && !hasDfy && dfyPkg !== "enterprise" && (
                <Button type="button" onClick={() => void addDfy()} disabled={busy}>
                  {dfyLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Done For You · {dfyPriceLabel(dfyPkg)}
                </Button>
              )}
              {active && !hasDfy && dfyPkg === "enterprise" && (
                <Button asChild>
                  <Link to="/request-access">Quote Done For You · {ENTERPRISE.facilityLabel}</Link>
                </Button>
              )}
              {hasCustomer && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void openPortal()}
                    disabled={busy}
                  >
                    {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update payment method
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void openPortal()}
                    disabled={busy}
                  >
                    {active ? "Cancel or manage plan" : "Manage billing"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Payment method changes, cancellations, and full invoice downloads open in the secure
              Stripe customer portal. Small is {formatUsdFromCents(9900)}/month for one facility;
              Medium {formatUsdFromCents(24900)}; Large {formatUsdFromCents(49900)}. Done For You
              setup is {formatUsdFromCents(49900)} for one facility, {formatUsdFromCents(120000)} for
              2–5, and {formatUsdFromCents(250000)} for 6–15. 16+ locations are quoted. During early
              access the app stays usable if membership is not active yet.
            </p>
          </Card>

          {!active && (
            <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-semibold">{ENTERPRISE.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {ENTERPRISE.facilityLabel}. Custom membership from{" "}
                  {formatUsdFromCents(ENTERPRISE.monthlyFromCents)}/month.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/request-access">Request access</Link>
              </Button>
            </Card>
          )}

          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold inline-flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Transaction history
              </h2>
              {hasCustomer && (
                <Button type="button" variant="ghost" size="sm" onClick={() => void openPortal()} disabled={busy}>
                  Open portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {!hasCustomer || (overview?.invoices.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  After you subscribe, receipts and invoices will show up here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
                      <th className="py-2 pr-3 font-semibold">Date</th>
                      <th className="py-2 pr-3 font-semibold">Description</th>
                      <th className="py-2 pr-3 font-semibold">Status</th>
                      <th className="py-2 pr-3 font-semibold text-right">Amount</th>
                      <th className="py-2 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview!.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/40 last:border-0">
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {fmtDate(inv.created)}
                        </td>
                        <td className="py-3 pr-3 min-w-0">
                          <p className="font-medium truncate">{inv.description || inv.number}</p>
                          <p className="text-xs text-muted-foreground">{inv.number}</p>
                        </td>
                        <td className="py-3 pr-3 capitalize">{inv.status || "—"}</td>
                        <td className="py-3 pr-3 text-right font-medium whitespace-nowrap">
                          {inv.amount_label || "—"}
                        </td>
                        <td className="py-3 text-right">
                          {inv.hosted_invoice_url || inv.invoice_pdf ? (
                            <a
                              href={inv.hosted_invoice_url || inv.invoice_pdf || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
