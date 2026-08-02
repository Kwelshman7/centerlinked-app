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
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { FacilityCardForm } from "./FacilityCardForm";
import { FacilityDraft, emptyFacility } from "./facility-types";
import { useAuth } from "@/contexts/AuthContext";
import { saveFacilityWithContracts } from "@/lib/save-facility";

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
  hidden_from_org_page?: boolean | null;
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
  /** Enables team-member picker for BD assignment. */
  organizationId?: string | null;
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
    hidden_from_org_page: !!f.hidden_from_org_page,
    contracts: contracts.map((c) => ({
      payer_id: c.payer_id,
      payer_name: c.payer_name,
      in_network: c.in_network,
    })),
  };
}

export function EditFacilityDialog({
  facility,
  contracts,
  onSaved,
  triggerClassName,
  organizationId,
}: Props) {
  const { profile, isFacilityAdmin, isSuperAdmin } = useAuth();
  const canManageVisibility = isFacilityAdmin || isSuperAdmin;
  const orgId = organizationId || profile?.organization_id || null;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FacilityDraft>(() => toDraft(facility, contracts));
  const [saving, setSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(toDraft(facility, contracts));
    setOpen(next);
  };

  const save = async () => {
    if (!orgId) {
      toast.error("Organization is required");
      return;
    }
    setSaving(true);
    try {
      const result = await saveFacilityWithContracts({
        organizationId: orgId,
        facilityId: facility.id,
        draft,
        includeHidden: canManageVisibility,
        contractsMode: "all",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
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
            Update details, photos, visibility on your org profile, levels of care, and insurance
            contracts.
          </DialogDescription>
        </DialogHeader>
        <FacilityCardForm
          value={draft}
          onChange={setDraft}
          organizationId={organizationId}
        />
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
