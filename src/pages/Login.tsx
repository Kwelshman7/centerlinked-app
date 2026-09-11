import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { isEmailAuthAllowed, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";

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
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isAppLogin = location.pathname === "/start";
  const from = safeInternalPath((location.state as { from?: string } | null)?.from);
  const afterLogin = isAppLogin ? APP_LOGIN_NEXT : "/app";

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
    if (!profile?.organization_id && !isSuperAdmin) {
      navigate("/setup-organization", { replace: true });
      return;
    }
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    navigate(afterLogin, { replace: true });
  }, [authLoading, user, profile?.organization_id, isSuperAdmin, from, afterLogin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const allowed = await isEmailAuthAllowed(email);
    if (!allowed) {
      setLoading(false);
      toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
        description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
      });
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
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

      <div className="w-full max-w-md">
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
              {isAppLogin
                ? "Work email only. After you sign in you’ll land on search."
                : "Sign in with your work email. Personal emails require CenterLinked approval."}
            </p>
          </div>

          <GoogleSignInButton className="w-full mb-2" />
          <p className="text-xs text-muted-foreground text-center mb-4">
            Approved with a personal email? Skip Google and sign in with that exact address.
          </p>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
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

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        {isAppLogin ? (
          <p className="text-center text-xs text-muted-foreground mt-5 px-1 leading-relaxed">
            Add this page to your Home Screen for a one-tap app. On iPhone: Share → Add to Home Screen.
            The CenterLinked logo is the icon.
          </p>
        ) : null}
      </div>
    </main>
  );
}
