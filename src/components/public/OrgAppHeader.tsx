import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  brand: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const NAV_LINKS = [
  { label: "Dashboard", to: "/app/dashboard" },
  { label: "Network", to: "/app/organizations" },
] as const;

export function OrgAppHeader({ brand }: Props) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || user?.email || "Account";
  const avatarSrc = profile?.avatar_url || null;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/60 print:hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          <Logo to="/" size="md" className="shrink-0" />

          {user ? (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="flex items-center gap-2 shrink-0">
            {user && profile ? (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 sm:gap-2.5 min-w-0 rounded-full sm:rounded-lg px-0.5 sm:px-1.5 py-0.5 hover:bg-muted/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <div
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden grid place-items-center text-xs font-bold shrink-0 border"
                      style={{
                        backgroundColor: `${brand}14`,
                        color: brand,
                        borderColor: `${brand}30`,
                      }}
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(displayName)
                      )}
                    </div>
                    <div className="min-w-0 hidden sm:block text-left max-w-[10rem] lg:max-w-none">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {displayName}
                      </p>
                      {profile.job_title && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {profile.job_title}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1.5" sideOffset={8}>
                  <div className="px-2.5 py-2 border-b border-border/60 mb-1 sm:hidden">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    {profile.job_title && (
                      <p className="text-xs text-muted-foreground truncate">{profile.job_title}</p>
                    )}
                  </div>
                  <Link
                    to="/app/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    Return to my organization
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
                    Log out
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                to="/login"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium whitespace-nowrap"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {user ? (
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2.5 -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full border border-border/60 bg-background transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
