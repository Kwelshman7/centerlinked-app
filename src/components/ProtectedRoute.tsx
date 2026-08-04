import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SuperAdminAccessDenied } from "@/components/app/admin/SuperAdminSetupAlert";
import { OrgArchivedBlocked } from "@/components/app/OrgAccountStatusBanner";
import { Loader2 } from "lucide-react";

const ORG_OPTIONAL_PATHS = new Set([
  "/setup-organization",
  "/create-organization",
  "/app/onboarding",
]);

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, isSuperAdmin, isOrgArchived } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const onOrgOptionalPath = ORG_OPTIONAL_PATHS.has(location.pathname);
  if (!isSuperAdmin && !profile?.organization_id && !onOrgOptionalPath) {
    return <Navigate to="/setup-organization" replace />;
  }

  if (isOrgArchived && !onOrgOptionalPath) {
    return <OrgArchivedBlocked />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isSuperAdmin) {
    return <SuperAdminAccessDenied />;
  }

  return <>{children}</>;
}
