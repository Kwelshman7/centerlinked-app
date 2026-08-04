import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Snowflake,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminOpsBundle, type OrgOpsRow, type ReverificationLogRow } from "@/lib/admin-ops";
import { VerificationTierBadge } from "@/components/app/search/VerificationBadge";
import { SetAccountStatusDialog } from "@/components/app/admin/SetAccountStatusDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OrgAccountStatus } from "@/lib/org-account-status";

function monthLabel(d = new Date()) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function healthLabel(h: OrgOpsRow["health"]) {
  if (h === "on_track") return "On track";
  if (h === "due_soon") return "Due soon";
  return "Behind";
}

function healthClass(h: OrgOpsRow["health"]) {
  if (h === "on_track") return "bg-success/15 text-success border-success/30";
  if (h === "due_soon") return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

export default function AdminOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [orgs, setOrgs] = useState<OrgOpsRow[]>([]);
  const [logs, setLogs] = useState<ReverificationLogRow[]>([]);
  const [kpis, setKpis] = useState({
    orgsOnTrack: 0,
    orgsDueSoon: 0,
    orgsBehind: 0,
    needsSuspend: 0,
    totalActiveOrgs: 0,
    facilitiesFrozen: 0,
    reverificationsThisMonth: 0,
  });
  const [q, setQ] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | OrgOpsRow["health"] | "needs_suspend">("all");
  const [logQ, setLogQ] = useState("");
  const [statusTarget, setStatusTarget] = useState<{
    org: OrgOpsRow;
    next: OrgAccountStatus;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchAdminOpsBundle();
      setOrgs(bundle.orgs);
      setLogs(bundle.logs);
      setKpis(bundle.kpis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load ops data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runFreezeCheck = async () => {
    setFreezing(true);
    const { data, error } = await supabase.functions.invoke("freeze-stale-contracts");
    setFreezing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const n = (data as { frozen?: number })?.frozen ?? 0;
    toast.success(n === 0 ? "No facilities needed freezing" : `Froze ${n} stale ${n === 1 ? "facility" : "facilities"}`);
    load();
  };

  const activeOrgs = useMemo(() => orgs.filter((o) => o.account_status !== "archived"), [orgs]);

  const filteredOrgs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return activeOrgs
      .filter((o) => {
        if (healthFilter === "needs_suspend") return o.needsSuspend;
        if (healthFilter !== "all" && o.health !== healthFilter) return false;
        if (!term) return true;
        return `${o.name} ${o.hq_city ?? ""} ${o.hq_state ?? ""}`.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        const rank = { behind: 0, due_soon: 1, on_track: 2 } as const;
        return rank[a.health] - rank[b.health] || a.name.localeCompare(b.name);
      });
  }, [activeOrgs, q, healthFilter]);

  const atRisk = useMemo(
    () =>
      activeOrgs
        .filter((o) => o.health !== "on_track")
        .sort((a, b) => {
          if (a.needsSuspend !== b.needsSuspend) return a.needsSuspend ? -1 : 1;
          const rank = { behind: 0, due_soon: 1, on_track: 2 } as const;
          return rank[a.health] - rank[b.health];
        })
        .slice(0, 12),
    [activeOrgs],
  );

  const filteredLogs = useMemo(() => {
    const term = logQ.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      `${l.organization_name} ${l.facility_name} ${l.actor_name} ${l.action}`
        .toLowerCase()
        .includes(term),
    );
  }, [logs, logQ]);

  const kpiCards = [
    {
      label: "On track",
      value: kpis.orgsOnTrack,
      hint: "All facilities fresh/recent",
      icon: CheckCircle2,
      tone: "text-success",
    },
    {
      label: "Due soon",
      value: kpis.orgsDueSoon,
      hint: "Has stale facilities",
      icon: Clock,
      tone: "text-amber-700",
    },
    {
      label: "Behind",
      value: kpis.orgsBehind,
      hint: "Frozen or never verified",
      icon: Snowflake,
      tone: "text-destructive",
    },
    {
      label: "Needs suspend",
      value: kpis.needsSuspend,
      hint: "Behind + still active",
      icon: Ban,
      tone: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-primary" />
            Super admin ops
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Monthly refresh command center</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Track org-level verification health for {monthLabel()}, see who completed refreshes, and
            suspend accounts that fall behind.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/admin/organizations">
              <Building2 className="h-4 w-4" /> Manage orgs
            </Link>
          </Button>
          <Button size="sm" onClick={runFreezeCheck} disabled={freezing || loading}>
            {freezing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Run freeze check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card key={label} className="p-4 border-border/60 bg-card/95">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-3xl font-heading font-bold mt-1 tabular-nums">{value}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
              </div>
              <Icon className={cn("h-5 w-5 shrink-0", tone)} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/60">
        <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Org monthly refresh status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One row per organization · worst facility tier drives health
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter orgs…"
              className="h-9 sm:w-56"
            />
            <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v as typeof healthFilter)}>
              <SelectTrigger className="h-9 sm:w-44">
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All health</SelectItem>
                <SelectItem value="on_track">On track</SelectItem>
                <SelectItem value="due_soon">Due soon</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="needs_suspend">Needs suspend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-auto max-h-[28rem]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 text-xs">Organization</TableHead>
                <TableHead className="h-10 text-xs">Facilities</TableHead>
                <TableHead className="h-10 text-xs">This month</TableHead>
                <TableHead className="h-10 text-xs">Worst tier</TableHead>
                <TableHead className="h-10 text-xs">Health</TableHead>
                <TableHead className="h-10 text-xs">Last by</TableHead>
                <TableHead className="h-10 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No organizations match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((o) => (
                  <TableRow key={o.id} className="text-sm">
                    <TableCell className="py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{o.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {[o.hq_city, o.hq_state].filter(Boolean).join(", ") || "No HQ"}
                          {o.account_status !== "active" ? ` · ${o.account_status}` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 tabular-nums">{o.approvedCount}</TableCell>
                    <TableCell className="py-2.5 tabular-nums">
                      {o.pctVerifiedThisMonth}%
                      <span className="text-[11px] text-muted-foreground ml-1">
                        ({o.verifiedThisMonthCount}/{o.approvedCount || 0})
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <VerificationTierBadge tier={o.worstTier} />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          healthClass(o.health),
                        )}
                      >
                        {healthLabel(o.health)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <p className="truncate max-w-[9rem]">{o.lastVerifiedByName || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.lastVerifiedAt ? new Date(o.lastVerifiedAt).toLocaleDateString() : "Never"}
                      </p>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                          <Link to={`/app/admin/organizations/${o.id}`}>Open</Link>
                        </Button>
                        {o.needsSuspend && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 border-destructive/40 text-destructive"
                            onClick={() => setStatusTarget({ org: o, next: "suspended" })}
                          >
                            Suspend
                          </Button>
                        )}
                        {o.account_status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setStatusTarget({ org: o, next: "active" })}
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 border-border/60 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h2 className="font-heading text-lg font-semibold">At-risk queue</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Orgs sorted worst-first. Suspend when monthly refresh stays behind.
          </p>
          <ul className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : atRisk.length === 0 ? (
              <li className="text-sm text-muted-foreground py-6 text-center">Everyone is on track.</li>
            ) : (
              atRisk.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border border-border/50 px-3 py-2.5 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{o.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          healthClass(o.health),
                        )}
                      >
                        {healthLabel(o.health)}
                      </span>
                      {o.needsSuspend && (
                        <Badge variant="secondary" className="text-[10px]">
                          Needs suspend
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {o.frozenCount} frozen · {o.staleCount} stale
                      </span>
                    </div>
                  </div>
                  {o.needsSuspend ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-destructive/40 text-destructive"
                      onClick={() => setStatusTarget({ org: o, next: "suspended" })}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="ghost" className="shrink-0">
                      <Link to={`/app/admin/organizations/${o.id}`}>Review</Link>
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5 border-border/60 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-lg font-semibold truncate">Monthly reverify log</h2>
            </div>
            <Badge variant="secondary" className="tabular-nums shrink-0">
              {kpis.reverificationsThisMonth}
            </Badge>
          </div>
          <Input
            value={logQ}
            onChange={(e) => setLogQ(e.target.value)}
            placeholder="Filter by org, facility, or actor…"
            className="h-9"
          />
          <div className="max-h-[22rem] overflow-auto space-y-2 pr-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No reverifications logged this month.</p>
            ) : (
              filteredLogs.map((l) => (
                <div key={l.id} className="rounded-lg border border-border/50 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.facility_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {l.organization_name} · {l.actor_name}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {new Date(l.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 text-foreground/80">
                    {l.action.replace(/_/g, " ")}
                    {l.notes ? ` — ${l.notes}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {statusTarget && (
        <SetAccountStatusDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          orgId={statusTarget.org.id}
          orgName={statusTarget.org.name}
          currentStatus={statusTarget.org.account_status}
          nextStatus={statusTarget.next}
          onDone={load}
        />
      )}
    </div>
  );
}
