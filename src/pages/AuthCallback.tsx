import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkBootstrapAdminCandidate } from "@/lib/bootstrap-admin";
import { emailAuthGate, EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { toast } from "sonner";
import { notifyAuthEvent } from "@/lib/transactional-email";
import { consumeConnectUser, peekConnectUser, professionalPath } from "@/lib/professional-network";
import { consumeJoinImportPathForAdmin } from "@/lib/join-intent";
import { consumeFirstRunSignup, isFirstRunUser, isLikelyNewUser } from "@/lib/auth-user";
import { claimPendingOrgInvite } from "@/lib/org-setup";

function readOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
    hasAuthParams: params.has("code") || window.location.hash.includes("access_token"),
  };
}

function consumePostLoginPath() {
  try {
    const raw = sessionStorage.getItem("cl_post_login");
    sessionStorage.removeItem("cl_post_login");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
    if (raw === "/login" || raw.startsWith("/login?") || raw === "/start" || raw.startsWith("/start?")) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, profile, loading, isSuperAdmin, isFacilityAdmin, refresh } = useAuth();
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
      if (handled.current) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (handled.current) return;
        if (data.session?.user) {
          toast.error("Taking too long to finish sign-in", {
            description: "Opening Search. You can claim or create your organization anytime.",
          });
          navigate("/app/search", { replace: true });
          return;
        }
        handled.current = true;
        toast.error("Google sign-in timed out", {
          description:
            "Try again in the same browser tab. If you're developing locally, use http://localhost:8080 (not another port).",
        });
        navigate("/login", { replace: true });
      });
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

    const fallbackTimer = window.setTimeout(() => {
      toast.error("Taking too long to finish sign-in", {
        description: "Opening Search. You can claim or create your organization anytime.",
      });
      navigate("/app/search", { replace: true });
    }, 20_000);

    (async () => {
      try {
        const email = user.email?.trim().toLowerCase();
        if (!email) {
          await supabase.auth.signOut();
          toast.error("Google account has no email address");
          navigate("/login", { replace: true });
          return;
        }

        const bootstrapCandidate = await checkBootstrapAdminCandidate();
        const bootstrapAdmin = isSuperAdmin || bootstrapCandidate;
        const emailGate = bootstrapAdmin ? "allowed" : await emailAuthGate(email);

        if (emailGate === "blocked") {
          await supabase.auth.signOut();
          toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
            description:
              "Google signed in a personal address that is not approved. If CenterLinked approved a different email, create an account with that exact address and a password.",
          });
          navigate("/join", { replace: true });
          return;
        }
        if (emailGate === "unavailable") {
          toast.error(EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE.title, {
            description: EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE.description,
          });
        }

        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null;
        notifyAuthEvent(isLikelyNewUser(user.created_at) ? "signup" : "login", fullName);

        const connectId = peekConnectUser();
        const connectPath = connectId ? professionalPath(connectId) : null;
        const followConnect = () => {
          consumeConnectUser();
          return connectPath;
        };

        const canImportPdf = isFacilityAdmin || isSuperAdmin || bootstrapAdmin;
        const afterAuth = (fallback: string) => {
          if (connectPath) return followConnect();
          // Only consume the PDF intent when this user can import. Clearing it
          // for a no-org or invited BD rep burns the file before they create an org.
          if (canImportPdf) {
            const importPath = consumeJoinImportPathForAdmin(true);
            if (importPath) return importPath;
          }
          const post = consumePostLoginPath();
          if (post?.startsWith("/app/facilities/upload-pdf") && !canImportPdf) return fallback;
          return post || fallback;
        };

        if (isSuperAdmin || bootstrapAdmin) {
          navigate(afterAuth("/app"), { replace: true });
          return;
        }

        if (!profile?.organization_id) {
          try {
            const claimed = await claimPendingOrgInvite();
            if (claimed.joined) {
              await refresh();
              toast.success("You've joined your organization");
              // Stay on Search so they can add facilities and insurance.
              // Drop leftover connect/PDF so the next login does not yank them away.
              consumeConnectUser();
              navigate(
                consumeJoinImportPathForAdmin(isFacilityAdmin || isSuperAdmin || bootstrapAdmin) ||
                  "/app/search",
                { replace: true },
              );
              return;
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't join your organization", {
              description: "You can accept the invite from organization setup.",
            });
          }
          // New accounts get skippable claim/create. Do not burn a leftover
          // connect share — they can still open that person after setup.
          const firstRun = isFirstRunUser(user.created_at);
          if (firstRun) consumeFirstRunSignup();
          navigate(firstRun ? "/setup-organization" : afterAuth("/app/search"), { replace: true });
          return;
        }

        // AuthContext may have already claimed the invite. First-run still
        // belongs on Search — leftover connect/PDF paths are not for invitees.
        if (isFirstRunUser(user.created_at)) {
          consumeFirstRunSignup();
          consumeConnectUser();
          navigate(
            consumeJoinImportPathForAdmin(canImportPdf) || "/app/search",
            { replace: true },
          );
          return;
        }

        navigate(afterAuth("/app"), { replace: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't finish signing you in", {
          description: "Opening Search. You can claim or create your organization anytime.",
        });
        navigate("/app/search", { replace: true });
      } finally {
        window.clearTimeout(fallbackTimer);
      }
    })();
  }, [loading, user, profile?.organization_id, isSuperAdmin, isFacilityAdmin, navigate, refresh]);

  return (
    <main className="min-h-screen grid place-items-center bg-hero-gradient">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </main>
  );
}
