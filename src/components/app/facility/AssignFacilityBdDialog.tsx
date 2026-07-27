import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { FacilityBdRepFields, BdContactValue } from "./FacilityBdRepFields";

interface Props {
  facilityId: string;
  facilityName: string;
  organizationId: string;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  onSaved: () => void;
  /** Compact trigger for dashboard rows. */
  triggerVariant?: "default" | "outline" | "ghost";
  triggerLabel?: string;
  triggerClassName?: string;
}

export function AssignFacilityBdDialog({
  facilityId,
  facilityName,
  organizationId,
  bd_contact_name,
  bd_contact_phone,
  bd_contact_email,
  onSaved,
  triggerVariant = "outline",
  triggerLabel,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<BdContactValue>({
    bd_contact_name: "",
    bd_contact_phone: "",
    bd_contact_email: "",
  });

  const handleOpen = (next: boolean) => {
    if (next) {
      setValue({
        bd_contact_name: bd_contact_name ?? "",
        bd_contact_phone: bd_contact_phone ?? "",
        bd_contact_email: bd_contact_email ?? "",
      });
    }
    setOpen(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("facilities")
        .update({
          bd_contact_name: value.bd_contact_name.trim() || null,
          bd_contact_phone: value.bd_contact_phone.trim() || null,
          bd_contact_email: value.bd_contact_email.trim() || null,
        })
        .eq("id", facilityId);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        value.bd_contact_name.trim()
          ? `BD rep assigned to ${facilityName}`
          : `BD rep cleared for ${facilityName}`,
      );
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const label =
    triggerLabel ??
    (bd_contact_name?.trim() ? "Change BD" : "Assign BD");

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        type="button"
        size="sm"
        variant={triggerVariant}
        className={triggerClassName}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpen(true);
        }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {label}
      </Button>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Assign BD rep</DialogTitle>
          <DialogDescription>
            Choose who appears on the public referral card for {facilityName}.
          </DialogDescription>
        </DialogHeader>
        <FacilityBdRepFields
          organizationId={organizationId}
          value={value}
          onChange={setValue}
          className="border-0 bg-transparent p-0"
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
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
