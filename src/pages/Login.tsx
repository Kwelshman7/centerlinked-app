import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { applySocialMeta } from "@/lib/social-meta";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { notifyAuthEvent } from "@/lib/transactional-email";
import { emailAuthGate, EMAIL_AUTH_UNAVAILABLE_MESSAGE, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { consumeJoinImportPathForAdmin, hasJoinImportIntent } from "@/lib/join-intent";
import { consumeFirstRunSignup, isFirstRunUser, setFirstRunSignup } from "@/lib/auth-user";
import { claimPendingOrgInvite } from "@/lib/org-setup";

/** sessionStorage key shared with AuthCallback for PWA / Google sign-in. */
const POST_LOGIN_PATH_KEY = "cl_post_login";
const APP_LOGIN_NEXT = "/app/search";

function safeInternalPath(from: string | undefined) {
  if (!from) return undefined;
  if (!from.startsWith("/")) return undefined;
  if (from.startsWith("//") || from.includes("\\")) return undefined;
  if (from === "/login" || from.startsWith("/login?")) return undefined;
  if (from === "/start" || from.startsWith("/start?")) return undefined;
  return from;
}

function applyAppLoginHead() {
  const ensureLink = (rel: string, href: string) => {
    let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  };
  const ensureMeta = (name: string, content: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  };

  ensureLink("manifest", "/manifest.webmanifest");
  ensureLink("apple-touch-icon", "/favicon.png");
  ensureMeta("apple-mobile-web-app-capable", "yes");
  ensureMeta("apple-mobile-web-app-title", "CenterLinked");
  ensureMeta("mobile-web-app-capable", "yes");
  ensureMeta("theme-color", "#2088b8");
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, refresh, isFacilityAdmin, isSuperAdmin } = useAuth();
  const claimingInvite = useRef(false);
  const claimedForUserId = useRef<string | null>(null);
  const joinedForUserId = useRef<string | null>(null);
  const signingInRef = useRef(false);
  const [email, setEmail] = useState(() => (searchParams.get("email") || "").trim());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [resending, setResending] = useState(false);

  const isAppLogin = location.pathname === "/start";
  const from = safeInternalPath((location.state as { from?: string } | null)?.from);
  const afterLogin = APP_LOGIN_NEXT;

  useEffect(() => {
    applySocialMeta({
      title: isAppLogin ? "CenterLinked" : "Sign in · CenterLinked",
      description: isAppLogin
        ? "Sign in to search verified in-network treatment programs."
        : "Sign in to your CenterLinked account to manage your treatment organization's referral profile.",
      path: isAppLogin ? "/start" : "/login",
    });
    if (isAppLogin) applyAppLoginHead();
  }, [isAppLogin]);

  useEffect(() => {
    try {
      if (hasJoinImportIntent()) return;
      if (isAppLogin) {
        sessionStorage.setItem(POST_LOGIN_PATH_KEY, APP_LOGIN_NEXT);
      } else {
        sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
      }
    } catch {
      /* private mode */
    }
  }, [isAppLogin]);

  useEffect(() => {
    if (authLoading || !user) return;
    // Only follow PDF import after the user already has an org. Clearing it
    // here for first-run users would drop the file before they create one.
    if (profile?.organization_id || isSuperAdmin) {
      const importPath = consumeJoinImportPathForAdmin(isFacilityAdmin || isSuperAdmin);
      if (importPath) {
        navigate(importPath, { replace: true });
        return;
      }
    }

    let cancelled = false;
    const routeAfterLogin = () => {
      if (cancelled) return;
      if (joinedForUserId.current === user.id) {
        consumeFirstRunSignup();
        navigate(afterLogin, { replace: true });
        return;
      }
      const firstRun = isFirstRunUser(user.created_at);
      if (profile?.organization_id && firstRun) {
        consumeFirstRunSignup();
        // Invitees who just claimed should add facilities/insurance, not follow
        // a leftover people/connect path. Keep mid-setup / facility routes.
        const keepFrom =
          from &&
          (from.startsWith("/setup-organization") ||
            from.startsWith("/create-organization") ||
            from.startsWith("/app/onboarding") ||
            from.startsWith("/app/members") ||
            from.startsWith("/app/facilities") ||
            from.startsWith("/app/search"));
        const pdfImportFrom = from?.startsWith("/app/facilities/upload-pdf");
        if (keepFrom && !(pdfImportFrom && !isFacilityAdmin && !isSuperAdmin)) {
          navigate(from, { replace: true });
          return;
        }
        navigate(afterLogin, { replace: true });
        return;
      }
      const keepFrom =
        from &&
        (from.startsWith("/setup-organization") ||
          from.startsWith("/create-organization"));
      if (!profile?.organization_id && firstRun && !keepFrom) {
        consumeFirstRunSignup();
        navigate("/setup-organization", { replace: true });
        return;
      }
      const pdfImportFrom = from?.startsWith("/app/facilities/upload-pdf");
      if (from && !(pdfImportFrom && !isFacilityAdmin && !isSuperAdmin)) {
        navigate(from, { replace: true });
        return;
      }
      navigate(afterLogin, { replace: true });
    };

    const fallbackTimer = window.setTimeout(() => {
      if (cancelled) return;
      claimedForUserId.current = user.id;
      toast.error("Taking too long to check for an invite", {
        description: "Opening organization setup. You can accept the invite there.",
      });
      routeAfterLogin();
    }, 20_000);

    if (!profile?.organization_id && !claimingInvite.current && claimedForUserId.current !== user.id) {
      claimingInvite.current = true;
      void (async () => {
        try {
          const claimed = await claimPendingOrgInvite();
          if (cancelled) return;
          claimedForUserId.current = user.id;
          if (claimed.joined) {
            joinedForUserId.current = user.id;
            await refresh();
            if (cancelled) return;
            toast.success("You've joined your organization", {
              description: "Add facilities and insurance next.",
            });
            // Do not wait for profile.organization_id to land — a stale
            // refresh left invitees on this spinner with the 20s timer already cleared.
            navigate(afterLogin, { replace: true });
            return;
          }
        } catch (err) {
          if (cancelled) return;
          claimedForUserId.current = user.id;
          toast.error(err instanceof Error ? err.message : "Couldn't join your organization", {
            description: "You can accept the invite from organization setup.",
          });
        } finally {
          window.clearTimeout(fallbackTimer);
        }
        routeAfterLogin();
      })();
      return () => {
        cancelled = true;
        window.clearTimeout(fallbackTimer);
        claimingInvite.current = false;
      };
    }

    window.clearTimeout(fallbackTimer);
    routeAfterLogin();
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [authLoading, user, profile?.organization_id, from, afterLogin, navigate, refresh, isFacilityAdmin, isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const workEmail = email.trim().toLowerCase();
    if (!workEmail || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    if (signingInRef.current) {
      toast.message("Still signing in", {
        description: "Wait for this attempt to finish.",
      });
      return;
    }
    signingInRef.current = true;
    setLoading(true);
    let timedOut = false;
    const fallbackTimer = window.setTimeout(() => {
      timedOut = true;
      setLoading(false);
      toast.error("Taking too long to sign in", {
        description: "Try again. If you just created this account, confirm your work email first.",
      });
    }, 20_000);
    const emailGate = await emailAuthGate(workEmail);
    if (emailGate !== "allowed") {
      window.clearTimeout(fallbackTimer);
      signingInRef.current = false;
      setLoading(false);
      const message = emailGate === "unavailable"
        ? EMAIL_AUTH_UNAVAILABLE_MESSAGE
        : PERSONAL_EMAIL_BLOCKED_MESSAGE;
      toast.error(message.title, { description: message.description });
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: workEmail, password });
    window.clearTimeout(fallbackTimer);
    signingInRef.current = false;
    if (!timedOut) setLoading(false);
    if (timedOut) return;
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        setUnconfirmedEmail(workEmail);
        toast.error("Confirm your work email first", {
          description: `Open the link we sent to ${workEmail} to finish creating your free account, then sign in with that exact address.`,
        });
        return;
      }
      toast.error(error.message);
      return;
    }
    const name =
      (data.user?.user_metadata?.full_name as string | undefined) ||
      data.user?.email ||
      null;
    notifyAuthEvent("login", name);
    toast.success("Welcome back");
  };

  if (authLoading || user) {
    return (
      <main className="min-h-dvh grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh flex items-center justify-center px-4 py-10 sm:py-12 overflow-hidden bg-hero-gradient pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="absolute top-0 right-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto w-full max-w-md">
        {isAppLogin ? null : (
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        )}

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl p-6 sm:p-8 animate-fade-up">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center">
              <Logo to={isAppLogin ? "" : "/"} size="lg" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mt-4">
              {isAppLogin ? "Sign in to search" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in using your work email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={isAppLogin ? "h-12 text-base" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={isAppLogin ? "h-12 text-base" : undefined}
              />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
            </Button>
          </form>

          {unconfirmedEmail ? (
            <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Waiting on confirmation for <span className="font-medium text-foreground">{unconfirmedEmail}</span>.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: unconfirmedEmail,
                    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                  });
                  setResending(false);
                  if (error) toast.error(error.message);
                  else toast.success("Confirmation sent", { description: `Check ${unconfirmedEmail}.` });
                }}
              >
                {resending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Resend confirmation"}
              </Button>
            </div>
          ) : null}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <GoogleSignInButton
            className="w-full"
            onBeforeSignIn={() => {
              // Invite emails link here. Google consent can take longer than
              // the 2-minute created_at window — keep skippable org setup.
              setFirstRunSignup();
            }}
          />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              to={email.trim() ? `/join?email=${encodeURIComponent(email.trim())}` : "/join"}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
