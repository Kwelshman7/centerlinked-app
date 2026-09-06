import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { SuperAdminSetupAlert } from "@/components/app/admin/SuperAdminSetupAlert";
import { AdminOverview } from "@/pages/app/admin/AdminOverview";

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
    <div className="max-w-2xl mx-auto text-center py-16">
      {needsSuperAdminSetup && (
        <div className="text-left mb-8">
          <SuperAdminSetupAlert />
        </div>
      )}
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="font-heading text-2xl font-bold">No organization linked</h1>
      <p className="text-muted-foreground mt-2">
        Join your company&apos;s organization if it already exists, or create a new one.
      </p>
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button asChild size="lg">
          <Link to="/setup-organization">
            <Plus className="h-4 w-4" /> Join or create organization
          </Link>
        </Button>
      </div>
    </div>
  );
}
