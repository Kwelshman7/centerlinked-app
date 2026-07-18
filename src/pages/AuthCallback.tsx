import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkBootstrapAdminCandidate } from "@/lib/bootstrap-admin";
import { isPersonalEmail } from "@/lib/email-domains";
import { toast } from "sonner";

function readOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
    hasAuthParams: params.has("code") || window.location.hash.includes("access_token"),
  };
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    const { error, errorDescription } = readOAuthParams();
    if (!error) return;

    handled.current = true;
    toast.error("Google sign-in failed", {
      description: errorDescription ?? error,
    });
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (loading || user || handled.current) return;

    const { hasAuthParams } = readOAuthParams();
    if (!hasAuthParams) return;

    const timeout = window.setTimeout(() => {
      if (handled.current || user) return;
      handled.current = true;
      toast.error("Google sign-in timed out", {
        description:
          "Try again in the same browser tab. If you're developing locally, use http://localhost:8080 (not another port).",
      });
      navigate("/login", { replace: true });
    }, 20_000);

    return () => window.clearTimeout(timeout);
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || handled.current) return;

    const { hasAuthParams } = readOAuthParams();

    if (!user) {
      if (hasAuthParams) return;
      handled.current = true;
      navigate("/login", { replace: true });
      return;
    }

    handled.current = true;

    (async () => {
      const email = user.email?.trim().toLowerCase();
      if (!email) {
        await supabase.auth.signOut();
        toast.error("Google account has no email address");
        navigate("/login", { replace: true });
        return;
      }

      const bootstrapCandidate = await checkBootstrapAdminCandidate();
      const bootstrapAdmin = isSuperAdmin || bootstrapCandidate;

      if (!bootstrapAdmin && isPersonalEmail(email)) {
        await supabase.auth.signOut();
        toast.error("Please use your work email", {
          description: "Personal Gmail accounts aren't allowed. Sign in with your organization Google Workspace account.",
        });
        navigate("/request-access", { replace: true });
        return;
      }

      if (!bootstrapAdmin) {
        const { data: eligible, error: eligErr } = await supabase.rpc("email_signup_eligible", {
          _email: email,
        });

        if (eligErr) {
          await supabase.auth.signOut();
          toast.error("Couldn't verify access", { description: eligErr.message });
          navigate("/login", { replace: true });
          return;
        }

        if (!eligible) {
          await supabase.auth.signOut();
          toast.error("This email isn't on the invite list", {
            description: "Request access and we'll review your application.",
          });
          navigate("/request-access", { replace: true });
          return;
        }
      }

      if (isSuperAdmin || bootstrapAdmin) {
        navigate("/app", { replace: true });
        return;
      }

      if (!profile?.organization_id) {
        navigate("/setup-organization", { replace: true });
        return;
      }

      navigate("/app", { replace: true });
    })();
  }, [loading, user, profile?.organization_id, isSuperAdmin, navigate]);

  return (
    <main className="min-h-screen grid place-items-center bg-hero-gradient">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in with Google…</p>
      </div>
    </main>
  );
}
