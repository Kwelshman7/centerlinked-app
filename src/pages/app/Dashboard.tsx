import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { OrgClaimOptions } from "@/components/app/OrgClaimOptions";
import { InviteColleagueCard } from "@/components/app/InviteColleagueCard";
import { claimPendingOrgInvite } from "@/lib/org-setup";
import { BdProfileForm } from "@/components/app/BdProfileForm";
import { SuperAdminSetupAlert } from "@/components/app/admin/SuperAdminSetupAlert";
import { AdminOverview } from "@/pages/app/admin/AdminOverview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fullNameFromAuthUser } from "@/lib/auth-user";

export default function Dashboard() {
  const { profile, user, isSuperAdmin, needsSuperAdminSetup, refresh } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const welcomeName = profile?.full_name || fullNameFromAuthUser(user) || "there";
  const claimedForUser = useRef(false);

  useEffect(() => {
    if (orgId || isSuperAdmin || claimedForUser.current) return;
    let cancelled = false;
    void claimPendingOrgInvite()
      .then(async (claimed) => {
        if (cancelled || !claimed.joined) return;
        claimedForUser.current = true;
        await refresh();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't join your organization", {
          description: "Use Accept invite below, or refresh and try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, isSuperAdmin, refresh]);

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {needsSuperAdminSetup && <SuperAdminSetupAlert />}
        <AdminOverview compact={Boolean(orgId)} />
        {orgId && (
          <OrgDashboard
            organizationId={orgId}
            welcomeName={welcomeName}
          />
        )}
      </div>
    );
  }

  if (orgId) {
    return (
      <div className="space-y-6">
        {needsSuperAdminSetup && <SuperAdminSetupAlert />}
        <OrgDashboard
          organizationId={orgId}
          welcomeName={welcomeName}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {needsSuperAdminSetup && <SuperAdminSetupAlert />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold">My profile</h1>
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
              Free
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            This is how other BD reps see you. You can search who accepts what insurance without claiming an organization.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/app/search">
            <SearchIcon className="h-4 w-4" />
            Search insurance
          </Link>
        </Button>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Your profile</h2>
        <BdProfileForm />
      </Card>

      <InviteColleagueCard />

      <OrgClaimOptions />
    </div>
  );
}
