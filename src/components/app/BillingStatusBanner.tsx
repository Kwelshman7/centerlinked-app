import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isSubscriptionActive } from "@/lib/billing";
import { Button } from "@/components/ui/button";

/** Soft prompt when the org is not on an active membership. */
export function BillingStatusBanner() {
  const { profile, isFacilityAdmin, isSuperAdmin } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!profile?.organization_id) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("subscription_status")
        .eq("id", profile.organization_id!)
        .maybeSingle();
      if (!cancelled) {
        setStatus((data as { subscription_status?: string } | null)?.subscription_status ?? "none");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.organization_id]);

  if (dismissed || !profile?.organization_id || !status) return null;
  if (isSubscriptionActive(status)) return null;

  const canManage = isFacilityAdmin || isSuperAdmin;
  const pastDue = status === "past_due";

  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
        pastDue
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-primary/25 bg-primary/5"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <CreditCard className={`h-4 w-4 mt-0.5 shrink-0 ${pastDue ? "text-amber-700" : "text-primary"}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {pastDue ? "Payment past due" : "Membership not active yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pastDue
              ? "Update your payment method to keep billing current."
              : "Organizations run on a membership priced by how many facilities you list — from $99/month for one location. You can still use the app if membership is not active yet."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canManage && (
          <Button asChild size="sm">
            <Link to="/app/billing">
              {pastDue ? "Update billing" : "View billing"}
            </Link>
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
