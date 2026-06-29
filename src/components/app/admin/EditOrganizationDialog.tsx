import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Loader2, Upload, Building2 } from "lucide-react";

export interface OrgEditable {
  id: string;
  name: string;
  email_domain: string | null;
  website: string | null;
  hq_city: string | null;
  hq_state: string | null;
  description: string | null;
  phone: string | null;
  logo_url: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  verified: boolean | null;
}

interface Props {
  org: OrgEditable;
  onSaved: () => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
}

export function EditOrganizationDialog({ org, onSaved, triggerLabel = "Edit organization", triggerVariant = "outline" }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<OrgEditable>(org);

  useEffect(() => {
    if (open) setForm(org);
  }, [open, org]);

  const set = <K extends keyof OrgEditable>(k: K, v: OrgEditable[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${org.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("org-logos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      set("logo_url", data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const patch = {
        name: form.name.trim(),
        email_domain: form.email_domain?.trim() ? form.email_domain.trim().toLowerCase() : null,
        website: form.website?.trim() || null,
        hq_city: form.hq_city?.trim() || null,
        hq_state: form.hq_state?.trim() || null,
        description: form.description?.trim() || null,
        phone: form.phone?.trim() || null,
        logo_url: form.logo_url || null,
        bd_contact_name: form.bd_contact_name?.trim() || null,
        bd_contact_phone: form.bd_contact_phone?.trim() || null,
        bd_contact_email: form.bd_contact_email?.trim() || null,
        verified: !!form.verified,
      };
      const { error } = await supabase.from("organizations").update(patch).eq("id", org.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Organization updated");
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant={triggerVariant} onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> {triggerLabel}
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
          <DialogDescription>Update the organization profile, contact details, and verification status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.logo_url ? "Replace logo" : "Upload logo"}
              </Button>
              {form.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set("logo_url", null)}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email domain</Label>
              <Input value={form.email_domain ?? ""} onChange={(e) => set("email_domain", e.target.value)} placeholder="example.com" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label>HQ city</Label>
              <Input value={form.hq_city ?? ""} onChange={(e) => set("hq_city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>HQ state</Label>
              <Input value={form.hq_state ?? ""} onChange={(e) => set("hq_state", e.target.value)} placeholder="FL" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-4">
            <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">BD contact</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.bd_contact_name ?? ""} onChange={(e) => set("bd_contact_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.bd_contact_phone ?? ""} onChange={(e) => set("bd_contact_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.bd_contact_email ?? ""} onChange={(e) => set("bd_contact_email", e.target.value)} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!form.verified} onCheckedChange={(v) => set("verified", !!v)} />
            <span>Mark as verified</span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
