import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, Upload } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.string().trim().min(1, "Your role is required").max(120),
  notes: z.string().trim().max(1500).optional().or(z.literal("")),
});

interface Props {
  organizationId: string;
  organizationName: string;
}

export function ClaimOrganizationDialog({ organizationId, organizationName }: Props) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: profile?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    role: "",
    notes: "",
  });

  const reset = () => {
    setFile(null);
    setForm({
      name: profile?.full_name ?? "",
      email: user?.email ?? "",
      phone: "",
      role: "",
      notes: "",
    });
  };

  const onSubmit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please fix the form");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Proof file must be under 10MB");
      return;
    }

    setSubmitting(true);
    try {
      let proof_url: string | null = null;
      if (file) {
        if (!user?.id) {
          toast.error("Please sign in to attach a proof file, or submit without an attachment.");
          setSubmitting(false);
          return;
        }
        const ext = file.name.split(".").pop() || "bin";
        // Path must start with the uploader's user id to satisfy storage RLS
        const path = `${user.id}/${organizationId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("claim-proofs")
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) throw upErr;
        proof_url = path;
      }

      const { error } = await supabase.from("organization_claims").insert({
        organization_id: organizationId,
        claimant_user_id: user?.id ?? null,
        claimant_name: parsed.data.name,
        claimant_email: parsed.data.email,
        claimant_phone: parsed.data.phone || null,
        claimant_role: parsed.data.role,
        notes: parsed.data.notes || null,
        proof_url,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Claim submitted. Our team will review it shortly.");
      setOpen(false);
      reset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not submit claim";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" /> Claim this organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim {organizationName}</DialogTitle>
          <DialogDescription>
            Submit proof of ownership and our team will verify your request before granting access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="claim-name">Full name *</Label>
              <Input id="claim-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-email">Work email *</Label>
              <Input id="claim-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="claim-role">Your role at the org *</Label>
              <Input id="claim-role" placeholder="e.g. CEO, BD Director" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-phone">Phone (optional)</Label>
              <Input id="claim-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-proof">Proof of ownership</Label>
            <div className="flex items-center gap-2">
              <Input
                id="claim-proof"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Business license, letterhead, or screenshot of your admin dashboard on the org's website. PDF or image, up to 10MB.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-notes">Anything else? (optional)</Label>
            <Textarea
              id="claim-notes"
              rows={3}
              placeholder="Website, LinkedIn, or context that helps us verify."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting} className="gap-2">
            <Upload className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
