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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    applySocialMeta({
      title: "Sign in · CenterLinked",
      description: "Sign in to your CenterLinked account to manage your treatment organization's referral profile.",
      path: "/login",
    });
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!profile?.organization_id && !isSuperAdmin) {
      navigate("/create-organization", { replace: true });
      return;
    }
    if (from && from !== "/login") {
      navigate(from, { replace: true });
      return;
    }
    navigate("/app", { replace: true });
  }, [authLoading, user, profile?.organization_id, isSuperAdmin, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  if (authLoading || user) {
    return (
      <main className="min-h-screen grid place-items-center bg-hero-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-hero-gradient">
      <div className="absolute top-0 right-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl p-8 animate-fade-up">
          <div className="text-center mb-8">
            <div className="flex justify-center"><Logo to="/" size="lg" /></div>
            <h1 className="font-heading text-2xl font-bold text-foreground mt-4">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to manage your referral profile</p>
          </div>

          <GoogleSignInButton className="w-full mb-4" />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
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
      </div>
    </main>
  );
}
