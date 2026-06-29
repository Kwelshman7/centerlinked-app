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
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { FacilityCardForm } from "./FacilityCardForm";
import { FacilityDraft, emptyFacility } from "./facility-types";

interface FacilityLike {
  id: string;
  name: string;
  tagline: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  capacity: number | null;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations?: string[] | null;
  image_urls: string[];
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
}

interface ExistingContract {
  id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

interface Props {
  facility: FacilityLike;
  contracts: ExistingContract[];
  onSaved: () => void;
  triggerClassName?: string;
}

function toDraft(f: FacilityLike, contracts: ExistingContract[]): FacilityDraft {
  return {
    ...emptyFacility(),
    name: f.name ?? "",
    tagline: f.tagline ?? "",
    address_line1: f.address_line1 ?? "",
    city: f.city ?? "",
    state: f.state ?? "",
    zip: f.zip ?? "",
    phone: f.phone ?? "",
    website: f.website ?? "",
    description: f.description ?? "",
    capacity: f.capacity != null ? String(f.capacity) : "",
    levels_of_care: f.levels_of_care ?? [],
    highlights: f.highlights ?? [],
    population_served: f.population_served ?? [],
    specializations: f.specializations ?? [],
    accreditations: f.accreditations ?? [],
    image_urls: f.image_urls ?? [],
    bd_contact_name: f.bd_contact_name ?? "",
    bd_contact_phone: f.bd_contact_phone ?? "",
    bd_contact_email: f.bd_contact_email ?? "",
    contracts: contracts.map((c) => ({
      payer_id: c.payer_id,
      payer_name: c.payer_name,
      in_network: c.in_network,
    })),
  };
}

export function EditFacilityDialog({ facility, contracts, onSaved, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FacilityDraft>(() => toDraft(facility, contracts));
  const [saving, setSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(toDraft(facility, contracts));
    setOpen(next);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Facility name is required");
      return;
    }
    setSaving(true);
    try {
      const patch = {
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
      };
      const { error: upErr } = await supabase
        .from("facilities")
        .update(patch)
        .eq("id", facility.id);
      if (upErr) {
        toast.error(upErr.message);
        return;
      }

      // Sync contracts: delete removed, insert new
      const existingIds = new Set(contracts.map((c) => `${c.payer_id ?? ""}|${c.payer_name.toLowerCase()}`));
      const draftKeys = new Set(
        draft.contracts.map((c) => `${c.payer_id ?? ""}|${c.payer_name.toLowerCase()}`),
      );

      const toDelete = contracts.filter(
        (c) => !draftKeys.has(`${c.payer_id ?? ""}|${c.payer_name.toLowerCase()}`),
      );
      const toInsert = draft.contracts.filter(
        (c) => !existingIds.has(`${c.payer_id ?? ""}|${c.payer_name.toLowerCase()}`),
      );

      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("insurance_contracts")
          .delete()
          .in(
            "id",
            toDelete.map((c) => c.id),
          );
        if (delErr) {
          toast.error(delErr.message);
          return;
        }
      }
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("insurance_contracts").insert(
          toInsert.map((c) => ({
            facility_id: facility.id,
            payer_id: c.payer_id,
            payer_name: c.payer_name,
            in_network: c.in_network,
          })),
        );
        if (insErr) {
          toast.error(insErr.message);
          return;
        }
      }

      toast.success("Facility updated");
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={triggerClassName}
        onClick={() => handleOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Facility
      </Button>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit facility</DialogTitle>
          <DialogDescription>
            Update details, photos, levels of care, and insurance contracts for this facility.
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
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
