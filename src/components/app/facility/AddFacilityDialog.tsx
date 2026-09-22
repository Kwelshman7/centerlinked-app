import { useRef, useState } from "react";
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
import { bdFieldsFromUser } from "@/lib/bd-contact";
import { fullNameFromAuthUser } from "@/lib/auth-user";

interface Props {
  organizationId: string;
  onCreated: (facilityId?: string) => void;
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
  const { isFacilityAdmin, isSuperAdmin, profile, user } = useAuth();
  const canManageVisibility = isFacilityAdmin || isSuperAdmin;
  const [open, setOpen] = useState(false);
  const draftFromMe = (): FacilityDraft => ({
    ...emptyFacility(),
    ...bdFieldsFromUser({
      full_name: profile?.full_name || fullNameFromAuthUser(user),
      email: profile?.email || user?.email,
    }),
  });
  const [draft, setDraft] = useState<FacilityDraft>(() => emptyFacility());
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(draftFromMe());
    setOpen(next);
  };

  const contractCount = draft.contracts.filter((c) => c.payer_name.trim()).length;

  const save = async () => {
    if (savingRef.current) {
      toast.message("Still saving", {
        description: "Check Facilities before adding this program again.",
      });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    let timedOut = false;
    const fallbackTimer = window.setTimeout(() => {
      timedOut = true;
      setSaving(false);
      toast.error("Taking too long to save that facility", {
        description: "Leave this open — it may still save. Check Facilities before adding it again.",
      });
    }, 20_000);
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
      toast.success("Facility added", {
        description:
          contractCount === 0
            ? "It's pending review. Add in-network insurance from this facility so partners can find who you accept."
            : "It's pending review and stays on your Facilities list. You can add more insurance anytime.",
      });
      setOpen(false);
      onCreated(result.facilityId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that facility");
    } finally {
      window.clearTimeout(fallbackTimer);
      savingRef.current = false;
      if (!timedOut) setSaving(false);
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
            Name is enough to start. Add in-network insurance now, or come back and edit anytime.
          </DialogDescription>
        </DialogHeader>
        <FacilityCardForm
          value={draft}
          onChange={setDraft}
          organizationId={organizationId}
        />
        {contractCount === 0 ? (
          <p className="text-xs text-muted-foreground">
            No in-network insurance yet. Add a payer above so partners can find this program, or create now and edit later.
          </p>
        ) : null}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !draft.name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : contractCount > 0 ? (
              `Create facility · ${contractCount} in-network`
            ) : (
              "Create facility"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
