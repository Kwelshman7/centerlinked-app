import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckSquare,
  ExternalLink,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { verificationState, type VerificationTier } from "@/lib/verification";
import { VerificationTierBadge } from "@/components/app/search/VerificationBadge";
import { EditFacilityDialog } from "@/components/app/facility/EditFacilityDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface FacilityRow {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  organization_id: string;
  organization_name: string;
  verification_status: "pending" | "approved" | "rejected";
  contracts_verified_at: string | null;
  verification_frozen: boolean;
  preferred_provider: boolean;
  preferred_until: string | null;
  hidden_from_org_page: boolean;
  tagline: string | null;
  address_line1: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  capacity: number | null;
  levels_of_care: string[];
  highlights: string[];
  population_served: string[];
  specializations: string[];
  accreditations: string[] | null;
  image_urls: string[];
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
}

interface ContractRow {
  id: string;
  facility_id: string;
  payer_id: string | null;
  payer_name: string;
  in_network: boolean;
}

type SortKey =
  | "name"
  | "organization_name"
  | "state"
  | "verification_status"
  | "tier"
  | "contracts_verified_at";

const TIER_RANK: Record<VerificationTier, number> = {
  frozen: 0,
  never: 1,
  stale: 2,
  recent: 3,
  fresh: 4,
};

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function AdminFacilitiesTable() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FacilityRow[]>([]);
  const [contractsByFacility, setContractsByFacility] = useState<Map<string, ContractRow[]>>(new Map());
  const [q, setQ] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [frozenOnly, setFrozenOnly] = useState(false);
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("tier");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("facilities")
      .select(
        "id,name,slug,city,state,organization_id,verification_status,contracts_verified_at,verification_frozen,preferred_provider,preferred_until,hidden_from_org_page,tagline,address_line1,zip,phone,website,description,capacity,levels_of_care,highlights,population_served,specializations,accreditations,image_urls,bd_contact_name,bd_contact_phone,bd_contact_email,organizations(name)",
      )
      .order("name")
      .limit(2000);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const list: FacilityRow[] = (
      (data as Array<FacilityRow & { organizations: { name: string } | null }>) ?? []
    ).map((r) => ({
      ...r,
      organization_name: r.organizations?.name ?? "Unknown",
      levels_of_care: r.levels_of_care ?? [],
      highlights: r.highlights ?? [],
      population_served: r.population_served ?? [],
      specializations: r.specializations ?? [],
      image_urls: r.image_urls ?? [],
    }));

    setRows(list);

    const ids = list.map((r) => r.id);
    if (ids.length) {
      const { data: contracts } = await supabase
        .from("insurance_contracts")
        .select("id,facility_id,payer_id,payer_name,in_network")
        .in("facility_id", ids.slice(0, 500));
      const map = new Map<string, ContractRow[]>();
      ((contracts as ContractRow[]) ?? []).forEach((c) => {
        const arr = map.get(c.facility_id) ?? [];
        arr.push(c);
        map.set(c.facility_id, arr);
      });
      setContractsByFacility(map);
    } else {
      setContractsByFacility(new Map());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.organization_id, r.organization_name));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.state) set.add(r.state);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      const tier = verificationState(r.contracts_verified_at, r.verification_frozen).tier;
      if (orgFilter !== "all" && r.organization_id !== orgFilter) return false;
      if (stateFilter !== "all" && (r.state ?? "") !== stateFilter) return false;
      if (approvalFilter !== "all" && r.verification_status !== approvalFilter) return false;
      if (tierFilter !== "all" && tier !== tierFilter) return false;
      if (frozenOnly && !r.verification_frozen) return false;
      if (hiddenOnly && !r.hidden_from_org_page) return false;
      if (!term) return true;
      return `${r.name} ${r.organization_name} ${r.city ?? ""} ${r.state ?? ""}`
        .toLowerCase()
        .includes(term);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const tierA = verificationState(a.contracts_verified_at, a.verification_frozen).tier;
      const tierB = verificationState(b.contracts_verified_at, b.verification_frozen).tier;
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "organization_name":
          cmp = a.organization_name.localeCompare(b.organization_name);
          break;
        case "state":
          cmp = (a.state ?? "").localeCompare(b.state ?? "");
          break;
        case "verification_status":
          cmp = a.verification_status.localeCompare(b.verification_status);
          break;
        case "tier":
          cmp = TIER_RANK[tierA] - TIER_RANK[tierB];
          break;
        case "contracts_verified_at": {
          const ta = a.contracts_verified_at ? new Date(a.contracts_verified_at).getTime() : 0;
          const tb = b.contracts_verified_at ? new Date(b.contracts_verified_at).getTime() : 0;
          cmp = ta - tb;
          break;
        }
      }
      return cmp * dir || a.name.localeCompare(b.name);
    });
  }, [rows, q, orgFilter, stateFilter, approvalFilter, tierFilter, frozenOnly, hiddenOnly, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "tier" ? "asc" : "asc");
    }
  };

  const toggleHidden = async (row: FacilityRow, hidden: boolean) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("facilities")
      .update({ hidden_from_org_page: hidden })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, hidden_from_org_page: hidden } : r)));
    toast.success(hidden ? "Hidden from org page" : "Visible on org page");
  };

  const togglePreferred = async (row: FacilityRow, enabled: boolean) => {
    if (!user) return;
    setSavingId(row.id);
    const { error } = await supabase
      .from("facilities")
      .update({
        preferred_provider: enabled,
        preferred_until: enabled ? row.preferred_until : null,
      })
      .eq("id", row.id);
    if (error) {
      setSavingId(null);
      toast.error(error.message);
      return;
    }
    await supabase.from("preferred_provider_changes").insert({
      facility_id: row.id,
      enabled,
      expires_at: enabled ? row.preferred_until : null,
      set_by: user.id,
    });
    setSavingId(null);
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, preferred_provider: enabled, preferred_until: enabled ? r.preferred_until : null }
          : r,
      ),
    );
    toast.success(enabled ? "Preferred on" : "Preferred off");
  };

  const SortHead = ({
    label,
    column,
    className,
  }: {
    label: string;
    column: SortKey;
    className?: string;
  }) => (
    <TableHead className={cn("h-9 px-2 text-[11px] whitespace-nowrap", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => toggleSort(column)}
      >
        {label}
        <SortIcon active={sortKey === column} dir={sortDir} />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <Card className="p-3 sm:p-4 space-y-3 border-border/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facilities, orgs, city…"
            className="pl-9 h-10"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orgs</SelectItem>
              {orgOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {stateOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Refresh status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All refresh tiers</SelectItem>
              <SelectItem value="fresh">Fresh</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="stale">Stale</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setFrozenOnly((v) => !v)}
            className={cn(
              "h-9 rounded-md border px-3 text-xs font-medium text-left",
              frozenOnly ? "border-primary/40 bg-primary/5 text-primary" : "border-border",
            )}
          >
            Frozen only
          </button>
          <button
            type="button"
            onClick={() => setHiddenOnly((v) => !v)}
            className={cn(
              "h-9 rounded-md border px-3 text-xs font-medium text-left",
              hiddenOnly ? "border-primary/40 bg-primary/5 text-primary" : "border-border",
            )}
          >
            Hidden only
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {loading ? "Loading…" : `${filtered.length} facilities`} · Color status = monthly reverify tier
        </p>
      </Card>

      <Card className="overflow-hidden border-border/60">
        <div className="overflow-auto max-h-[70vh]">
          <Table className="min-w-[1100px]">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="hover:bg-transparent">
                <SortHead label="Facility" column="name" />
                <SortHead label="Organization" column="organization_name" />
                <SortHead label="Location" column="state" />
                <SortHead label="Approval" column="verification_status" />
                <SortHead label="Monthly reverify" column="tier" />
                <SortHead label="Last verified" column="contracts_verified_at" />
                <TableHead className="h-9 px-2 text-[11px]">Hidden</TableHead>
                <TableHead className="h-9 px-2 text-[11px]">Preferred</TableHead>
                <TableHead className="h-9 px-2 text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                    No facilities match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => {
                  const state = verificationState(r.contracts_verified_at, r.verification_frozen);
                  const busy = savingId === r.id;
                  return (
                    <TableRow
                      key={r.id}
                      className={cn("text-[13px]", idx % 2 === 1 && "bg-muted/20")}
                    >
                      <TableCell className="py-2 px-2 max-w-[14rem]">
                        <p className="font-medium truncate">{r.name}</p>
                      </TableCell>
                      <TableCell className="py-2 px-2 max-w-[12rem]">
                        <Link
                          to={`/app/admin/organizations/${r.organization_id}?tab=facilities`}
                          className="truncate block text-primary hover:underline"
                        >
                          {r.organization_name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap text-muted-foreground">
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                            r.verification_status === "approved" &&
                              "bg-success/15 text-success border-success/30",
                            r.verification_status === "pending" &&
                              "bg-amber-500/15 text-amber-700 border-amber-500/30",
                            r.verification_status === "rejected" &&
                              "bg-destructive/15 text-destructive border-destructive/30",
                          )}
                        >
                          {r.verification_status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <VerificationTierBadge tier={state.tier} label={state.label} />
                      </TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap text-muted-foreground tabular-nums">
                        {r.contracts_verified_at
                          ? new Date(r.contracts_verified_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Switch
                          checked={r.hidden_from_org_page}
                          disabled={busy}
                          onCheckedChange={(v) => toggleHidden(r, v)}
                          aria-label="Hidden from org page"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="inline-flex items-center gap-1.5">
                          <Switch
                            checked={r.preferred_provider}
                            disabled={busy}
                            onCheckedChange={(v) => togglePreferred(r, v)}
                            aria-label="Preferred provider"
                          />
                          {r.preferred_provider && <Star className="h-3.5 w-3.5 text-amber-500" />}
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <EditFacilityDialog
                            facility={r}
                            contracts={contractsByFacility.get(r.id) ?? []}
                            organizationId={r.organization_id}
                            onSaved={load}
                            triggerClassName="h-8 px-2"
                          />
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                            <Link to={`/app/facilities/${r.id}/verify`} title="Verify contracts">
                              <CheckSquare className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                            <Link to={`/app/facilities/${r.id}`} title="Open facility">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
