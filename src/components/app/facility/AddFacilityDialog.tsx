import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { FacilityCardForm } from "./FacilityCardForm";
import { FacilityDraft, emptyFacility } from "./facility-types";

interface Props {
  organizationId: string;
  onCreated: () => void;
  triggerLabel?: string;
  triggerClassName?: string;
}

export function AddFacilityDialog({
  organizationId,
  onCreated,
  triggerLabel = "Add facility",
  triggerClassName,
  triggerVariant = "default",
}: Props & { triggerVariant?: "default" | "outline" }) {
  const { user, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FacilityDraft>(() => emptyFacility());
  const [saving, setSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(emptyFacility());
    setOpen(next);
  };

  const save = async () => {
    if (!user) return;
    if (!draft.name.trim()) {
      toast.error("Facility name is required");
      return;
    }
    setSaving(true);
    try {
      const insert = {
        organization_id: organizationId,
        submitted_by: user.id,
        name: draft.name.trim(),
        tagline: draft.tagline || null,
        address_line1: draft.address_line1 || null,
        city: draft.city || null,
        state: draft.state || null,
        zip: draft.zip || null,
        phone: draft.phone || null,
        website: draft.website || null,
        description: draft.description || null,
        capacity: draft.capacity ? Number(draft.capacity) || null : null,
        levels_of_care: draft.levels_of_care,
        highlights: draft.highlights,
        population_served: draft.population_served,
        specializations: draft.specializations,
        accreditations: draft.accreditations,
        image_urls: draft.image_urls,
        bd_contact_name: draft.bd_contact_name || null,
        bd_contact_phone: draft.bd_contact_phone || null,
        bd_contact_email: draft.bd_contact_email || null,
        verification_status: isSuperAdmin ? ("approved" as const) : ("pending" as const),
      };
      const { data: inserted, error } = await supabase
        .from("facilities")
        .insert(insert)
        .select("id")
        .single();
      if (error || !inserted) {
        toast.error(error?.message ?? "Could not create facility");
        return;
      }
      if (draft.contracts.length > 0) {
        const { error: cErr } = await supabase.from("insurance_contracts").insert(
          draft.contracts.map((c) => ({
            facility_id: inserted.id,
            payer_id: c.payer_id,
            payer_name: c.payer_name,
            in_network: c.in_network,
          })),
        );
        if (cErr) toast.error(`Facility saved but contracts failed: ${cErr.message}`);
      }
      toast.success("Facility added");
      setOpen(false);
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        type="button"
        size="sm"
        variant={triggerVariant}
        className={triggerClassName}
        onClick={() => handleOpen(true)}
      >
        <Plus className="h-4 w-4" /> {triggerLabel}
      </Button>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add facility</DialogTitle>
          <DialogDescription>
            Create a new facility under this organization. You can edit it any time.
          </DialogDescription>
        </DialogHeader>
        <FacilityCardForm value={draft} onChange={setDraft} />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Create facility"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
