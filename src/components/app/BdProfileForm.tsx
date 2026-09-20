import { useEffect, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/app/ImageUploader";
import { connectShareUrl } from "@/lib/professional-network";
import { fullNameFromAuthUser } from "@/lib/auth-user";

type ProfileExtras = {
  phone: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  years_in_bh: number | null;
};

export function BdProfileForm() {
  const { profile, user, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [bio, setBio] = useState("");
  const [yearsInBh, setYearsInBh] = useState("");
  const [avatar, setAvatar] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [extrasHydrated, setExtrasHydrated] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || fullNameFromAuthUser(user) || "");
      setJobTitle(profile.job_title || "");
      setAvatar(profile.avatar_url ? [profile.avatar_url] : []);
    }
    if (!user?.id) return;
    setExtrasHydrated(false);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone, city, state, bio, years_in_bh")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Couldn't load profile details", { description: error.message });
        return;
      }
      if (data) {
        const row = data as ProfileExtras;
        setPhone(row.phone || "");
        setCity(row.city || "");
        setStateCode(row.state || "");
        setBio(row.bio || "");
        setYearsInBh(row.years_in_bh != null ? String(row.years_in_bh) : "");
      }
      setExtrasHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!extrasHydrated) {
      toast.error("Profile details haven't loaded yet");
      return;
    }
    setSaving(true);
    const yearsRaw = yearsInBh.trim();
    const years = yearsRaw === "" ? null : Number(yearsRaw);
    if (years != null && (!Number.isInteger(years) || years < 0 || years > 80)) {
      setSaving(false);
      toast.error("Years in BH must be a whole number from 0 to 80.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: stateCode.trim() || null,
        bio: bio.trim() || null,
        years_in_bh: years,
        avatar_url: avatar[0] || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    await refresh();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label>Avatar</Label>
        <ImageUploader bucket="avatars" value={avatar} onChange={setAvatar} max={1} label="Upload" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bd-fn">Full name</Label>
          <Input id="bd-fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-jt">Job title</Label>
          <Input id="bd-jt" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Director of Business Development" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bd-ph">Phone</Label>
        <Input id="bd-ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bd-ct">City</Label>
          <Input id="bd-ct" value={city} onChange={(e) => setCity(e.target.value)} placeholder="West Palm Beach" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-st">State</Label>
          <Input id="bd-st" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="FL" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bd-years">Years in behavioral health</Label>
        <Input
          id="bd-years"
          type="number"
          min={0}
          max={80}
          inputMode="numeric"
          value={yearsInBh}
          onChange={(e) => setYearsInBh(e.target.value)}
          placeholder="e.g. 8"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bd-bio">About</Label>
        <Textarea
          id="bd-bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Who you work with, what regions you cover, how to reach you."
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        {user ? (
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(connectShareUrl(window.location.origin, user.id));
                toast.success("Connect link copied");
              } catch {
                toast.error("Could not copy link");
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            Copy connect link
          </Button>
        ) : null}
        <Button type="submit" disabled={saving || !extrasHydrated}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
        </Button>
      </div>
    </form>
  );
}
