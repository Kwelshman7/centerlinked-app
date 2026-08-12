import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Archive,
  BadgeCheck,
  Ban,
  Building2,
  ExternalLink,
  Plus,
  RotateCcw,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminOpsBundle, type OrgOpsRow } from "@/lib/admin-ops";
import { accountStatusLabel, type OrgAccountStatus } from "@/lib/org-account-status";
import { VerificationTierBadge } from "@/components/app/search/VerificationBadge";
import { EditOrganizationDialog } from "@/components/app/admin/EditOrganizationDialog";
import { SetAccountStatusDialog } from "@/components/app/admin/SetAccountStatusDialog";
import { AdminFacilitiesTable } from "@/components/app/admin/AdminFacilitiesTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function statusTone(status: OrgAccountStatus) {
  if (status === "suspended") return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  if (status === "archived") return "bg-muted text-muted-foreground border-border";
  return "bg-success/15 text-success border-success/30";
}

export default function AdminOrganizations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "facilities" ? "facilities" : "organizations";
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgOpsRow[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrgAccountStatus | "hide_archived">("hide_archived");
  const [healthFilter, setHealthFilter] = useState<"all" | OrgOpsRow["health"]>("all");
  const [statusTarget, setStatusTarget] = useState<{
    org: OrgOpsRow;
    next: OrgAccountStatus;
  } | null>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchAdminOpsBundle();
      setOrgs(bundle.orgs);
    } catch (e) {
      // Fallback if account_status columns are not migrated yet
      const { data, error } = await supabase
        .from("organizations")
        .select(
          "id,name,slug,logo_url,hq_city,hq_state,verified,email_domain,website,description,phone,bd_contact_name,bd_contact_phone,bd_contact_email",
        )
        .order("name");
      if (error) toast.error(error.message);
      else {
        setOrgs(
          ((data as Array<Record<string, unknown>>) ?? []).map((o) => ({
            id: o.id as string,
            name: o.name as string,
            slug: (o.slug as string | null) ?? null,
            logo_url: (o.logo_url as string | null) ?? null,
            hq_city: (o.hq_city as string | null) ?? null,
            hq_state: (o.hq_state as string | null) ?? null,
            verified: !!(o.verified as boolean | null),
            email_domain: (o.email_domain as string | null) ?? null,
            website: (o.website as string | null) ?? null,
            description: (o.description as string | null) ?? null,
            phone: (o.phone as string | null) ?? null,
            bd_contact_name: (o.bd_contact_name as string | null) ?? null,
            bd_contact_phone: (o.bd_contact_phone as string | null) ?? null,
            bd_contact_email: (o.bd_contact_email as string | null) ?? null,
            account_status: "active" as const,
            account_status_reason: null,
            subscription_status: null,
            facilityCount: 0,
            approvedCount: 0,
            freshCount: 0,
            recentCount: 0,
            staleCount: 0,
            frozenCount: 0,
            neverCount: 0,
            verifiedThisMonthCount: 0,
            pctVerifiedThisMonth: 100,
            worstTier: "never" as const,
            health: "on_track" as const,
            needsSuspend: false,
            lastVerifiedAt: null,
            lastVerifiedBy: null,
            lastVerifiedByName: null,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orgs.filter((o) => {
      if (statusFilter === "hide_archived" && o.account_status === "archived") return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "hide_archived" &&
        o.account_status !== statusFilter
      ) {
        return false;
      }
      if (healthFilter !== "all" && o.health !== healthFilter) return false;
      if (!term) return true;
      return `${o.name} ${o.hq_city ?? ""} ${o.hq_state ?? ""} ${o.email_domain ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [orgs, q, statusFilter, healthFilter]);

  const setTab = (next: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next === "organizations") p.delete("tab");
      else p.set("tab", next);
      return p;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> Manage organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compact org directory with account lifecycle controls, plus a facilities spreadsheet for
            fast filtering and quick edits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/admin/ops">Ops dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/app/admin/organizations/new">
              <Plus className="h-4 w-4" /> New organization
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-3 mt-4">
          <Card className="p-3 sm:p-4 space-y-3 border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, location, or domain…"
                className="pl-9 h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Account status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hide_archived">Hide archived</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={healthFilter}
                onValueChange={(v) => setHealthFilter(v as typeof healthFilter)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Refresh health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All refresh health</SelectItem>
                  <SelectItem value="on_track">On track</SelectItem>
                  <SelectItem value="due_soon">Due soon</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="overflow-hidden border-border/60">
            <div className="overflow-auto max-h-[70vh]">
              <Table className="min-w-[980px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-xs">Organization</TableHead>
                    <TableHead className="h-9 text-xs">HQ</TableHead>
                    <TableHead className="h-9 text-xs">Facilities</TableHead>
                    <TableHead className="h-9 text-xs">Account</TableHead>
                    <TableHead className="h-9 text-xs">Monthly reverify</TableHead>
                    <TableHead className="h-9 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((o, idx) => (
                      <TableRow key={o.id} className={cn("text-sm", idx % 2 === 1 && "bg-muted/20")}>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-md bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {o.logo_url ? (
                                <img src={o.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium truncate">{o.name}</p>
                                {o.verified && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    <BadgeCheck className="h-3 w-3 text-success" /> Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {o.email_domain || "No domain"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                          {[o.hq_city, o.hq_state].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="py-2.5 tabular-nums">{o.facilityCount}</TableCell>
                        <TableCell className="py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              statusTone(o.account_status),
                            )}
                          >
                            {accountStatusLabel(o.account_status)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <VerificationTierBadge tier={o.worstTier} />
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                            {o.slug && (
                              <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                                <Link to={`/o/${o.slug}`} target="_blank">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                            <EditOrganizationDialog org={o} onSaved={loadOrgs} triggerLabel="Edit" />
                            <Button asChild size="sm" className="h-8">
                              <Link to={`/app/admin/organizations/${o.id}`}>
                                <Settings className="h-3.5 w-3.5" /> Manage
                              </Link>
                            </Button>
                            {o.account_status === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  title="Suspend"
                                  onClick={() => setStatusTarget({ org: o, next: "suspended" })}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  title="Archive"
                                  onClick={() => setStatusTarget({ org: o, next: "archived" })}
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {o.account_status !== "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                title="Restore to active"
                                onClick={() => setStatusTarget({ org: o, next: "active" })}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
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
        </TabsContent>

        <TabsContent value="facilities" className="mt-4">
          <AdminFacilitiesTable />
        </TabsContent>
      </Tabs>

      {statusTarget && (
        <SetAccountStatusDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          orgId={statusTarget.org.id}
          orgName={statusTarget.org.name}
          currentStatus={statusTarget.org.account_status}
          nextStatus={statusTarget.next}
          onDone={loadOrgs}
        />
      )}
    </div>
  );
}
