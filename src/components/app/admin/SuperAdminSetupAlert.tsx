import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SuperAdminSetupAlert() {
  const { user, needsSuperAdminSetup, refresh } = useAuth();
  if (!needsSuperAdminSetup) return null;

  return (
    <Card className="p-4 border-amber-500/40 bg-amber-500/10">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2 min-w-0">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" /> Super admin access not active yet
          </p>
          <p className="text-sm text-muted-foreground">
            You signed in as <strong className="text-foreground">{user?.email}</strong>, but your account does not
            have the <code className="text-xs">super_admin</code> role yet. Run{" "}
            <code className="text-xs">supabase/bootstrap-super-admin.sql</code> in the Supabase SQL editor with your
            email, then refresh.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4" /> Retry setup
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a
                href="https://supabase.com/dashboard/project/_/sql/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase SQL editor
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SuperAdminAccessDenied() {
  const { needsSuperAdminSetup, refresh } = useAuth();

  if (needsSuperAdminSetup) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <SuperAdminSetupAlert />
        <p className="text-center text-sm text-muted-foreground">
          After running the SQL script,{" "}
          <button type="button" className="text-primary underline" onClick={() => refresh()}>
            click here to refresh
          </button>{" "}
          and try{" "}
          <Link to="/app/admin/organizations" className="text-primary underline">
            Manage organizations
          </Link>{" "}
          again.
        </p>
      </div>
    );
  }

  return (
    <Card className="max-w-xl mx-auto p-8 text-center">
      <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
      <p className="mt-2 font-medium">Super admin access only</p>
      <p className="text-sm text-muted-foreground mt-1">
        This page is for platform administrators. Contact your CenterLinked admin if you need access.
      </p>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/app/dashboard">Back to home</Link>
      </Button>
    </Card>
  );
}
