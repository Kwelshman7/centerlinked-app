import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Settings,
  Upload,
  LogOut,
  Search as SearchIcon,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { adminLinks } from "@/components/app/admin/SuperAdminPanel";

type NavItem = { to: string; label: string; icon: typeof SearchIcon; end?: boolean };

export function AppLayout() {
  const { profile, isSuperAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const primary: NavItem[] = [
    { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/app/search", label: "Search", icon: SearchIcon },
    { to: "/app/organizations", label: "Organizations", icon: Building2 },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ];

  const secondaryOrg: NavItem[] = [
    { to: "/app/members", label: "Members", icon: Users },
    { to: "/app/facilities/import", label: "Import", icon: Upload },
  ];

  const secondaryAdmin: NavItem[] = adminLinks.map(({ to, label, icon, end }) => ({
    to,
    label,
    icon,
    end,
  }));

  const isMessengerThread =
    location.pathname.startsWith("/app/messages") && new URLSearchParams(location.search).get("c");

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center rounded-lg text-sm font-medium transition-colors",
      collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  const NavRow = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const link = (
      <NavLink to={item.to} end={item.end} className={navLinkClass}>
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
    if (!collapsed) return link;
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const SidebarContent = () => (
    <TooltipProvider>
      <div className={cn("flex items-center border-b border-border/50", collapsed ? "px-2 py-4 justify-center" : "px-5 py-5 justify-between gap-2")}>
        {!collapsed && <Logo to="/app" size="md" />}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-1" : "px-3")}>
        {primary.map((item) => <NavRow key={item.to} item={item} />)}

        {profile?.organization_id && secondaryOrg.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                Manage
              </div>
            )}
            {collapsed && <div className="my-2 mx-2 border-t border-border/50" />}
            {secondaryOrg.map((item) => <NavRow key={item.to} item={item} />)}
          </>
        )}

        {isSuperAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                Admin
              </div>
            )}
            {collapsed && <div className="my-2 mx-2 border-t border-border/50" />}
            {secondaryAdmin.map((item) => <NavRow key={item.to} item={item} />)}
          </>
        )}
      </nav>
      <div className={cn("border-t border-border/50 space-y-3 pb-safe", collapsed ? "px-1 py-3" : "px-3 py-4")}>
        {!collapsed && (
          <div className="px-3 text-xs">
            <p className="font-medium text-foreground truncate">{profile?.full_name || user?.email}</p>
            <p className="text-muted-foreground truncate">{user?.email}</p>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                <Shield className="h-3 w-3" /> Super Admin
              </span>
            )}
          </div>
        )}
        {collapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="mx-auto flex h-9 w-9" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        )}
      </div>
    </TooltipProvider>
  );

  const sidebarWidth = collapsed ? "lg:w-16" : "lg:w-64";
  const mainPad = collapsed ? "lg:pl-16" : "lg:pl-64";

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <aside className={cn("hidden lg:flex fixed inset-y-0 left-0 flex-col bg-card border-r border-border/50 z-30 transition-[width] duration-200", sidebarWidth)}>
        <SidebarContent />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-card/85 backdrop-blur-xl border-b border-border/60 pt-safe">
        <div className="flex items-center justify-between px-4 h-12 relative">
          {isSuperAdmin ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Shield className="h-4 w-4 text-primary" /> Super admin
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-1">
                  {adminLinks.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="w-9 shrink-0" />
          )}
          <Logo to="/app" size="sm" />
          <div className="w-9 shrink-0" />
        </div>
      </header>

      <main className={cn("transition-[padding] duration-200", mainPad)}>
        <div
          className={cn(
            "w-full px-4 sm:px-6 lg:px-8 py-5 lg:py-8",
            !isMessengerThread && "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-10"
          )}
        >
          <Outlet />
        </div>
      </main>

      {!isMessengerThread && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/60" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="grid grid-cols-4 h-16">
            {primary.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) =>
                  cn(
                    "h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:bg-accent/60",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} />
                  <span className="leading-none">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
