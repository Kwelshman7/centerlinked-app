import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isPersonalEmail } from "@/lib/email-domains";
import { applySocialMeta } from "@/lib/social-meta";

export default function RequestAccess() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", organization: "", role: "", num_facilities: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applySocialMeta({
      title: "Request early access · CenterLinked",
      description: "Request early access to CenterLinked for your treatment organization's BD and admissions team.",
      path: "/request-access",
    });
  }, []);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.organization.trim()) {
      toast.error("Please fill in name, work email, and organization."); return;
    }
    if (isPersonalEmail(form.email)) {
      toast.error("Please use your work email", { description: "Personal email addresses aren't accepted." }); return;
    }
    setLoading(true);
    const { error } = await supabase.from("early_access_leads").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      organization: form.organization.trim(),
      facilities: form.num_facilities ? String(form.num_facilities) : "1",
    });
    setLoading(false);
    if (error) { toast.error("Could not submit request", { description: error.message }); return; }
    toast.success("Request received", { description: "We'll review and email you shortly." });
    navigate("/");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-8 animate-fade-up">
          <div className="text-center mb-6">
            <div className="flex justify-center"><Logo to="/" size="lg" /></div>
            <h1 className="font-heading text-2xl font-bold mt-4">Request access</h1>
            <p className="text-sm text-muted-foreground mt-2">CenterLinked is a private, invite-only network for treatment BD reps. Tell us about your organization and we'll get you set up.</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={form.full_name} onChange={update("full_name")} placeholder="Jane Doe" /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" value={form.email} onChange={update("email")} placeholder="jane@company.com" /></div>
            <div className="space-y-1.5"><Label htmlFor="org">Organization</Label><Input id="org" value={form.organization} onChange={update("organization")} placeholder="Sunrise Recovery" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="role">Role</Label><Input id="role" value={form.role} onChange={update("role")} placeholder="BD Director" /></div>
              <div className="space-y-1.5"><Label htmlFor="num"># of facilities</Label><Input id="num" type="number" min="1" value={form.num_facilities} onChange={update("num_facilities")} placeholder="3" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notes">Anything else (optional)</Label><Textarea id="notes" value={form.notes} onChange={update("notes")} placeholder="Tell us briefly what you'd use CenterLinked for." rows={3} /></div>
            <Button type="submit" size="lg" variant="hero" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Request access"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>Already invited?{" "}<Link to="/signup" className="text-primary font-medium hover:underline">Create your account</Link>. Have an account?{" "}<Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
