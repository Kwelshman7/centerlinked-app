import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/app/search/SearchForm";
import { VerificationBadge, verificationState } from "@/components/app/search/VerificationBadge";
import { ShareSheetButton } from "@/components/app/ShareSheetButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, CheckSquare, Plus, ShieldAlert } from "lucide-react";

interface MyFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  verification_status: "pending" | "approved" | "rejected";
}

export default function SearchHome() {
  const { profile, isSuperAdmin } = useAuth();
  const [facilities, setFacilities] = useState<MyFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile?.organization_id) { setLoading(false); return; }
      const { data } = await supabase
        .from("facilities")
        .select("id,name,slug,city,state,contracts_verified_at,verification_frozen,verification_status")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });
      setFacilities((data as MyFacility[]) ?? []);
      setLoading(false);
    })();
  }, [profile?.organization_id]);

  const dueCount = facilities.filter((f) => {
    const s = verificationState(f.contracts_verified_at, f.verification_frozen);
    return s.tier === "stale" || s.tier === "frozen" || s.tier === "never";
  }).length;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto w-full space-y-5">
        <div className="text-center space-y-2 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Find in-network facilities</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Search verified treatment contracts by insurance, location, and level of care.
          </p>
        </div>
        <Card className="p-5 sm:p-6 shadow-md">
          <SearchForm />
        </Card>
      </div>

      {/* My facilities widget */}
      {profile?.organization_id && (
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> My facilities
              </h2>
              <p className="text-xs text-muted-foreground">Share, verify, and keep your contracts current.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/facilities"><Plus className="h-4 w-4" /> Manage</Link>
            </Button>
          </div>

          {dueCount > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold">{dueCount}</span>{" "}
                {dueCount === 1 ? "facility needs" : "facilities need"} re-verification.
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/facilities">Review</Link>
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
          ) : facilities.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              You haven't added any facilities yet.{" "}
              <Link to="/app/onboarding?add=1" className="text-primary font-medium hover:underline">Add your first one</Link>.
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {facilities.map((f) => (
                <Card key={f.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/app/facilities/${f.id}`} className="font-semibold text-sm hover:text-primary line-clamp-1">
                        {f.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[f.city, f.state].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                    <VerificationBadge verifiedAt={f.contracts_verified_at} frozen={f.verification_frozen} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {f.slug && f.verification_status === "approved" ? (
                      <ShareSheetButton slug={f.slug} variant="outline" size="sm" label="Share" className="w-full" />
                    ) : (
                      <div />
                    )}
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/app/facilities/${f.id}/verify`}>
                        <CheckSquare className="h-3.5 w-3.5" /> Verify
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {isSuperAdmin && (
        <div className="max-w-4xl mx-auto w-full pt-2">
          <Card className="p-4 bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">Super admin tools</span>
              <span className="text-muted-foreground ml-2">Access requests, verifications & insurance DB.</span>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/app/admin/requests">Access requests</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/app/verifications">Verifications</Link></Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
