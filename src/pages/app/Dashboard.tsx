import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { OrgClaimOptions } from "@/components/app/OrgClaimOptions";
import { BdProfileForm } from "@/components/app/BdProfileForm";
import { SuperAdminSetupAlert } from "@/components/app/admin/SuperAdminSetupAlert";
import { AdminOverview } from "@/pages/app/admin/AdminOverview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { profile, isSuperAdmin, needsSuperAdminSetup } = useAuth();
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

      <OrgClaimOptions />
    </div>
  );
}
