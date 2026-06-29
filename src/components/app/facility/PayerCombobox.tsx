import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PayerOption {
  id: string;
  name: string;
  category: string;
  status: "approved" | "pending" | "rejected";
  aliases?: string[] | null;
  active?: boolean;
}

interface Props {
  payerId: string | null;
  payerName: string;
  onSelect: (payer: { id: string | null; name: string; pending?: boolean }) => void;
  placeholder?: string;
  triggerClassName?: string;
  keepOpenOnSelect?: boolean;
  /** Hide pending suggestions and the "suggest new" affordance (used in search). */
  approvedOnly?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  national: "National Carriers",
  regional: "Regional / State Plans",
  behavioral: "Behavioral Health Carve-outs",
  government: "Government",
  military: "Military / Veterans",
  tpa: "TPAs & Networks",
  other: "Other",
};

export function PayerCombobox({ payerId, payerName, onSelect, placeholder = "Select payer…", triggerClassName, keepOpenOnSelect = false, approvedOnly = false }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [payers, setPayers] = useState<PayerOption[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("payers")
      .select("id,name,category,status,aliases,active")
      .order("name");
    setPayers((data as PayerOption[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const approved = payers.filter((p) => p.status === "approved" && p.active !== false);
    const myPending = approvedOnly ? [] : payers.filter((p) => p.status === "pending");
    const groups: Record<string, PayerOption[]> = {};
    approved.forEach((p) => {
      const k = p.category || "other";
      (groups[k] ||= []).push(p);
    });
    return { groups, myPending };
  }, [payers]);

  const trimmed = search.trim();
  const exactMatch = payers.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const showSuggest = trimmed.length >= 2 && !exactMatch;

  const suggestNew = async () => {
    if (!user || !trimmed) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("payers")
      .insert({ name: trimmed, category: "other", status: "pending", created_by: user.id })
      .select("id,name,category,status")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payer suggested — pending super admin approval");
    setPayers((p) => [...p, data as PayerOption]);
    onSelect({ id: (data as PayerOption).id, name: (data as PayerOption).name, pending: true });
    if (!keepOpenOnSelect) setOpen(false);
    setSearch("");
  };

  const selectedLabel = payerName || placeholder;
  const selectedIsPending = payerId
    ? payers.find((p) => p.id === payerId)?.status === "pending"
    : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("flex-1 justify-between font-normal", triggerClassName)}
        >
          <span className="truncate flex items-center gap-2">
            {selectedLabel}
            {selectedIsPending && (
              <Badge variant="outline" className="text-[10px] gap-1 border-warning text-warning">
                <Clock className="h-3 w-3" /> pending approval
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,calc(100vw-2rem))] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search insurance payers…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>No matches. Try suggesting it below.</CommandEmpty>

            {Object.entries(grouped.groups)
              .sort(([a], [b]) => (CATEGORY_LABEL[a] || a).localeCompare(CATEGORY_LABEL[b] || b))
              .map(([cat, list]) => (
                <CommandGroup key={cat} heading={CATEGORY_LABEL[cat] || cat}>
                {list.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={[p.name, ...(p.aliases ?? [])].join(" ")}
                      onSelect={() => {
                        onSelect({ id: p.id, name: p.name });
                        if (!keepOpenOnSelect) setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          payerId === p.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

            {grouped.myPending.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Your pending suggestions">
                  {grouped.myPending.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        onSelect({ id: p.id, name: p.name, pending: true });
                        if (!keepOpenOnSelect) setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          payerId === p.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{p.name}</span>
                      <Badge variant="outline" className="text-[10px] border-warning text-warning">
                        pending
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {showSuggest && !approvedOnly && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Don't see your payer?">
                  <CommandItem onSelect={suggestNew} disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Suggest "{trimmed}" — needs super admin approval
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
