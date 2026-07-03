import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Shield, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrgDashboard } from "@/components/app/OrgDashboard";
import { SuperAdminBanner } from "@/components/app/admin/SuperAdminPanel";

interface OrgPick {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
}

export default function Dashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const [recentOrgs, setRecentOrgs] = useState<OrgPick[]>([]);

  const orgId = profile?.organization_id ?? null;

  useEffect(() => {
    if (!isSuperAdmin || orgId) return;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id,name,slug,logo_url")
        .order("name")
        .limit(8);
      setRecentOrgs((data as OrgPick[]) ?? []);
    })();
  }, [isSuperAdmin, orgId]);

  if (orgId) {
    return (
      <div className="space-y-6">
        {isSuperAdmin && <SuperAdminBanner />}
        <OrgDashboard
          organizationId={orgId}
          welcomeName={profile?.full_name || "there"}
        />
      </div>
    );
  }

  if (isSuperAdmin) {
    const lastId = sessionStorage.getItem("cl_managed_org_id");
    const lastOrg = lastId ? recentOrgs.find((o) => o.id === lastId) : null;

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-primary/70 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold">Super-admin setup mode</h1>
          <p className="text-muted-foreground mt-2">
            Pick an organization to open its dashboard, edit branding, and manage shared links before customer handoff.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <Button asChild size="lg">
              <Link to="/app/admin/organizations">
                <Building2 className="h-4 w-4" /> Manage organizations
              </Link>
            </Button>
            {lastOrg && (
              <Button asChild size="lg" variant="outline">
                <Link to={`/app/admin/organizations/${lastOrg.id}`}>
                  Continue with {lastOrg.name}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {recentOrgs.length > 0 && (
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Organizations</p>
            <ul className="divide-y divide-border/60">
              {recentOrgs.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/app/admin/organizations/${o.id}`}
                    className="flex items-center gap-3 py-3 group hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {o.logo_url ? (
                        <img src={o.logo_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium truncate flex-1 group-hover:text-primary">{o.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="font-heading text-2xl font-bold">No organization linked</h1>
      <p className="text-muted-foreground mt-2">
        Get your network on CenterLinked by creating your organization. Takes about a minute.
      </p>
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button asChild size="lg">
          <Link to="/create-organization">
            <Plus className="h-4 w-4" /> Create your organization
          </Link>
        </Button>
      </div>
    </div>
  );
}
