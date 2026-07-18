import { Link, NavLink } from "react-router-dom";
import { Building2, Inbox, Shield, ShieldCheck, CheckSquare, Database, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/app/admin/organizations", label: "Manage organizations", icon: Building2, end: true },
  { to: "/app/admin/organizations/new", label: "Add organization", icon: Plus },
  { to: "/app/admin/join-requests", label: "Join requests", icon: UserPlus },
  { to: "/app/admin/requests", label: "Access requests", icon: Inbox },
  { to: "/app/admin/claims", label: "Org claims", icon: ShieldCheck },
  { to: "/app/verifications", label: "Verifications", icon: CheckSquare },
  { to: "/app/admin/insurance", label: "Insurance DB", icon: Database },
] as const;

export function SuperAdminBanner() {
  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">Super admin</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open any organization to edit branding, facilities, and shared links.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0 w-full sm:w-auto">
          <Link to="/app/admin/organizations">
            <Building2 className="h-4 w-4" /> Manage organizations
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function SuperAdminSettingsCard() {
  return (
    <Card className="p-5 sm:p-6 space-y-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Super admin</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Edit any organization in the platform — profile, branding, facilities, and shared links.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {adminLinks.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/40 text-primary bg-primary/5"
                    : "hover:border-primary/40 hover:text-primary",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export { adminLinks };
