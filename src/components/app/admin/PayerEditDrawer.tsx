import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface PayerEdit {
  id?: string;
  name: string;
  parent_company: string | null;
  aliases: string[];
  category: string;
  notes: string | null;
  active: boolean;
  status: "approved" | "pending" | "rejected";
}

const CATEGORIES = [
  { value: "national", label: "National Carrier" },
  { value: "regional", label: "Regional / State" },
  { value: "behavioral", label: "Behavioral Health" },
  { value: "government", label: "Government" },
  { value: "military", label: "Military / Veterans" },
  { value: "tpa", label: "TPA / Network" },
  { value: "other", label: "Other" },
];

export function PayerEditDrawer({
  open, onOpenChange, payer, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payer: PayerEdit | null;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<PayerEdit | null>(payer);
  const [saving, setSaving] = useState(false);
  const [aliasText, setAliasText] = useState("");

  useEffect(() => {
    setDraft(payer);
    setAliasText(payer?.aliases?.join(", ") ?? "");
  }, [payer]);

  if (!draft) return null;

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    const aliases = aliasText.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: draft.name.trim(),
      parent_company: draft.parent_company?.trim() || null,
      aliases,
      category: draft.category,
      notes: draft.notes?.trim() || null,
      active: draft.active,
      status: draft.status,
    };
    const res = draft.id
      ? await supabase.from("payers").update(payload).eq("id", draft.id)
      : await supabase.from("payers").insert({ ...payload, status: "approved" });
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(draft.id ? "Insurance updated" : "Insurance added");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{draft.id ? "Edit insurance" : "Add insurance"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. UnitedHealthcare" />
          </div>
          <div className="space-y-1.5">
            <Label>Parent company</Label>
            <Input value={draft.parent_company ?? ""} onChange={(e) => setDraft({ ...draft, parent_company: e.target.value })} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Aliases</Label>
            <Input value={aliasText} onChange={(e) => setAliasText(e.target.value)} placeholder="UHC, Optum, United Behavioral Health" />
            <p className="text-[11px] text-muted-foreground">Comma-separated. Used to match search queries to this insurance.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} placeholder="Internal notes (optional)" />
          </div>
          {draft.id && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v: "approved" | "pending" | "rejected") => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive insurance is hidden from search.</p>
            </div>
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
