import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/app/ImageUploader";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { orgDisplayPath } from "@/lib/public-urls";
import { mergeOrgImages } from "@/lib/org-hero";

interface Props {
  organizationId: string;
  onSaved?: () => void;
}

export function AdminOrgBrandingForm({ organizationId, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgLogo, setOrgLogo] = useState<string[]>([]);
  const [emailDomain, setEmailDomain] = useState("");
  const [verified, setVerified] = useState(false);
  const [bdName, setBdName] = useState("");
  const [bdPhone, setBdPhone] = useState("");
  const [bdEmail, setBdEmail] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#1A73E8");
  const [accentColor, setAccentColor] = useState("#E0EDFF");
  const [orgImages, setOrgImages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [programBadgesText, setProgramBadgesText] = useState("");
  const [ctaPrimary, setCtaPrimary] = useState("");
  const [ctaSecondary, setCtaSecondary] = useState("");
  const [whyRefer, setWhyRefer] = useState<{ title: string; body: string }[]>([]);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("organizations").select("*").eq("id", organizationId).maybeSingle();
      if (data) {
        setOrgName(data.name || "");
        setOrgSlug((data as { slug?: string | null }).slug || "");
        setOrgDesc(data.description || "");
        setOrgWebsite(data.website || "");
        setOrgCity(data.hq_city || "");
        setOrgState(data.hq_state || "");
        setOrgLogo(data.logo_url ? [data.logo_url] : []);
        setEmailDomain(data.email_domain || "");
        setVerified(!!data.verified);
        setBdName(data.bd_contact_name || "");
        setBdPhone(data.bd_contact_phone || "");
        setBdEmail(data.bd_contact_email || "");
        setTagline((data as { tagline?: string | null }).tagline || "");
        setBrandColor((data as { brand_color?: string | null }).brand_color || "#1A73E8");
        setAccentColor((data as { accent_color?: string | null }).accent_color || "#E0EDFF");
        const cover = (data as { cover_image_url?: string | null }).cover_image_url;
        const gallery = (data as { image_urls?: string[] | null }).image_urls;
        setOrgImages(mergeOrgImages(gallery, cover));
        setAnnouncement((data as { announcement?: string | null }).announcement || "");
        const badges = ((data as { program_badges?: string[] | null }).program_badges) || [];
        setProgramBadgesText(badges.join(", "));
        setCtaPrimary((data as { cta_primary_label?: string | null }).cta_primary_label || "");
        setCtaSecondary((data as { cta_secondary_label?: string | null }).cta_secondary_label || "");
        const wr = ((data as { why_refer?: unknown }).why_refer) as unknown;
        if (Array.isArray(wr)) {
          setWhyRefer(
            wr.filter(
              (x): x is { title: string; body: string } =>
                !!x && typeof x === "object" && "title" in x && "body" in x,
            ),
          );
        }
      }
      setLoading(false);
    })();
  }, [organizationId]);

  const addWhy = () => setWhyRefer((arr) => (arr.length >= 4 ? arr : [...arr, { title: "", body: "" }]));
  const updateWhy = (i: number, field: "title" | "body", v: string) =>
    setWhyRefer((arr) => arr.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  const removeWhy = (i: number) => setWhyRefer((arr) => arr.filter((_, idx) => idx !== i));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSaving(true);
    const program_badges = programBadgesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const cleanWhyRefer = whyRefer
      .map((r) => ({ title: r.title.trim(), body: r.body.trim() }))
      .filter((r) => r.title && r.body)
      .slice(0, 4);
    const slug = orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || null;
    const { error } = await supabase
      .from("organizations")
      .update({
        name: orgName.trim(),
        slug,
        description: orgDesc.trim() || null,
        website: orgWebsite.trim() || null,
        hq_city: orgCity.trim() || null,
        hq_state: orgState.trim() || null,
        logo_url: orgLogo[0] || null,
        email_domain: emailDomain.trim() ? emailDomain.trim().toLowerCase() : null,
        verified,
        bd_contact_name: bdName.trim() || null,
        bd_contact_phone: bdPhone.trim() || null,
        bd_contact_email: bdEmail.trim() || null,
        tagline: tagline.trim() || null,
        brand_color: brandColor.trim() || null,
        accent_color: accentColor.trim() || null,
        cover_image_url: orgImages[0] || null,
        image_urls: orgImages,
        announcement: announcement.trim() || null,
        program_badges,
        cta_primary_label: ctaPrimary.trim() || null,
        cta_secondary_label: ctaSecondary.trim() || null,
        why_refer: cleanWhyRefer,
      })
      .eq("id", organizationId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Organization updated");
    onSaved?.();
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading branding…</div>;
  }

  return (
    <Card className="p-6 max-w-3xl">
      <form onSubmit={save} className="space-y-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Organization profile</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Full branding editor — same fields customers see in Settings.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <ImageUploader bucket="org-logos" value={orgLogo} onChange={setOrgLogo} max={1} label="Upload" recommendedSize="Recommended: 800×800 px minimum. PNG with transparent background works best. Max 5 MB." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="on">Name</Label>
            <Input id="on" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="oslug">URL slug</Label>
            <Input
              id="oslug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="recovery-solutions"
            />
            {orgSlug.trim() && (
              <p className="text-xs text-muted-foreground font-mono">{orgDisplayPath(orgSlug.trim().toLowerCase())}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="odomain">Email domain</Label>
            <Input id="odomain" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)} placeholder="example.com" />
          </div>
          <div className="space-y-2 flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={verified} onCheckedChange={(v) => setVerified(!!v)} />
              <span>Verified organization</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="od">Description</Label>
          <Textarea id="od" rows={3} value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="ow">Website</Label>
            <Input id="ow" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc">HQ City</Label>
            <Input id="oc" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ost">HQ State</Label>
            <Input id="ost" value={orgState} onChange={(e) => setOrgState(e.target.value)} />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 space-y-3">
          <div>
            <p className="font-heading font-semibold text-sm">Referral contact</p>
            <p className="text-xs text-muted-foreground">Shown on the public org page.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bdn">BD rep name</Label>
              <Input id="bdn" value={bdName} onChange={(e) => setBdName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bdp">BD phone</Label>
              <Input id="bdp" value={bdPhone} onChange={(e) => setBdPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bde">BD email</Label>
              <Input id="bde" type="email" value={bdEmail} onChange={(e) => setBdEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 space-y-4">
          <div>
            <p className="font-heading font-semibold text-sm">Branded mini-homepage</p>
            <p className="text-xs text-muted-foreground">Public page at /o/your-slug</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tg">Tagline</Label>
            <Input id="tg" maxLength={140} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bc">Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bc"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer"
                />
                <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="ac"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer"
                />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Organization photos</Label>
            <p className="text-xs text-muted-foreground">
              Upload photos and mark one as the hero banner on the public org page.
            </p>
            <ImageUploader
              bucket="org-logos"
              value={orgImages}
              onChange={setOrgImages}
              max={8}
              label="Add photo"
              allowCover
              coverLabel="Hero"
              recommendedSize="Recommended: 1920×1080 px (16:9) hero; JPG or PNG, max 5 MB each."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann">Announcement banner</Label>
            <Textarea id="ann" rows={2} maxLength={240} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pb">Program badges</Label>
            <Input id="pb" value={programBadgesText} onChange={(e) => setProgramBadgesText(e.target.value)} placeholder="Comma-separated, max 6" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta1">Primary CTA label</Label>
              <Input id="cta1" value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta2">Secondary CTA label</Label>
              <Input id="cta2" value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Why refer</Label>
              <Button type="button" size="sm" variant="outline" onClick={addWhy} disabled={whyRefer.length >= 4}>
                + Add reason
              </Button>
            </div>
            {whyRefer.map((r, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                <Input placeholder="Title" value={r.title} onChange={(e) => updateWhy(i, "title", e.target.value)} />
                <Textarea rows={2} placeholder="Body" value={r.body} onChange={(e) => updateWhy(i, "body", e.target.value)} />
                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeWhy(i)} className="text-destructive">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save organization
          </Button>
        </div>
      </form>
    </Card>
  );
}
