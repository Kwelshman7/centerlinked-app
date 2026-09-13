import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Clock,
  Loader2,
  Plus,
  Search as SearchIcon,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { ClaimOrganizationDialog } from "@/components/ClaimOrganizationDialog";
import {
  getOrgSetupOptions,
  requestToJoinOrganization,
  type OrgSetupOptions,
} from "@/lib/org-setup";

type OrgHit = {
  id: string;
  name: string;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
};

type PendingClaim = {
  id: string;
  organization_id: string;
  organizations: { name: string } | null;
};

const cardClass =
  "rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-sm p-5 sm:p-6";

/** Escape LIKE wildcards so a typed "%" or "_" matches literally. */
function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Claim a listed organization, request to join a work-email domain match, or create a new one.
 * Shared by post-signup setup and the My profile page for users without an organization.
 */
export function OrgClaimOptions() {
  const { user } = useAuth();
  const [options, setOptions] = useState<OrgSetupOptions | null>(null);
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<OrgHit[]>([]);
  const [searching, setSearching] = useState(false);

  const loadClaims = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("organization_claims")
      .select("id, organization_id, organizations(name)")
      .eq("claimant_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setClaims((data as unknown as PendingClaim[]) ?? []);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [next] = await Promise.all([getOrgSetupOptions(), loadClaims()]);
        if (!cancelled) setOptions(next);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Couldn't load organization options");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadClaims]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url, hq_city, hq_state")
        .ilike("name", likePattern(term))
        .order("name")
        .limit(8);
      if (cancelled) return;
      if (error) toast.error(error.message);
      setHits((data as OrgHit[]) ?? []);
      setSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const handleJoin = async () => {
    const match = options?.matching_org;
    if (!match) return;
    setRequesting(true);
    try {
      await requestToJoinOrganization(match.id);
      setOptions(await getOrgSetupOptions());
      toast.success("Join request submitted", {
        description: match.has_admin
          ? "An organization admin will review your request."
          : "A CenterLinked superadmin will review your request.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit join request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingJoin = options?.pending_join_request;
  const matching = options?.matching_org;
  const domain = options?.email_domain || "your company";
  const claimedIds = new Set(claims.map((c) => c.organization_id));
  const term = query.trim();

  return (
    <div className="grid gap-4">
      {pendingJoin || claims.length > 0 ? (
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-base font-bold">Waiting for approval</h2>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {pendingJoin ? (
              <li>
                Request to join{" "}
                <span className="font-semibold text-foreground">
                  {pendingJoin.organization_name || matching?.name || "the organization"}
                </span>
              </li>
            ) : null}
            {claims.map((c) => (
              <li key={c.id}>
                Claim for{" "}
                <span className="font-semibold text-foreground">
                  {c.organizations?.name || "an organization"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Once approved, you can manage your organization profile from here. Search stays available in the meantime.
          </p>
        </div>
      ) : null}

      {matching && !pendingJoin ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={requesting}
          className={`${cardClass} text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60`}
        >
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md shrink-0 overflow-hidden">
              {matching.logo_url ? (
                <img src={matching.logo_url} alt="" className="h-full w-full object-contain bg-white p-1" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-bold">Join {matching.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Domain match for @{domain}.{" "}
                {matching.has_admin
                  ? "An organization admin must approve your request."
                  : "No org admin yet — a CenterLinked superadmin must approve."}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                {requesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Request to join <UserPlus className="h-4 w-4" />
                  </>
                )}
              </div>
            </div>
          </div>
        </button>
      ) : null}

      <div className={cardClass}>
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold">Claim your organization</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Already listed on CenterLinked? Find it and submit a free claim. Once approved, you can update
              insurance, programs, and photos.
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organization name"
            aria-label="Search organization name"
            className="h-11 pl-9 text-base sm:text-sm"
          />
        </div>

        {term.length >= 2 ? (
          <div className="mt-3">
            {searching ? (
              <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </p>
            ) : hits.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">
                No organizations match &ldquo;{term}&rdquo;. You can create it below.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                {hits.map((o) => {
                  const place = [o.hq_city, o.hq_state].filter(Boolean).join(", ");
                  return (
                    <li key={o.id} className="flex items-center gap-3 p-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
                        {o.logo_url ? (
                          <img src={o.logo_url} alt="" className="max-h-full max-w-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{o.name}</p>
                        {place ? <p className="truncate text-xs text-muted-foreground">{place}</p> : null}
                      </div>
                      {claimedIds.has(o.id) ? (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">Claim pending</span>
                      ) : (
                        <ClaimOrganizationDialog
                          organizationId={o.id}
                          organizationName={o.name}
                          triggerLabel="Claim"
                          onSubmitted={loadClaims}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {options?.can_create ? (
        <Link
          to="/create-organization"
          className={`${cardClass} block transition-colors hover:border-primary/40`}
        >
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-base font-bold">Create a new organization</p>
              <p className="text-sm text-muted-foreground mt-1">
                Not listed yet? Create it for free. You&apos;ll become the admin for @{domain}, and teammates with the
                same work email domain can request to join after.
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-5 flex items-start gap-3">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            An organization already exists for @{domain}. Join or claim it instead of creating a duplicate.
          </p>
        </div>
      )}
    </div>
  );
}
