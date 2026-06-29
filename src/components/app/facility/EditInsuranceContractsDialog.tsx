import { useState } from "react";
import { Pencil, X, Loader2, ShieldCheck, Trash2 } from "lucide-react";
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
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";

export interface EditableContract {
  id?: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
  pending?: boolean;
  _markedForDelete?: boolean;
  _isNew?: boolean;
}

interface Props {
  facilityId: string;
  contracts: EditableContract[];
  onSaved: () => void;
  triggerClassName?: string;
}

export function EditInsuranceContractsDialog({
  facilityId,
  contracts,
  onSaved,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<EditableContract[]>([]);
  const [saving, setSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) {
      setList(
        contracts
          .filter((c) => c.in_network)
          .map((c) => ({ ...c, _markedForDelete: false })),
      );
    }
    setOpen(next);
  };

  const addContract = (payer: { id: string | null; name: string; pending?: boolean }) => {
    const name = payer.name.trim();
    if (!name) return;
    const exists = list.some((c) => {
      if (c._markedForDelete) return false;
      if (payer.id && c.payer_id === payer.id) return true;
      return c.payer_name.trim().toLowerCase() === name.toLowerCase();
    });
    if (exists) {
      toast.info(`${name} is already in the list`);
      return;
    }
    setList((prev) => [
      ...prev,
      {
        payer_id: payer.id,
        payer_name: name,
        in_network: true,
        pending: payer.pending,
        _isNew: true,
      },
    ]);
  };

  const toggleRemove = (idx: number) => {
    setList((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, _markedForDelete: !c._markedForDelete } : c)),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const toDeleteIds = list
        .filter((c) => c.id && c._markedForDelete)
        .map((c) => c.id as string);
      const toInsert = list
        .filter((c) => c._isNew && !c._markedForDelete)
        .map((c) => ({
          facility_id: facilityId,
          payer_id: c.payer_id,
          payer_name: c.payer_name,
          in_network: true,
        }));

      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .from("insurance_contracts")
          .delete()
          .in("id", toDeleteIds);
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from("insurance_contracts").insert(toInsert);
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      toast.success("In-network contracts updated");
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
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit in-network contracts</DialogTitle>
          <DialogDescription>
            Add or remove insurance companies this facility is in-network with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Add an insurance company
            </label>
            <PayerCombobox
              payerId={null}
              payerName=""
              onSelect={addContract}
              placeholder="Search payers…"
              keepOpenOnSelect
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              In-network with ({list.filter((c) => !c._markedForDelete).length})
            </p>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
                No contracts yet — add one above.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {list.map((c, i) => (
                  <div
                    key={c.id ?? `new-${i}`}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      c._markedForDelete
                        ? "border-destructive/40 bg-destructive/5 line-through text-muted-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                    <span className="flex-1 truncate font-medium">{c.payer_name}</span>
                    {c.pending && (
                      <span className="text-[10px] font-semibold uppercase text-amber-600">
                        pending
                      </span>
                    )}
                    {c._isNew && !c._markedForDelete && (
                      <span className="text-[10px] font-semibold uppercase text-primary">new</span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => toggleRemove(i)}
                      aria-label={c._markedForDelete ? "Undo remove" : "Remove"}
                    >
                      {c._markedForDelete ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
