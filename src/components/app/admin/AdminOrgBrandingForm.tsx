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
import { sendOrgWelcomeEmail } from "@/lib/transactional-email";

interface Props {
  organizationId: string;
  onSaved?: () => void;
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="border-b border-border/60 px-4 py-3.5 sm:px-5">
        <h3 className="font-heading text-sm font-semibold sm:text-base">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </Card>
  );
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
  const [wasVerified, setWasVerified] = useState(false);
  const [bdName, setBdName] = useState("");
  const [bdPhone, setBdPhone] = useState("");
  const [bdEmail, setBdEmail] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#1A73E8");
  const [accentColor, setAccentColor] = useState("#E0EDFF");
  const [orgImages, setOrgImages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");

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
        const v = !!data.verified;
        setVerified(v);
        setWasVerified(v);
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
      }
      setLoading(false);
    })();
  }, [organizationId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSaving(true);
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
      })
      .eq("id", organizationId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    const becameVerified = !wasVerified && verified;
    if (becameVerified) {
      try {
        const result = await sendOrgWelcomeEmail({
          organization_id: organizationId,
          to_email: bdEmail.trim() || undefined,
          to_name: bdName.trim() || undefined,
        });
        setWasVerified(true);
        toast.success("Organization verified", {
          description: result.to
            ? `Welcome email sent to ${result.to}`
            : "Welcome email sent",
        });
      } catch (emailErr) {
        setWasVerified(true);
        toast.success("Organization updated", {
          description:
            emailErr instanceof Error
              ? `Verified, but welcome email failed: ${emailErr.message}`
              : "Verified, but welcome email failed",
        });
      }
    } else {
      setWasVerified(verified);
      toast.success("Organization updated");
    }
    onSaved?.();
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading branding…</div>;
  }

  const previewSlug = orgSlug.trim().toLowerCase();

  return (
    <form onSubmit={save} className="space-y-5 pb-24 lg:pb-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Organization profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Provider directory details shown on your public referral page.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="mt-3 hidden sm:inline-flex">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save organization
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:items-start">
        <SectionCard
          title="Identity"
          description="Logo, legal name, and how partners find your public page."
        >
          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUploader
              bucket="org-logos"
              value={orgLogo}
              onChange={setOrgLogo}
              max={1}
              label="Upload"
              recommendedSize="Recommended: 800×800 px minimum. PNG with transparent background works best. Max 5 MB."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="on">Organization name</Label>
            <Input
              id="on"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oslug">Public URL slug</Label>
            <Input
              id="oslug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="recovery-solutions"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {previewSlug && (
              <p className="font-mono text-xs text-muted-foreground">{orgDisplayPath(previewSlug)}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="odomain">Email domain</Label>
              <Input
                id="odomain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="example.com"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="flex items-end">
              <label className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <Checkbox checked={verified} onCheckedChange={(v) => setVerified(!!v)} />
                <span>Verified organization</span>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="About & location" description="What referring partners see first about your network.">
          <div className="space-y-2">
            <Label htmlFor="tg">Tagline</Label>
            <Input
              id="tg"
              maxLength={140}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Detox, residential, and outpatient programs across the region."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="od">Description</Label>
            <Textarea
              id="od"
              rows={5}
              value={orgDesc}
              onChange={(e) => setOrgDesc(e.target.value)}
              className="min-h-[7.5rem] resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="ow">Website</Label>
              <Input
                id="ow"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oc">HQ city</Label>
              <Input id="oc" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} autoComplete="address-level2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ost">HQ state</Label>
              <Input id="ost" value={orgState} onChange={(e) => setOrgState(e.target.value)} autoComplete="address-level1" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Referral contact"
          description="Business development contact shown when partners need to get in touch."
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bdn">BD rep name</Label>
              <Input id="bdn" value={bdName} onChange={(e) => setBdName(e.target.value)} autoComplete="name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bdp">Phone</Label>
                <Input
                  id="bdp"
                  value={bdPhone}
                  onChange={(e) => setBdPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bde">Email</Label>
                <Input
                  id="bde"
                  type="email"
                  inputMode="email"
                  value={bdEmail}
                  onChange={(e) => setBdEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Brand & announcement"
          description="Colors and banner copy for your public mini-homepage."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bc">Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bc"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                />
                <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="min-w-0" />
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
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="min-w-0" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann">Announcement banner</Label>
            <Textarea
              id="ann"
              rows={3}
              maxLength={240}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="New PHP program now accepting referrals."
              className="resize-y"
            />
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="Organization photos"
          description="Upload photos and mark one as the hero banner on the public org page."
        >
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
        </SectionCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={saving} className="h-11 w-full text-base">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save organization
        </Button>
      </div>
    </form>
  );
}
