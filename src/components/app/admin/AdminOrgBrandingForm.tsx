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
import { cn } from "@/lib/utils";
import { isMissingOptionalOrgColumn, orgDashboardSelect, orgDashboardSelectFallback } from "@/lib/org-public-select";

interface Props {
  organizationId: string;
  onSaved?: () => void;
}

const SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "look", label: "Look" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social" },
  { id: "photos", label: "Photos" },
] as const;

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5 min-w-0", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <div>
        <h3 className="font-heading text-base font-semibold sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AdminOrgBrandingForm({ organizationId, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basics");

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgLogo, setOrgLogo] = useState<string[]>([]);
  const [orgFavicon, setOrgFavicon] = useState<string[]>([]);
  const [orgFooterImage, setOrgFooterImage] = useState<string[]>([]);
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
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialX, setSocialX] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      setLoading(true);
      let { data, error } = await supabase.from("organizations").select(orgDashboardSelect).eq("id", organizationId).maybeSingle();
      if (isMissingOptionalOrgColumn(error)) {
        ({ data, error } = await supabase.from("organizations").select(orgDashboardSelectFallback).eq("id", organizationId).maybeSingle());
      }
      void error;
      if (data) {
        setOrgName(data.name || "");
        setOrgSlug((data as { slug?: string | null }).slug || "");
        setOrgDesc(data.description || "");
        setOrgWebsite(data.website || "");
        setOrgCity(data.hq_city || "");
        setOrgState(data.hq_state || "");
        setOrgLogo(data.logo_url ? [data.logo_url] : []);
        setOrgFavicon(
          (data as { favicon_url?: string | null }).favicon_url
            ? [(data as { favicon_url: string }).favicon_url]
            : [],
        );
        setOrgFooterImage(
          (data as { footer_image_url?: string | null }).footer_image_url
            ? [(data as { footer_image_url: string }).footer_image_url]
            : [],
        );
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
        setSocialFacebook((data as { social_facebook_url?: string | null }).social_facebook_url || "");
        setSocialInstagram((data as { social_instagram_url?: string | null }).social_instagram_url || "");
        setSocialLinkedin((data as { social_linkedin_url?: string | null }).social_linkedin_url || "");
        setSocialX((data as { social_x_url?: string | null }).social_x_url || "");
      }
      setLoading(false);
    })();
  }, [organizationId]);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [loading]);

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSaving(true);
    const slug =
      orgSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "") || null;

    const payload: Record<string, unknown> = {
      name: orgName.trim(),
      slug,
      description: orgDesc.trim() || null,
      website: orgWebsite.trim() || null,
      hq_city: orgCity.trim() || null,
      hq_state: orgState.trim() || null,
      logo_url: orgLogo[0] || null,
      favicon_url: orgFavicon[0] || null,
      footer_image_url: orgFooterImage[0] || null,
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
      social_facebook_url: socialFacebook.trim() || null,
      social_instagram_url: socialInstagram.trim() || null,
      social_linkedin_url: socialLinkedin.trim() || null,
      social_x_url: socialX.trim() || null,
    };

    const optionalColumns = [
      "footer_image_url",
      "favicon_url",
      "social_facebook_url",
      "social_instagram_url",
      "social_linkedin_url",
      "social_x_url",
    ] as const;

    let error: { message?: string } | null = null;
    for (let attempt = 0; attempt <= optionalColumns.length; attempt++) {
      const result = await supabase.from("organizations").update(payload).eq("id", organizationId);
      error = result.error;
      if (!error) break;

      const missing = optionalColumns.find((col) => error?.message?.includes(col));
      if (!missing) break;
      delete payload[missing];
    }

    setSaving(false);
    if (error) {
      toast.error(error.message ?? "Could not save branding");
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
          description: result.to ? `Welcome email sent to ${result.to}` : "Welcome email sent",
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
      toast.success("Branding saved");
    }
    onSaved?.();
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading branding…</div>;
  }

  const previewSlug = orgSlug.trim().toLowerCase();

  return (
    <form onSubmit={save} className="space-y-4 pb-28 lg:pb-8">
      <div className="sticky top-0 z-30 -mx-1 border-b border-border/70 bg-muted/30 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-muted/80 sm:rounded-xl sm:border sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Branding</h2>
            <p className="text-sm text-muted-foreground">
              Edit what partners see on the public org page.
            </p>
          </div>
          <Button type="submit" disabled={saving} className="hidden sm:inline-flex shrink-0">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </Button>
        </div>
        <nav
          aria-label="Branding sections"
          className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => jumpTo(section.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border/70",
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <Card className="p-4 sm:p-6 space-y-8 sm:space-y-10">
        <Section
          id="basics"
          title="Basics"
          description="Name, public link, and the short story partners read first."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organization name" htmlFor="on" className="sm:col-span-2">
              <Input
                id="on"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                autoComplete="organization"
              />
            </Field>
            <Field
              label="Public URL slug"
              htmlFor="oslug"
              hint={previewSlug ? orgDisplayPath(previewSlug) : "Used in centerlinked.com/o/…"}
            >
              <Input
                id="oslug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="recovery-solutions"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="Email domain" htmlFor="odomain" hint="Company emails that can join this org.">
              <Input
                id="odomain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="example.com"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="Tagline" htmlFor="tg" className="sm:col-span-2">
              <Input
                id="tg"
                maxLength={140}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Detox, residential, and outpatient programs across the region."
              />
            </Field>
            <Field label="Description" htmlFor="od" className="sm:col-span-2">
              <Textarea
                id="od"
                rows={4}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="min-h-[6.5rem] resize-y"
              />
            </Field>
            <Field label="Website" htmlFor="ow">
              <Input
                id="ow"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="https://"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4 min-w-0">
              <Field label="HQ city" htmlFor="oc">
                <Input
                  id="oc"
                  value={orgCity}
                  onChange={(e) => setOrgCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="HQ state" htmlFor="ost">
                <Input
                  id="ost"
                  value={orgState}
                  onChange={(e) => setOrgState(e.target.value)}
                  autoComplete="address-level1"
                />
              </Field>
            </div>
            <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2">
              <Checkbox checked={verified} onCheckedChange={(v) => setVerified(!!v)} />
              <span>Verified organization</span>
            </label>
          </div>
        </Section>

        <div className="border-t border-border/60" />

        <Section id="look" title="Look" description="Logo, favicon, and colors used across public pages.">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:gap-0 lg:items-stretch">
            <div className="min-w-0 lg:pr-6 lg:border-r lg:border-border/70">
              <Field label="Logo">
                <ImageUploader
                  bucket="org-logos"
                  value={orgLogo}
                  onChange={setOrgLogo}
                  max={1}
                  label="Upload logo"
                  objectFit="contain"
                  recommendedSize="Square logo, PNG with transparent background preferred. Max 5 MB."
                />
              </Field>
              <Field
                label="Favicon"
                hint="Browser tab and share-link preview icon. Falls back to the logo if empty."
                className="pt-4"
              >
                <ImageUploader
                  bucket="org-logos"
                  value={orgFavicon}
                  onChange={setOrgFavicon}
                  max={1}
                  label="Upload favicon"
                  objectFit="contain"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,.ico,.png,.webp"
                  recommendedSize="Square PNG, 512×512 px (32×32 minimum). ICO or PNG, max 5 MB."
                />
              </Field>
            </div>

            <div className="min-w-0 flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:pl-6">
              <div>
                <p className="text-sm font-semibold">Colors</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applied to buttons, footer, and accents on public pages.
                </p>
              </div>

              <div
                className="h-12 rounded-lg border border-border/60 overflow-hidden flex shadow-sm"
                aria-hidden
              >
                <div className="flex-[1.4]" style={{ backgroundColor: brandColor }} />
                <div className="flex-1" style={{ backgroundColor: accentColor }} />
              </div>

              <Field label="Brand color" htmlFor="bc">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    id="bc"
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="min-w-0 font-mono text-sm uppercase"
                  />
                </div>
              </Field>

              <Field label="Accent color" htmlFor="ac">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    id="ac"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="min-w-0 font-mono text-sm uppercase"
                  />
                </div>
              </Field>
            </div>
          </div>

          <Field
            label="Announcement"
            htmlFor="ann"
            hint="Optional one-line notice on the public page."
            className="pt-1"
          >
            <Input
              id="ann"
              maxLength={240}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="New PHP program now accepting referrals."
            />
          </Field>
        </Section>

        <div className="border-t border-border/60" />

        <Section
          id="contact"
          title="Referral contact"
          description="Who partners reach when they tap Refer a Patient."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="BD rep name" htmlFor="bdn" className="sm:col-span-2">
              <Input id="bdn" value={bdName} onChange={(e) => setBdName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Phone" htmlFor="bdp">
              <Input
                id="bdp"
                value={bdPhone}
                onChange={(e) => setBdPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <Field label="Email" htmlFor="bde">
              <Input
                id="bde"
                type="email"
                inputMode="email"
                value={bdEmail}
                onChange={(e) => setBdEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
          </div>
        </Section>

        <div className="border-t border-border/60" />

        <Section
          id="social"
          title="Social links"
          description="Footer icons on public pages. Leave blank to hide."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook" htmlFor="soc-fb">
              <Input
                id="soc-fb"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/your-org"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="Instagram" htmlFor="soc-ig">
              <Input
                id="soc-ig"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/your-org"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="LinkedIn" htmlFor="soc-li">
              <Input
                id="soc-li"
                value={socialLinkedin}
                onChange={(e) => setSocialLinkedin(e.target.value)}
                placeholder="https://linkedin.com/company/your-org"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
            <Field label="X (Twitter)" htmlFor="soc-x">
              <Input
                id="soc-x"
                value={socialX}
                onChange={(e) => setSocialX(e.target.value)}
                placeholder="https://x.com/your-org"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
          </div>
        </Section>

        <div className="border-t border-border/60" />

        <Section
          id="photos"
          title="Photos"
          description="Hero and gallery images for the public org page."
        >
          <Field label="Organization photos" hint="Star one as the hero banner.">
            <ImageUploader
              bucket="org-logos"
              value={orgImages}
              onChange={setOrgImages}
              max={8}
              label="Add photo"
              allowCover
              coverLabel="Hero"
              recommendedSize="Hero works best at 1920×1080 (16:9). JPG or PNG, max 5 MB each."
            />
          </Field>
          <Field
            label="Footer banner (optional)"
            hint="Wide branding asset. Your square logo still appears in the public footer."
          >
            <ImageUploader
              bucket="org-logos"
              value={orgFooterImage}
              onChange={setOrgFooterImage}
              max={1}
              label="Upload"
              objectFit="contain"
              recommendedSize="Optional. 1600×400 (4:1 wide) works well."
            />
          </Field>
        </Section>
      </Card>

      <div className="hidden sm:flex items-center justify-end gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5">
        <p className="mr-auto text-sm text-muted-foreground">Saves logo, colors, contact, and public page details.</p>
        <Button type="submit" disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={saving} className="h-11 w-full text-base">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
      </div>
    </form>
  );
}
