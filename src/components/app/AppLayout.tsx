import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  Shield,
  Settings,
  LogOut,
  Search as SearchIcon,
  PanelLeftClose,
  PanelLeft,
  Menu,
  UserRound,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { adminLinks } from "@/components/app/admin/SuperAdminPanel";
import { initialsFromName, professionalPath, asProfessionalCards } from "@/lib/professional-network";
import { supabase } from "@/integrations/supabase/client";

type NavItem = {
  to: string;
  label: string;
  icon: typeof SearchIcon;
  end?: boolean;
  orgView?: "all" | "network";
};

function pathOf(to: string) {
  return to.split("?")[0];
}

function navItemActive(item: NavItem, pathname: string, search: string) {
  const path = pathOf(item.to);
  if (item.orgView) {
    if (pathname !== "/app/organizations") return false;
    const view = new URLSearchParams(search).get("view");
    if (item.orgView === "all") return view === "all";
    return view !== "all";
  }
  if (item.end) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function AppHeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<{ id: string; name: string; detail: string | null }[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string; slug: string | null }[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string; city: string | null; state: string | null }[]>([]);

  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) {
      setPeople([]);
      setOrgs([]);
      setFacilities([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const [peopleRes, orgRes, facRes] = await Promise.all([
        supabase.rpc("search_professionals", { _query: needle }),
        supabase.from("organizations").select("id,name,slug").ilike("name", `%${needle}%`).order("name").limit(5),
        supabase
          .from("facilities")
          .select("id,name,city,state")
          .eq("verification_status", "approved")
          .eq("verification_frozen", false)
          .ilike("name", `%${needle}%`)
          .order("name")
          .limit(5),
      ]);
      if (cancelled) return;
      setPeople(
        asProfessionalCards(peopleRes.data)
          .slice(0, 5)
          .map((person) => ({
            id: person.user_id,
            name: person.full_name || "CenterLinked professional",
            detail: person.organization?.name || person.job_title || null,
          })),
      );
      setOrgs((orgRes.data as { id: string; name: string; slug: string | null }[] | null) ?? []);
      setFacilities(
        (facRes.data as { id: string; name: string; city: string | null; state: string | null }[] | null) ?? [],
      );
      setLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [q]);

  const hasResults = people.length + orgs.length + facilities.length > 0;
  const showPanel = open && (q.trim().length >= 2 || q.trim().length === 0);

  const go = (to: string) => {
    setOpen(false);
    setQ("");
    navigate(to);
  };

  return (
    <div className="relative min-w-0 w-full">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        type="search"
        autoComplete="off"
        placeholder="Search contacts, facilities, or organizations..."
        className="h-8 pl-9 bg-muted/50 border-border/70"
        aria-label="Search contacts, facilities, or organizations"
      />
      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg">
          {q.trim().length < 2 ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go("/app/search")}
            >
              <SearchIcon className="h-4 w-4 text-primary" />
              Find in-network care
            </button>
          ) : loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : hasResults ? (
            <div className="max-h-80 overflow-y-auto py-1 text-sm">
              {people.length > 0 ? (
                <div className="px-2 py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contacts
                  </p>
                  {people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(`/app/people/${person.id}`)}
                    >
                      <span className="font-medium">{person.name}</span>
                      {person.detail ? <span className="text-xs text-muted-foreground">{person.detail}</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
              {orgs.length > 0 ? (
                <div className="px-2 py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Organizations
                  </p>
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      className="flex w-full items-center rounded-lg px-2 py-1.5 text-left hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(org.slug ? `/o/${org.slug}` : "/app/organizations?view=all")}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              ) : null}
              {facilities.length > 0 ? (
                <div className="px-2 py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Facilities
                  </p>
                  {facilities.map((facility) => (
                    <button
                      key={facility.id}
                      type="button"
                      className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(`/app/facilities/${facility.id}`)}
                    >
                      <span className="font-medium">{facility.name}</span>
                      {facility.city || facility.state ? (
                        <span className="text-xs text-muted-foreground">
                          {[facility.city, facility.state].filter(Boolean).join(", ")}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matches. Try in-network search.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppLayout() {
  const { profile, isSuperAdmin, needsSuperAdminSetup, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hasOrgAccess = isSuperAdmin || !!profile?.organization_id;
  const homeTo = hasOrgAccess ? "/app/contacts" : "/app/search";

  const primary: NavItem[] = useMemo(() => {
    if (!hasOrgAccess) {
      const items: NavItem[] = [{ to: "/app/search", label: "Search", icon: SearchIcon }];
      items.push({ to: "/app/dashboard", label: "My profile", icon: UserRound, end: true });
      if (user && !needsSuperAdminSetup) {
        items.push({ to: "/app/contacts", label: "Contacts", icon: Users });
      }
      return items;
    }
    const items: NavItem[] = [
      { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/app/organizations?view=all", label: "Organizations", icon: Building2, orgView: "all" },
      { to: "/app/facilities", label: "Facilities", icon: Building },
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ];
    return items;
  }, [hasOrgAccess, user, needsSuperAdminSetup]);

  const mobilePrimary: NavItem[] = useMemo(() => {
    if (!hasOrgAccess) {
      const items: NavItem[] = [{ to: "/app/search", label: "Search", icon: SearchIcon }];
      if (user && !needsSuperAdminSetup) items.push({ to: "/app/contacts", label: "Contacts", icon: Users });
      items.push({ to: "/app/dashboard", label: "Profile", icon: UserRound, end: true });
      return items;
    }
    return [
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/search", label: "Search", icon: SearchIcon },
      { to: "/app/organizations?view=all", label: "Orgs", icon: Building2, orgView: "all" },
      { to: "/app/dashboard", label: "Home", icon: LayoutDashboard, end: true },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ];
  }, [hasOrgAccess, user, needsSuperAdminSetup]);

  const secondaryAdmin: NavItem[] = adminLinks.map(({ to, label, icon, end }) => ({
    to,
    label,
    icon,
    end,
  }));

  const hideMobileTabBar =
    location.pathname === "/app/onboarding" || location.pathname === "/app/facilities/upload-pdf";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const NavRow = ({
    item,
    onNavigate,
    forceExpanded,
  }: {
    item: NavItem;
    onNavigate?: () => void;
    forceExpanded?: boolean;
  }) => {
    const Icon = item.icon;
    const active = navItemActive(item, location.pathname, location.search);
    const iconOnly = collapsed && !forceExpanded;
    const link = (
      <Link
        to={item.to}
        onClick={onNavigate}
        className={cn(
          "flex items-center rounded-lg text-sm font-medium transition-colors",
          iconOnly ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
          active
            ? "bg-primary text-primary-foreground"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!iconOnly && <span className="truncate">{item.label}</span>}
      </Link>
    );
    if (!iconOnly) return link;
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const SidebarContent = () => (
    <TooltipProvider>
      <div className={cn("flex items-center border-b border-white/10", collapsed ? "px-2 py-4 justify-center" : "px-5 py-5 justify-between gap-2")}>
        {!collapsed && <Logo to={homeTo} size="md" className="brightness-0 invert" />}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-1" : "px-3")}>
        {primary.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}

        {isSuperAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider font-semibold text-white/45">
                Admin
              </div>
            )}
            {collapsed && <div className="my-2 mx-2 border-t border-white/10" />}
            {secondaryAdmin.map((item) => (
              <NavRow key={item.to} item={item} />
            ))}
          </>
        )}
      </nav>
      <div className={cn("border-t border-white/10 space-y-3 pb-safe", collapsed ? "px-1 py-3" : "px-3 py-4")}>
        {!collapsed && (
          <div className="px-3 text-xs">
            {user ? (
              <Link to={professionalPath(user.id)} className="block group">
                <p className="font-medium text-white truncate group-hover:text-primary-foreground">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-white/55 truncate">{user.email}</p>
              </Link>
            ) : (
              <p className="font-medium text-white truncate">{profile?.full_name}</p>
            )}
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                <Shield className="h-3 w-3" /> Super Admin
              </span>
            )}
            {needsSuperAdminSetup && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-100 text-[10px] font-semibold">
                Setup required
              </span>
            )}
          </div>
        )}
        {collapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mx-auto flex h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-white/80 hover:bg-white/10 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        )}
      </div>
    </TooltipProvider>
  );

  const sidebarWidth = collapsed ? "lg:w-16" : "lg:w-64";
  const mainPad = collapsed ? "lg:pl-16" : "lg:pl-64";
  const initials = initialsFromName(profile?.full_name || user?.email || "CL");

  return (
    <div className="min-h-dvh max-w-[100vw] overflow-x-clip bg-muted/30">
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 flex-col z-30 transition-[width] duration-200 text-white",
          sidebarWidth,
        )}
        style={{ backgroundColor: "#003048" }}
      >
        <SidebarContent />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-card/85 backdrop-blur-xl border-b border-border/60 pt-safe">
        <div className="flex items-center justify-between px-4 h-12 relative">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0 text-white" style={{ backgroundColor: "#003048" }}>
              <SheetHeader className="px-5 py-4 border-b border-white/10">
                <SheetTitle className="text-left">
                  <Logo to={homeTo} size="sm" className="brightness-0 invert" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-4 space-y-1 px-3">
                {primary.map((item) => (
                  <NavRow key={item.to} item={item} forceExpanded onNavigate={() => setMobileNavOpen(false)} />
                ))}
                {isSuperAdmin ? (
                  <>
                    <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider font-semibold text-white/45">
                      Admin
                    </div>
                    {secondaryAdmin.map((item) => (
                      <NavRow key={`m-${item.to}`} item={item} forceExpanded onNavigate={() => setMobileNavOpen(false)} />
                    ))}
                  </>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
          <Logo to={homeTo} size="sm" />
          <Link
            to="/app/search"
            className="h-9 w-9 shrink-0 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Find in-network care"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className={cn("min-w-0 max-w-full overflow-x-clip transition-[padding] duration-200", mainPad)}>
        <header className="hidden lg:flex sticky top-0 z-20 h-12 items-center gap-3 border-b border-border/60 bg-card/90 px-4 backdrop-blur-xl">
          {location.pathname.startsWith("/app/search") ? (
            <p className="min-w-0 flex-1 truncate text-sm font-medium">In-network search</p>
          ) : (
            <div className="min-w-0 flex-1">
              <AppHeaderSearch />
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {!location.pathname.startsWith("/app/search") ? (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link to="/app/search">
                  <SearchIcon className="h-4 w-4" />
                  Find in-network care
                </Link>
              </Button>
            ) : null}
            {user ? (
              <Link
                to={professionalPath(user.id)}
                className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold"
                aria-label="My profile"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </Link>
            ) : null}
          </div>
        </header>

        <main className="min-w-0 max-w-full">
          <div
            className={cn(
              "w-full min-w-0 max-w-full px-4 sm:px-6 lg:px-8 py-3 lg:py-4",
              !hideMobileTabBar && "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {!hideMobileTabBar && (
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/60"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul
            className={cn(
              "grid h-16",
              mobilePrimary.length >= 5 ? "grid-cols-5" : mobilePrimary.length === 4 ? "grid-cols-4" : "grid-cols-3",
            )}
          >
            {mobilePrimary.map((item) => {
              const Icon = item.icon;
              const active = navItemActive(item, location.pathname, location.search);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "h-full min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors active:bg-accent/60",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={2.2} />
                    <span className="max-w-full truncate leading-none">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
