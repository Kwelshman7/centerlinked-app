import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SuperAdminAccessDenied } from "@/components/app/admin/SuperAdminSetupAlert";
import { Loader2 } from "lucide-react";

/**
 * Signed-in users without an organization (free accounts) may use these paths.
 * Search reads are still limited by RLS to approved facilities; /app/dashboard renders My profile.
 * /app/network redirects to Contacts; keep it optional so the redirect is not intercepted.
 */
const ORG_OPTIONAL_PATHS = new Set([
  "/setup-organization",
  "/create-organization",
  "/app",
  "/app/onboarding",
  "/app/search",
  "/app/search/results",
  "/app/dashboard",
  "/app/network",
  "/app/contacts",
  "/app/organizations",
]);

function isFacilityReadPath(pathname: string) {
  const match = pathname.match(/^\/app\/facilities\/([^/]+)$/);
  if (!match) return false;
  return match[1] !== "new" && match[1] !== "upload-pdf";
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, isSuperAdmin } = useAuth();
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

  const onOrgOptionalPath =
    ORG_OPTIONAL_PATHS.has(location.pathname) ||
    location.pathname.startsWith("/app/people/") ||
    location.pathname.startsWith("/app/contacts/") ||
    isFacilityReadPath(location.pathname);
  if (!isSuperAdmin && !profile?.organization_id && !onOrgOptionalPath) {
    return <Navigate to="/setup-organization" replace />;
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
