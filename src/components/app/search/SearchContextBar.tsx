import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { searchSessionForOrg } from "@/lib/search-session";
import { cn } from "@/lib/utils";

interface Props {
  currentOrgSlug: string | null | undefined;
}

/**
 * Signed-in users who opened this public sheet from app search keep a way
 * back to those results and can switch to other orgs from the same query.
 * Anonymous public visitors never see this.
 */
export function SearchContextBar({ currentOrgSlug }: Props) {
  const { user, loading } = useAuth();
  const session = useMemo(
    () => (loading || !user ? null : searchSessionForOrg(currentOrgSlug)),
    [loading, user, currentOrgSlug],
  );

  if (!session) return null;

  const others = session.orgs.filter((o) => o.slug !== currentOrgSlug);

  return (
    <div className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          to={session.returnTo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to search
        </Link>

        <p className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <SearchIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{session.summary}</span>
        </p>

        {others.length > 0 ? (
          <nav
            aria-label="Other organizations in this search"
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
          >
            <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground md:inline">
              Also in this search
            </span>
            {others.map((org) => (
              <Link
                key={org.slug}
                to={`/o/${org.slug}`}
                className={cn(
                  "inline-flex max-w-[12rem] shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground",
                  "hover:border-primary/40 hover:bg-accent",
                )}
              >
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="h-4 w-4 rounded-sm object-contain" />
                ) : null}
                <span className="truncate">{org.name}</span>
              </Link>
            ))}
          </nav>
        ) : (
          <span className="min-w-0 flex-1" />
        )}
      </div>
    </div>
  );
}
