import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowDown, BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isEmailAuthAllowed, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { applySocialMeta } from "@/lib/social-meta";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { JoinShowcase } from "@/components/auth/JoinShowcase";
import { notifyAuthEvent } from "@/lib/transactional-email";

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => (searchParams.get("email") || "").trim());
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  useEffect(() => {
    applySocialMeta({
      title: "Join CenterLinked free",
      description:
        "Sign up free with your work email to search in-network treatment programs by insurance and state, and list your organization for referral partners.",
      path: "/join",
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && (profile?.organization_id || isSuperAdmin)) {
      navigate("/app/search", { replace: true });
      return;
    }
    if (user && !profile?.organization_id) {
      navigate("/setup-organization", { replace: true });
    }
  }, [loading, user, profile?.organization_id, isSuperAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Fill in your name, work email, and password");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const allowed = await isEmailAuthAllowed(email);
      if (!allowed) {
        toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
          description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setAwaitingEmail(true);
        toast.success("Check your inbox", {
          description: "Confirm your work email to finish creating your free account.",
          duration: 8000,
        });
        return;
      }
      notifyAuthEvent("signup", fullName.trim());
      toast.success("Welcome to CenterLinked");
      navigate("/setup-organization", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("create-account")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading || user) {
    return (
      <main className="min-h-dvh grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-hero-gradient px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-8">
      <div className="pointer-events-none absolute inset-0 landing-glow" aria-hidden />
      <div className="absolute top-0 right-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3 lg:mb-10">
          <Logo to="/" size="md" />
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-14">
          <section className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
              <BadgeCheck className="h-3.5 w-3.5" /> Free to sign up · No card required
            </span>
            <h1 className="font-heading mt-4 text-[1.7rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Search in-network treatment programs — free.
            </h1>
            <p className="mt-3 max-w-lg text-[15px] text-muted-foreground sm:text-base">
              Sign up with your work email to search by insurance and state. Claim your organization anytime so referral
              partners can find you too.
            </p>

            <JoinShowcase className="mt-8 w-full" />

            <p className="font-heading mt-8 max-w-lg text-lg font-bold leading-snug text-foreground sm:text-xl">
              List your organization on CenterLinked for free today and grow your referral network.
            </p>
            <Button type="button" variant="hero" size="lg" className="mt-5 lg:hidden" onClick={scrollToForm}>
              Create free account <ArrowDown className="h-4 w-4" />
            </Button>
          </section>

          <div id="create-account" className="w-full scroll-mt-6 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl p-6 sm:p-8 animate-fade-up">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold text-foreground">Create your free account</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Use your work email. Free to sign up, no card required.
                </p>
              </div>

              {awaitingEmail ? (
                <div className="rounded-xl border border-border/70 bg-muted/40 p-5 text-center space-y-3">
                  <p className="font-heading font-semibold">Confirm your work email</p>
                  <p className="text-sm text-muted-foreground">
                    Click the link we sent to finish creating your free account.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/login">Sign in</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Your name</Label>
                      <Input
                        id="full-name"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="h-12 text-base"
                      />
                    </div>
                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
                        </>
                      ) : (
                        "Create free account"
                      )}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <GoogleSignInButton label="Sign up with Google" className="w-full" />

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
