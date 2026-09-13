import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { BadgeCheck, FileText, Loader2, Search as SearchIcon, ShieldCheck, Upload, X } from "lucide-react";
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
import { assertPdfFile } from "@/lib/upload-guards";
import {
  clearPendingJoinPdf,
  consumeJoinImportPath,
  hasJoinImportIntent,
  peekPendingJoinPdfName,
  setJoinImportIntent,
  setPendingJoinPdf,
} from "@/lib/join-intent";

const STEPS = [
  {
    title: "Create a free account",
    detail: "Use your work email. No card required.",
  },
  {
    title: "Claim or create your organization",
    detail: "Facilities and insurance are saved here — not before.",
  },
  {
    title: "Review the extract, then save",
    detail: "AI reads programs, insurance, and photos. You confirm every field before anything is committed.",
  },
] as const;

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => (searchParams.get("email") || "").trim());
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [wantsImport, setWantsImport] = useState(
    () => searchParams.get("import") === "pdf" || hasJoinImportIntent(),
  );
  const [pickedPdf, setPickedPdf] = useState<File | null>(null);
  const [pickedPdfName, setPickedPdfName] = useState(() => peekPendingJoinPdfName() || "");

  useEffect(() => {
    applySocialMeta({
      title: "Join CenterLinked free",
      description:
        "Sign up free with your work email. Import a facilities PDF, review the extracted data and photos, and confirm before anything is saved.",
      path: "/join",
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("import") === "pdf") {
      setJoinImportIntent();
      setWantsImport(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading) return;
    if (user && (profile?.organization_id || isSuperAdmin)) {
      const importPath = wantsImport ? consumeJoinImportPath() : null;
      navigate(importPath || "/app/search", { replace: true });
      return;
    }
    if (user && !profile?.organization_id) {
      navigate("/setup-organization", { replace: true });
    }
  }, [loading, user, profile?.organization_id, isSuperAdmin, navigate, wantsImport]);

  const focusAccountForm = () => {
    document.getElementById("create-account")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startPdfImport = () => {
    setJoinImportIntent();
    setWantsImport(true);
    focusAccountForm();
    toast.message("Create your free account next", {
      description:
        "After you claim or create your organization, you’ll upload the PDF, review the extract, and confirm before save.",
    });
  };

  const onPdfChosen = async (file: File | undefined) => {
    if (!file) return;
    const check = await assertPdfFile(file);
    if (!check.ok) {
      toast.error(check.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setPendingJoinPdf(file);
    setPickedPdf(file);
    setPickedPdfName(file.name);
    setWantsImport(true);
    focusAccountForm();
    toast.message("PDF selected", {
      description: "Create your free account next. You’ll review the extract before anything is saved.",
    });
  };

  const clearPickedPdf = () => {
    clearPendingJoinPdf();
    setPickedPdf(null);
    setPickedPdfName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

      if (wantsImport) setJoinImportIntent();
      if (pickedPdf) setPendingJoinPdf(pickedPdf);

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
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => {
              if (wantsImport) setJoinImportIntent();
              if (pickedPdf) setPendingJoinPdf(pickedPdf);
            }}
          >
            Sign in
          </Link>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-14">
          <section className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
              <BadgeCheck className="h-3.5 w-3.5" /> Free · Work email · No card
            </span>
            <h1 className="font-heading mt-4 text-[1.7rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Join the referral network.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-muted-foreground sm:text-base">
              Create a free work-email account. Then search in-network programs, or list your
              organization by importing a facilities PDF.
            </p>

            <ol className="mt-8 space-y-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-xl border border-border/60 bg-card/70 px-3 py-3 sm:px-4"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div
              className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 bg-card/80 p-4 sm:p-5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void onPdfChosen(e.dataTransfer.files?.[0]);
              }}
            >
              <p className="font-heading font-semibold">Import your facilities PDF</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a one-pager or insurance list. We extract facilities, contracts, and images.
                You confirm the extract is correct before anything is committed.
              </p>

              {pickedPdfName ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pickedPdfName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pickedPdf
                        ? `${formatBytes(pickedPdf.size)} · selected — not saved yet`
                        : "Selected on this device — you’ll confirm it again if you leave this tab"}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearPickedPdf} aria-label="Remove PDF">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Choose facilities PDF
                  </Button>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={startPdfImport}
                  >
                    I’ll upload after I create my account
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  void onPdfChosen(e.target.files?.[0]);
                }}
              />

              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Nothing is saved until you review and confirm. Missing data stays blank — we do not
                invent contracts or addresses. PDF up to 15MB.
              </p>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <SearchIcon className="h-4 w-4 shrink-0" />
              Only here to search? Create the same free account, then skip listing for now.
            </p>
          </section>

          <div id="create-account" className="w-full scroll-mt-6 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md animate-fade-up sm:p-8">
              <div className="mb-6 text-center">
                <h2 className="font-heading text-2xl font-bold text-foreground">Create your free account</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {wantsImport
                    ? pickedPdfName
                      ? `Next you’ll claim your organization, then review ${pickedPdfName} before save.`
                      : "After this, you’ll claim your organization, upload the PDF, and review the extract before save."
                    : "Work email required. Free to sign up, no card required."}
                </p>
              </div>

              {awaitingEmail ? (
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-5 text-center">
                  <p className="font-heading font-semibold">Confirm your work email</p>
                  <p className="text-sm text-muted-foreground">
                    Click the link we sent to finish creating your free account.
                    {wantsImport ? " We’ll continue to PDF import after you sign in." : ""}
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
                      ) : wantsImport ? (
                        "Continue to organization setup"
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

                  <GoogleSignInButton
                    label="Sign up with Google"
                    className="w-full"
                    onBeforeSignIn={() => {
                      if (wantsImport) setJoinImportIntent();
                      if (pickedPdf) setPendingJoinPdf(pickedPdf);
                    }}
                  />

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        if (wantsImport) setJoinImportIntent();
                        if (pickedPdf) setPendingJoinPdf(pickedPdf);
                      }}
                    >
                      Sign in
                    </Link>
                  </p>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
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
