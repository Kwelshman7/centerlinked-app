import { useAuth } from "@/contexts/AuthContext";
import { UserRound } from "lucide-react";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { OrgClaimOptions } from "@/components/app/OrgClaimOptions";
import { SuperAdminSetupAlert } from "@/components/app/admin/SuperAdminSetupAlert";
import { AdminOverview } from "@/pages/app/admin/AdminOverview";

export default function Dashboard() {
  const { user, profile, isSuperAdmin, needsSuperAdminSetup } = useAuth();
  const orgId = profile?.organization_id ?? null;

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {needsSuperAdminSetup && <SuperAdminSetupAlert />}
        <AdminOverview compact={Boolean(orgId)} />
        {orgId && (
          <OrgDashboard
            organizationId={orgId}
            welcomeName={profile?.full_name || "there"}
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
          welcomeName={profile?.full_name || "there"}
        />
      </div>
    );
  }

  // Free account with no organization yet: My profile.
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {needsSuperAdminSetup && <SuperAdminSetupAlert />}
      <div>
        <h1 className="font-heading text-2xl font-bold">My profile</h1>
        <p className="text-muted-foreground mt-1">
          Your free account can search the full in-network database.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{profile?.full_name || user?.email}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
          Free
        </span>
      </div>

      <OrgClaimOptions />
    </div>
  );
}
