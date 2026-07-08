import { Link } from "react-router-dom";
import { Building2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { orgPublicPath } from "@/lib/public-urls";

interface Props {
  org: {
    name: string;
    slug: string | null;
    logo_url: string | null;
  };
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

export function OrgAppHeader({ org, brand }: Props) {
  const { user, profile } = useAuth();
  const orgHref = org.slug ? orgPublicPath(org.slug) : "#top";

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/60 print:hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          <Link to={orgHref} className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 max-w-[55%] sm:max-w-none">
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0 p-0.5"
              style={{ borderColor: `${brand}35` }}
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={`${org.name} logo`} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <span className="font-heading font-bold text-sm sm:text-base truncate">
              {org.name}
            </span>
          </Link>

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
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full grid place-items-center text-xs font-bold shrink-0 border"
                  style={{ backgroundColor: `${brand}14`, color: brand, borderColor: `${brand}30` }}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials(profile.full_name || user.email || "?")
                  )}
                </div>
                <div className="min-w-0 hidden sm:block text-left max-w-[10rem] lg:max-w-none">
                  <p className="text-sm font-semibold truncate leading-tight">
                    {profile.full_name || user.email}
                  </p>
                  {profile.job_title && (
                    <p className="text-[11px] text-muted-foreground truncate">{profile.job_title}</p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
              </div>
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
