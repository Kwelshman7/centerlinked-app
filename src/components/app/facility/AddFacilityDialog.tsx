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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { FacilityCardForm } from "./FacilityCardForm";
import { FacilityDraft, emptyFacility } from "./facility-types";
import { saveFacilityWithContracts } from "@/lib/save-facility";

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
  const { isFacilityAdmin, isSuperAdmin } = useAuth();
  const canManageVisibility = isFacilityAdmin || isSuperAdmin;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FacilityDraft>(() => emptyFacility());
  const [saving, setSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(emptyFacility());
    setOpen(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await saveFacilityWithContracts({
        organizationId,
        draft,
        includeHidden: canManageVisibility,
        contractsMode: "all",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
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
              "Create facility"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
