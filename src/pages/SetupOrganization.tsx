import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { claimPendingOrgInvite } from "@/lib/org-setup";
import { OrgClaimOptions } from "@/components/app/OrgClaimOptions";
import { consumeJoinImportPath, peekJoinImportPath } from "@/lib/join-intent";

export default function SetupOrganization() {
  const { user, profile, loading, refresh, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [checkingInvite, setCheckingInvite] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (profile?.organization_id || isSuperAdmin) {
      navigate(consumeJoinImportPath() || "/app/search", { replace: true });
      return;
    }
    try {
      sessionStorage.removeItem("cl_join_draft");
    } catch {
      /* private mode */
    }
  }, [loading, user, profile?.organization_id, isSuperAdmin, navigate]);

  useEffect(() => {
    if (loading || !user || profile?.organization_id || isSuperAdmin) return;

    let cancelled = false;
    (async () => {
      try {
        const claimed = await claimPendingOrgInvite();
        if (cancelled) return;
        if (claimed.joined) {
          await refresh();
          toast.success("You've joined your organization");
          navigate(consumeJoinImportPath() || "/app/search", { replace: true });
          return;
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Couldn't check for an organization invite");
        }
      } finally {
        if (!cancelled) setCheckingInvite(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, profile?.organization_id, isSuperAdmin, refresh, navigate]);

  if (loading || checkingInvite || !user || profile?.organization_id) {
    return (
      <main className="min-h-screen grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-8 sm:py-12 overflow-hidden bg-hero-gradient">
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl -z-10" />
      <div className="absolute bottom-0 -left-10 h-80 w-80 rounded-full bg-accent/40 blur-3xl -z-10" />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Building2 className="h-3.5 w-3.5" /> Welcome to CenterLinked
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Your free account is ready.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Claim or create your organization to manage your profile, insurance, and programs.
            {peekJoinImportPath()
              ? " Next you’ll upload a facilities PDF, review the extract, and confirm before anything is saved."
              : " Or skip for now and start searching — you can do this anytime from My profile."}
          </p>
          <Button asChild variant="hero-outline" size="lg" className="mt-5">
            <Link to="/app/search">
              Skip for now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
          <OrgClaimOptions />
        </div>
      </div>
    </main>
  );
}
