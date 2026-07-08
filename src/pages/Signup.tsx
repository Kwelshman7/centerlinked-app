import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isPersonalEmail } from "@/lib/email-domains";
import { applySocialMeta } from "@/lib/social-meta";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applySocialMeta({
      title: "Create your account · CenterLinked",
      description: "Set up your CenterLinked account to publish your treatment organization's referral profile.",
      path: "/signup",
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email || !password) {
      toast.error("Fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (isPersonalEmail(email)) {
      toast.error("Please use your work email", { description: "Personal email addresses (Gmail, Yahoo, etc.) aren't allowed." });
      return;
    }

    setLoading(true);

    // Members-only gate: must have a pending invite OR match a verified org domain.
    const { data: eligible, error: eligErr } = await supabase.rpc("email_signup_eligible", { _email: email });
    if (eligErr) {
      setLoading(false);
      toast.error("Couldn't verify access", { description: eligErr.message });
      return;
    }
    if (!eligible) {
      setLoading(false);
      toast.error("This email isn't on the invite list", {
        description: "CenterLinked is invite-only. Request access and we'll review your application.",
      });
      navigate("/request-access");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Welcome to CenterLinked");
      navigate("/create-organization");
    } else {
      toast.success("Check your inbox", {
        description: "We sent you a confirmation email. Click the link to activate your account, then come back to sign in.",
        duration: 8000,
      });
      navigate("/login");
    }
  };

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
            <h1 className="font-heading text-2xl font-bold text-foreground mt-4">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Members-only. Use the work email you were invited with — or one that matches a verified organization.{" "}
              <Link to="/request-access" className="text-primary font-medium hover:underline">Need access?</Link>
            </p>
          </div>

          <GoogleSignInButton label="Sign up with Google" className="w-full mb-4" />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
