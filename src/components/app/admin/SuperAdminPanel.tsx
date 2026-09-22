import { NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, Shield, CheckSquare, Database, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/app/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/admin/organizations", label: "Organizations", icon: Building2, end: true },
  { to: "/app/verifications", label: "Verifications", icon: CheckSquare },
  { to: "/app/admin/insurance", label: "Insurance", icon: Database },
  { to: "/app/admin/data-quality", label: "Data quality", icon: Gauge },
] as const;

export function SuperAdminSettingsCard() {
  return (
    <Card className="p-5 sm:p-6 space-y-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Super admin</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Review signups and pending work, then open any organization to edit profile, branding, facilities, and shared links.
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
