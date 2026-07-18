import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Clock,
  Loader2,
  Plus,
  Shield,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  claimPendingOrgInvite,
  getOrgSetupOptions,
  requestToJoinOrganization,
  type OrgSetupOptions,
} from "@/lib/org-setup";

export default function SetupOrganization() {
  const { user, profile, loading, refresh, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [options, setOptions] = useState<OrgSetupOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (profile?.organization_id || isSuperAdmin) {
      navigate("/app", { replace: true });
    }
  }, [loading, user, profile?.organization_id, isSuperAdmin, navigate]);

  useEffect(() => {
    if (loading || !user || profile?.organization_id || isSuperAdmin) return;

    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const claimed = await claimPendingOrgInvite();
        if (cancelled) return;
        if (claimed.joined) {
          await refresh();
          toast.success("You've joined your organization");
          navigate("/app", { replace: true });
          return;
        }
        const next = await getOrgSetupOptions();
        if (!cancelled) setOptions(next);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Couldn't load organization options");
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, profile?.organization_id, isSuperAdmin, refresh, navigate]);

  const handleJoin = async () => {
    if (!options?.matching_org) return;
    setRequesting(true);
    try {
      await requestToJoinOrganization(options.matching_org.id);
      const next = await getOrgSetupOptions();
      setOptions(next);
      toast.success("Join request submitted", {
        description: options.matching_org.has_admin
          ? "An organization admin will review your request."
          : "A CenterLinked superadmin will review your request.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit join request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading || loadingOptions || !user || profile?.organization_id) {
    return (
      <main className="min-h-screen grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  const pending = options?.pending_join_request;
  const matching = options?.matching_org;
  const domain = options?.email_domain || "your company";

  return (
    <main className="relative min-h-screen px-4 py-8 sm:py-12 overflow-hidden bg-hero-gradient">
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl -z-10" />
      <div className="absolute bottom-0 -left-10 h-80 w-80 rounded-full bg-accent/40 blur-3xl -z-10" />

      <div className="max-w-2xl mx-auto">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Building2 className="h-3.5 w-3.5" /> Welcome to CenterLinked
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Join or create an organization
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Your work email is on <span className="font-semibold text-foreground">@{domain}</span>.
            Join your company&apos;s organization, or create one if it doesn&apos;t exist yet.
          </p>
        </div>

        {pending ? (
          <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-6 sm:p-8 space-y-4 animate-fade-up text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-xl font-bold">Waiting for approval</h2>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <span className="font-semibold text-foreground">
                {pending.organization_name || matching?.name || "the organization"}
              </span>{" "}
              is pending.{" "}
              {matching && !matching.has_admin
                ? "A CenterLinked superadmin will review it."
                : "An organization admin will review it."}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check status
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 animate-fade-up">
            {matching ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={requesting}
                className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-6 sm:p-8 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md shrink-0 overflow-hidden">
                    {matching.logo_url ? (
                      <img src={matching.logo_url} alt="" className="h-full w-full object-contain bg-white p-1" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-lg font-bold">Join {matching.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Domain match for @{domain}.{" "}
                      {matching.has_admin
                        ? "An organization admin must approve your request."
                        : "No org admin yet — a CenterLinked superadmin must approve."}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
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
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-5 text-sm text-muted-foreground">
                No organization is registered for @{domain} yet. Create one below to get started.
              </div>
            )}

            {options?.can_create ? (
              <Link
                to="/create-organization"
                className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-6 sm:p-8 transition-colors hover:border-primary/40 block"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">Create a new organization</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You&apos;ll become the admin for @{domain}. Teammates with the same work email domain can request to join after.
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-5 flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  An organization already exists for @{domain}. Join the existing one instead of creating a duplicate.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
