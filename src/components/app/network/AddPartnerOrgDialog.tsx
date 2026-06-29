import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search as SearchIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OrgResult {
  id: string;
  name: string;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
}

interface Props {
  excludeIds: Set<string>;
  onAdd: (orgId: string) => Promise<{ error: string | null }>;
}

export function AddPartnerOrgDialog({ excludeIds, onAdd }: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("organizations")
        .select("id,name,logo_url,hq_city,hq_state")
        .order("name")
        .limit(25);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      const { data } = await query;
      const items = ((data as OrgResult[]) ?? []).filter(
        (o) => o.id !== profile?.organization_id && !excludeIds.has(o.id)
      );
      setResults(items);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, excludeIds, profile?.organization_id]);

  const handleAdd = async (orgId: string, name: string) => {
    const { error } = await onAdd(orgId);
    if (error) toast.error(error);
    else toast.success(`${name} added to your network`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add partner</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to your Referral Network</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organizations" className="pl-9" />
        </div>
        <div className="max-h-80 overflow-y-auto -mx-2">
          {loading ? (
            <div className="py-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No matches</p>
          ) : (
            <ul className="space-y-1">
              {results.map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                  <div className="h-10 w-10 rounded-lg border bg-white grid place-items-center overflow-hidden shrink-0">
                    {o.logo_url ? <img src={o.logo_url} alt={o.name} className="w-full h-full object-contain p-1" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{o.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[o.hq_city, o.hq_state].filter(Boolean).join(", ")}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAdd(o.id, o.name)}>Add</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
