import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isEmailAuthAllowed, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
import { applySocialMeta } from "@/lib/social-meta";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
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
      title: "Join CenterLinked as a BD rep",
      description:
        "Sign up with your work email. List your facilities, share your live referral link, and keep partners updated.",
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
          description: "Confirm your work email, then sign in to list your facilities.",
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

  if (loading || user) {
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
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl p-6 sm:p-8 animate-fade-up">
          <div className="text-center mb-6">
            <div className="flex justify-center">
              <Logo to="/" size="lg" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mt-4">
              Sign up as a BD rep
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Use your work email to list facilities and share a live referral link.
            </p>
          </div>

          {awaitingEmail ? (
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5 text-center space-y-3">
              <p className="font-heading font-semibold">Confirm your work email</p>
              <p className="text-sm text-muted-foreground">
                Click the link we sent, then sign in to join or create your organization.
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
                    autoFocus={!email}
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
                    autoFocus={Boolean(email)}
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
                    "Create account"
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
    </main>
  );
}
