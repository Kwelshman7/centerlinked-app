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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  accountStatusLabel,
  setOrganizationAccountStatus,
  type OrgAccountStatus,
} from "@/lib/org-account-status";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  currentStatus: OrgAccountStatus;
  nextStatus: OrgAccountStatus;
  onDone: () => void;
}

const COPY: Record<OrgAccountStatus, { title: string; body: string }> = {
  active: {
    title: "Restore organization",
    body: "Public pages will return online and members can edit again.",
  },
  suspended: {
    title: "Suspend organization",
    body: "Public referral pages go offline. Members can still sign in but cannot edit until restored.",
  },
  archived: {
    title: "Archive organization",
    body: "Soft-offboards the org: hidden from default lists and public discovery. Data is retained for restore.",
  },
};

export function SetAccountStatusDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
  currentStatus,
  nextStatus,
  onDone,
}: Props) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const copy = COPY[nextStatus];

  const submit = async () => {
    setSaving(true);
    const { error } = await setOrganizationAccountStatus(orgId, nextStatus, reason);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${orgName} → ${accountStatusLabel(nextStatus)}`);
    setReason("");
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {orgName} is currently <strong>{accountStatusLabel(currentStatus)}</strong>. {copy.body}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="account-status-reason">Reason (optional)</Label>
          <Textarea
            id="account-status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Behind on monthly reverification for 2+ months"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={nextStatus === "active" ? "default" : "destructive"}
            onClick={submit}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm {accountStatusLabel(nextStatus).toLowerCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
