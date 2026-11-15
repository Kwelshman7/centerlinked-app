import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Check, X, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const CATEGORY_LABEL: Record<string, string> = {
  national: "National",
  regional: "Regional",
  behavioral: "Behavioral",
  government: "Government",
  military: "Military",
  tpa: "TPA",
  other: "Other",
};

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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link to="/app/admin/insurance-queue">Insurance queue</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/normalization">Canonical names</Link>
          </Button>
          <Button onClick={() => { setEditing(emptyDraft()); setDrawerOpen(true); }}>
            <Plus className="h-4 w-4" /> Add insurance
          </Button>
        </div>
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

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "company" : "companies"}
        {rows && filtered.length !== rows.length ? ` of ${rows.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No insurance matches your filters.</Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Name</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Parent</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Category</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Aliases</TableHead>
                <TableHead className="h-9 px-3 text-xs font-semibold uppercase tracking-[0.06em]">Status</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs font-semibold uppercase tracking-[0.06em]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-3 py-2 font-medium">{p.name}</TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground">{p.parent_company || "—"}</TableCell>
                  <TableCell className="px-3 py-2">{CATEGORY_LABEL[p.category] ?? p.category}</TableCell>
                  <TableCell className="max-w-[240px] px-3 py-2">
                    {p.aliases.length > 0 ? (
                      <span className="line-clamp-2 text-muted-foreground">{p.aliases.join(", ")}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.status === "pending" && <Badge variant="outline" className="border-warning text-warning text-[10px]">Pending</Badge>}
                      {p.status === "rejected" && <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Rejected</Badge>}
                      {p.status === "approved" && <Badge variant="secondary" className="text-[10px]">Approved</Badge>}
                      {!p.active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-1.5">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <PayerEditDrawer open={drawerOpen} onOpenChange={setDrawerOpen} payer={editing} onSaved={load} />
    </div>
  );
}
