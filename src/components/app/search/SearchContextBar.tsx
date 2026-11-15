import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, Search as SearchIcon, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { searchSessionForOrg, type SearchSession } from "@/lib/search-session";
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
  const [open, setOpen] = useState(false);
  const session = useMemo(
    () => (loading || !user ? null : searchSessionForOrg(currentOrgSlug)),
    [loading, user, currentOrgSlug],
  );

  if (!session) return null;

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border/70 bg-background print:hidden lg:flex">
        <SearchMenu session={session} currentOrgSlug={currentOrgSlug} />
      </aside>

      <div className="shrink-0 border-b border-border/70 bg-background print:hidden lg:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" aria-hidden />
          Also in this search
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 print:hidden lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close search menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-xl">
            <div className="flex justify-end border-b border-border/70 px-2 py-1.5">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SearchMenu session={session} currentOrgSlug={currentOrgSlug} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SearchMenu({
  session,
  currentOrgSlug,
  onNavigate,
}: {
  session: SearchSession;
  currentOrgSlug: string | null | undefined;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-border/70 p-3">
        <Link
          to={session.returnTo}
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to search
        </Link>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <SearchIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{session.summary}</span>
        </p>
      </div>
      <nav aria-label="Other organizations in this search" className="min-h-0 flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-muted-foreground">Also in this search</p>
        <ul className="space-y-0.5">
          {session.orgs.map((org) => {
            const current = org.slug === currentOrgSlug;
            return (
              <li key={org.slug}>
                <Link
                  to={`/o/${org.slug}`}
                  aria-current={current ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                    current
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" />
                  ) : (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-muted text-[9px] font-semibold text-muted-foreground">
                      {org.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="truncate">{org.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
