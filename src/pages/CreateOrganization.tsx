import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/app/ImageUploader";
import { ArrowLeft, ArrowRight, Building2, Loader2, Sparkles, Shield, Rocket } from "lucide-react";
import { toast } from "sonner";
import { getEmailDomain } from "@/lib/email-domains";

export default function CreateOrganization() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", website: "", hq_city: "", hq_state: "",
    description: "", phone: "", num_facilities: "", logo_url: "",
    bd_contact_name: "", bd_contact_phone: "", bd_contact_email: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else if (profile?.organization_id) navigate("/app", { replace: true });
  }, [loading, user, profile?.organization_id, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const domain = user?.email ? getEmailDomain(user.email) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Sign in required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Organization name required");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc("create_organization_with_owner", {
      _name: form.name.trim(),
      _email_domain: domain,
      _website: form.website || null,
      _hq_city: form.hq_city || null,
      _hq_state: form.hq_state || null,
      _description: form.description || null,
      _phone: form.phone || null,
      _num_facilities: form.num_facilities ? parseInt(form.num_facilities) : null,
      _logo_url: form.logo_url || null,
      _bd_contact_name: form.bd_contact_name || null,
      _bd_contact_phone: form.bd_contact_phone || null,
      _bd_contact_email: form.bd_contact_email || null,
    });
    if (error) {
      setSaving(false);
      const isDuplicate = error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique");
      toast.error(
        isDuplicate
          ? "Someone from your domain already created an organization"
          : error.message,
        isDuplicate
          ? { description: "Ask a colleague to invite you from the Members page instead of creating a new one." }
          : undefined,
      );
      return;
    }
    await refresh();
    setSaving(false);
    toast.success("Organization created!", { description: "Now let's add your facilities." });
    navigate("/app/onboarding", { replace: true });
    void data;
  };

  return (
    <main className="relative min-h-screen px-4 py-8 sm:py-12 overflow-hidden bg-hero-gradient">
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl -z-10" />
      <div className="absolute bottom-0 -left-10 h-80 w-80 rounded-full bg-accent/40 blur-3xl -z-10" />

      <div className="max-w-2xl mx-auto">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to CenterLinked
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Create your organization</h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            You're the first person from <span className="font-semibold text-foreground">{domain || "your company"}</span>. Set up your network — anyone with that email domain can join after.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-6 sm:p-8 space-y-6 animate-fade-up">
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold">Your organization</p>
              <p className="text-xs text-muted-foreground">Pending verification — full launch unlocks once approved.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Organization name *</Label>
              <Input id="name" autoFocus value={form.name} onChange={update("name")} placeholder="Flyland Recovery Network" required />
            </div>
            <div className="space-y-2">
              <Label>Email domain</Label>
              <Input value={domain} disabled className="bg-muted text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Main phone</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://" value={form.website} onChange={update("website")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num"># of facilities</Label>
              <Input id="num" type="number" min="1" value={form.num_facilities} onChange={update("num_facilities")} placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">HQ city</Label>
              <Input id="city" value={form.hq_city} onChange={update("hq_city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">HQ state</Label>
              <Input id="state" value={form.hq_state} onChange={update("hq_state")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desc">About your network</Label>
              <Textarea id="desc" rows={4} value={form.description} onChange={update("description")} placeholder="One paragraph about your mission, reach, and what makes you different." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Logo</Label>
              <p className="text-xs text-muted-foreground">You can add your logo after your organization is created, from the Settings page.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm">Referral contact</p>
                <p className="text-xs text-muted-foreground">Who should receive referrals from your shared link?</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bdn">BD rep name</Label>
                <Input id="bdn" value={form.bd_contact_name} onChange={update("bd_contact_name")} placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bdp">BD phone</Label>
                <Input id="bdp" value={form.bd_contact_phone} onChange={update("bd_contact_phone")} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bde">BD email</Label>
                <Input id="bde" type="email" value={form.bd_contact_email} onChange={update("bd_contact_email")} placeholder="referrals@org.com" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-accent/40 border border-border/60 p-3 flex items-start gap-3">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your organization will be marked <span className="font-semibold text-foreground">pending verification</span>. You can build it out fully now — public visibility unlocks after our team approves it.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full shadow-md" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Rocket className="h-4 w-4" /> Create organization <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </main>
  );
}
