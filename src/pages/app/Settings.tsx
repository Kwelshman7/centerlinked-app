import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/app/ImageUploader";
import { Loader2, Wand2, Building2, ShieldCheck, Users, BadgeCheck } from "lucide-react";
import { SuperAdminSettingsCard } from "@/components/app/admin/SuperAdminPanel";
import { SuperAdminSetupAlert } from "@/components/app/admin/SuperAdminSetupAlert";
import { cn } from "@/lib/utils";
import { mergeOrgImages } from "@/lib/org-hero";
import { toast } from "sonner";

export default function Settings() {
  const { profile, user, isFacilityAdmin, isSuperAdmin, needsSuperAdminSetup, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgLogo, setOrgLogo] = useState<string[]>([]);
  const [bdName, setBdName] = useState("");
  const [bdPhone, setBdPhone] = useState("");
  const [bdEmail, setBdEmail] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Branded mini-homepage customization
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#1A73E8");
  const [accentColor, setAccentColor] = useState("#E0EDFF");
  const [orgImages, setOrgImages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [programBadgesText, setProgramBadgesText] = useState("");
  const [ctaPrimary, setCtaPrimary] = useState("");
  const [ctaSecondary, setCtaSecondary] = useState("");
  const [whyRefer, setWhyRefer] = useState<{ title: string; body: string }[]>([]);

  const [orgVerified, setOrgVerified] = useState(false);
  const [facilitiesCount, setFacilitiesCount] = useState(0);
  const [verifiedFacilitiesCount, setVerifiedFacilitiesCount] = useState(0);
  const [payersCount, setPayersCount] = useState(0);
  const [contractsCount, setContractsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setJobTitle(profile.job_title || "");
      setAvatar(profile.avatar_url ? [profile.avatar_url] : []);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.organization_id) return;
    const orgId = profile.organization_id;
    (async () => {
      const { data } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
      if (data) {
        setOrgName(data.name || "");
        setOrgDesc(data.description || "");
        setOrgWebsite(data.website || "");
        setOrgCity(data.hq_city || "");
        setOrgState(data.hq_state || "");
        setOrgLogo(data.logo_url ? [data.logo_url] : []);
        setBdName(data.bd_contact_name || "");
        setBdPhone(data.bd_contact_phone || "");
        setBdEmail(data.bd_contact_email || "");
        setOrgVerified(!!data.verified);
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
          setWhyRefer(wr.filter((x): x is { title: string; body: string } => !!x && typeof x === "object" && "title" in x && "body" in x));
        }
      }
      const { data: fs } = await supabase
        .from("facilities")
        .select("id,verification_status")
        .eq("organization_id", orgId);
      const facList = (fs as Array<{ id: string; verification_status: string }>) ?? [];
      setFacilitiesCount(facList.length);
      setVerifiedFacilitiesCount(facList.filter((x) => x.verification_status === "approved").length);
      if (facList.length > 0) {
        const { data: cs } = await supabase
          .from("insurance_contracts")
          .select("payer_name,in_network")
          .in("facility_id", facList.map((x) => x.id));
        const inNet = ((cs as Array<{ payer_name: string; in_network: boolean }>) ?? []).filter((c) => c.in_network);
        setContractsCount(inNet.length);
        setPayersCount(new Set(inNet.map((c) => c.payer_name)).size);
      }
      const { count: memCount } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      setMembersCount(memCount ?? 0);
    })();
  }, [profile?.organization_id]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, job_title: jobTitle, phone, avatar_url: avatar[0] || null,
    }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    refresh();
  };

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;
    setSavingOrg(true);
    const program_badges = programBadgesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const cleanWhyRefer = whyRefer
      .map((r) => ({ title: r.title.trim(), body: r.body.trim() }))
      .filter((r) => r.title && r.body)
      .slice(0, 4);
    const { error } = await supabase.from("organizations").update({
      name: orgName, description: orgDesc, website: orgWebsite, hq_city: orgCity, hq_state: orgState, logo_url: orgLogo[0] || null,
      bd_contact_name: bdName || null, bd_contact_phone: bdPhone || null, bd_contact_email: bdEmail || null,
      tagline: tagline || null,
      brand_color: brandColor || null,
      accent_color: accentColor || null,
      cover_image_url: orgImages[0] || null,
      image_urls: orgImages,
      announcement: announcement || null,
      program_badges,
      cta_primary_label: ctaPrimary || null,
      cta_secondary_label: ctaSecondary || null,
      why_refer: cleanWhyRefer,
    }).eq("id", profile.organization_id);
    setSavingOrg(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Organization updated");
  };

  const addWhy = () => setWhyRefer((arr) => (arr.length >= 4 ? arr : [...arr, { title: "", body: "" }]));
  const updateWhy = (i: number, field: "title" | "body", v: string) =>
    setWhyRefer((arr) => arr.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  const removeWhy = (i: number) => setWhyRefer((arr) => arr.filter((_, idx) => idx !== i));

  const orgStats = [
    { label: "Facilities", value: facilitiesCount, sub: `${verifiedFacilitiesCount} verified`, icon: Building2 },
    { label: "Insurance Payers", value: payersCount, sub: `${contractsCount} contracts`, icon: ShieldCheck },
    { label: "Team Members", value: membersCount, sub: "active", icon: Users },
    { label: "Status", value: orgVerified ? "Verified" : "Pending", sub: orgVerified ? "trusted partner" : "in review", icon: BadgeCheck },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>

      {needsSuperAdminSetup && <SuperAdminSetupAlert />}

      {isSuperAdmin && <SuperAdminSettingsCard />}

      {profile?.organization_id && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Organization snapshot</h2>
              <p className="text-xs text-muted-foreground">Quick stats and tools for your network.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/app/facilities/upload-pdf">
                <Wand2 className="h-4 w-4" /> Upload PDF
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {orgStats.map((s) => {
              const isText = typeof s.value === "string";
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:px-4 sm:py-3 min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{s.label}</span>
                    <s.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                  </div>
                  <div className="mt-1 min-w-0">
                    <div className={cn("font-bold font-heading text-foreground leading-tight truncate", isText ? "text-base sm:text-lg" : "text-2xl")}>{s.value}</div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Your Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-2"><Label>Avatar</Label><ImageUploader bucket="avatars" value={avatar} onChange={setAvatar} max={1} label="Upload" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="fn">Full name</Label><Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="jt">Job title</Label><Input id="jt" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="ph">Phone</Label><Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={savingProfile}>{savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save profile</Button></div>
        </form>
      </Card>

      {profile?.organization_id && (
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Organization</h2>
          <form onSubmit={saveOrg} className="space-y-4">
            <div className="space-y-2"><Label>Logo</Label><ImageUploader bucket="org-logos" value={orgLogo} onChange={setOrgLogo} max={1} label="Upload" recommendedSize="Recommended: 800×800 px minimum. PNG with transparent background works best. Max 5 MB." /></div>
            <div className="space-y-2"><Label htmlFor="on">Name</Label><Input id="on" value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="od">Description</Label><Textarea id="od" rows={3} value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1"><Label htmlFor="ow">Website</Label><Input id="ow" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="oc">HQ City</Label><Input id="oc" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="os">HQ State</Label><Input id="os" value={orgState} onChange={(e) => setOrgState(e.target.value)} /></div>
            </div>

            <div className="pt-4 border-t border-border/60 space-y-3">
              <div>
                <p className="font-heading font-semibold text-sm">Referral contact</p>
                <p className="text-xs text-muted-foreground">Shown to anyone who opens your shared org page and taps "Get in Touch".</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="bdn">BD rep name</Label><Input id="bdn" value={bdName} onChange={(e) => setBdName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="bdp">BD phone</Label><Input id="bdp" value={bdPhone} onChange={(e) => setBdPhone(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="bde">BD email</Label><Input id="bde" type="email" value={bdEmail} onChange={(e) => setBdEmail(e.target.value)} /></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 space-y-4">
              <div>
                <p className="font-heading font-semibold text-sm">Branded mini-homepage</p>
                <p className="text-xs text-muted-foreground">Customize how your organization profile appears at <code>/o/your-slug</code>.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tg">Tagline</Label>
                <Input id="tg" maxLength={140} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="South Florida detox, residential, and PHP programs." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bc">Brand color</Label>
                  <div className="flex items-center gap-2">
                    <input id="bc" type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer" />
                    <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#1A73E8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac">Accent color</Label>
                  <div className="flex items-center gap-2">
                    <input id="ac" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer" />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#E0EDFF" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Organization photos</Label>
                <p className="text-xs text-muted-foreground">
                  Upload photos for your public org page. Star one as the full-width hero banner.
                </p>
                <ImageUploader
                  bucket="org-logos"
                  value={orgImages}
                  onChange={setOrgImages}
                  max={8}
                  label="Add photo"
                  allowCover
                  coverLabel="Hero"
                  recommendedSize="Recommended: 1920×1080 px (16:9) for hero banners; 1200×900 px or larger for additional photos. JPG or PNG, max 5 MB each."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann">Announcement banner (optional)</Label>
                <Textarea id="ann" rows={2} maxLength={240} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="New PHP program now accepting referrals." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pb">Program badges</Label>
                <Input id="pb" value={programBadgesText} onChange={(e) => setProgramBadgesText(e.target.value)} placeholder="3 South Florida Programs, Detox & Residential, Cigna In-Network" />
                <p className="text-xs text-muted-foreground">Comma-separated. Max 6.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta1">Primary CTA label</Label>
                  <Input id="cta1" value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} placeholder="Contact Admissions" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta2">Secondary CTA label</Label>
                  <Input id="cta2" value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} placeholder="Share Organization" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Why refer to your organization</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addWhy} disabled={whyRefer.length >= 4}>+ Add reason</Button>
                </div>
                {whyRefer.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add up to 4 reasons. If empty, sensible defaults are shown.</p>
                )}
                {whyRefer.map((r, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                    <Input placeholder="Title (e.g. Multiple South Florida Programs)" value={r.title} onChange={(e) => updateWhy(i, "title", e.target.value)} />
                    <Textarea rows={2} placeholder="Short explanation" value={r.body} onChange={(e) => updateWhy(i, "body", e.target.value)} />
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeWhy(i)} className="text-destructive hover:bg-destructive/10">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end"><Button type="submit" disabled={savingOrg}>{savingOrg && <Loader2 className="h-4 w-4 animate-spin" />} Save organization</Button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
