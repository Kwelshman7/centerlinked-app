import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Check, X, Pencil } from "lucide-react";
import { PayerEditDrawer, PayerEdit } from "@/components/app/admin/PayerEditDrawer";
import { toast } from "sonner";

interface PayerRow {
  id: string;
  name: string;
  parent_company: string | null;
  aliases: string[];
  category: string;
  notes: string | null;
  active: boolean;
  status: "approved" | "pending" | "rejected";
}

const emptyDraft = (): PayerEdit => ({
  name: "", parent_company: null, aliases: [], category: "other",
  notes: null, active: true, status: "approved",
});

export default function InsuranceDatabase() {
  const { isSuperAdmin, loading } = useAuth();
  const [rows, setRows] = useState<PayerRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PayerEdit | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("payers")
      .select("id,name,parent_company,aliases,category,notes,active,status")
      .order("status", { ascending: true })
      .order("name");
    setRows((data as PayerRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.parent_company ?? "").toLowerCase().includes(q) ||
        r.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [rows, search, statusFilter]);

  const quickAction = async (id: string, patch: Partial<PayerRow>) => {
    const { error } = await supabase.from("payers").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    load();
  };

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const pendingCount = rows?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance Database</h1>
          <p className="text-sm text-muted-foreground">Master list of insurance carriers used across search and contracts.</p>
        </div>
        <Button onClick={() => { setEditing(emptyDraft()); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4" /> Add insurance
        </Button>
      </div>

      {pendingCount > 0 && (
        <Card className="p-3 sm:p-4 border-warning/40 bg-warning/5">
          <p className="text-sm">
            <span className="font-medium">{pendingCount}</span> user-submitted {pendingCount === 1 ? "suggestion" : "suggestions"} awaiting review.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, parent, or alias…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v: typeof statusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No insurance matches your filters.</Card>
        )}
        {filtered.map((p) => (
          <Card key={p.id} className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{p.name}</p>
                  {p.status === "pending" && <Badge variant="outline" className="border-warning text-warning text-[10px]">Pending</Badge>}
                  {p.status === "rejected" && <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Rejected</Badge>}
                  {!p.active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                </div>
                {p.parent_company && (
                  <p className="text-xs text-muted-foreground mt-0.5">Parent: {p.parent_company}</p>
                )}
                {p.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.aliases.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px] font-normal">{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                {p.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" className="border-success text-success hover:bg-success/10" onClick={() => quickAction(p.id, { status: "approved" })}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => quickAction(p.id, { status: "rejected" })}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => { setEditing({ ...p }); setDrawerOpen(true); }}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PayerEditDrawer open={drawerOpen} onOpenChange={setDrawerOpen} payer={editing} onSaved={load} />
    </div>
  );
}
