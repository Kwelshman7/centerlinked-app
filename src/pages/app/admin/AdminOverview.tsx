import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { verificationState } from "@/lib/verification";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Shield,
  Snowflake,
  UserPlus,
  Users,
  Copy,
  Check,
  Link2,
} from "lucide-react";

type QueueItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  when: string;
  badge: string;
  tone?: "amber" | "red";
};

type HistoryItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  when: string;
  result: string;
  ok: boolean;
};

type SignupRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  organization_id: string | null;
  created_at: string;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  verified: boolean;
  created_at: string;
  email_domain: string | null;
};

function whenLabel(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function orgName(orgs: Map<string, OrgRow>, id: string | null | undefined) {
  if (!id) return "Unknown organization";
  return orgs.get(id)?.name ?? "Unknown organization";
}

async function loadOps() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    orgsRes,
    profilesRes,
    leadsRes,
    joinsRes,
    claimsRes,
    facilityIssuesRes,
    facilityHistoryRes,
    payersRes,
    approvedPayersRes,
    invitesRes,
    verificationsRes,
    dueRes,
    superAdminsRes,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,verified,created_at,email_domain")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,user_id,full_name,email,organization_id,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("early_access_leads")
      .select("id,full_name,email,organization,status,created_at,reviewed_at,notes")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("organization_join_requests")
      .select("id,email,status,role_at_org,created_at,reviewed_at,organization_id")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("organization_claims")
      .select("id,claimant_name,claimant_email,status,created_at,reviewed_at,organization_id")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("facilities")
      .select(
        "id,name,organization_id,verification_status,rejection_reason,verification_frozen,verified_at,contracts_verified_at,created_at",
      )
      .or("verification_status.eq.pending,verification_status.eq.rejected,verification_frozen.eq.true")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("facilities")
      .select("id,name,organization_id,verification_status,verified_at")
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(15),
    supabase
      .from("payers")
      .select("id,name,status,created_at,rejection_reason")
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("payers")
      .select("id,name,status,approved_at")
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(10),
    supabase
      .from("org_invites")
      .select("id,email,status,created_at,accepted_at,organization_id,role_at_org")
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("contract_verifications")
      .select("id,action,created_at,facility_id,notes")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.rpc("list_facilities_due_for_verification", { _days: 60 }),
    supabase.from("user_roles").select("user_id").eq("role", "super_admin"),
  ]);

  const orgs = new Map(
    (((orgsRes.data as OrgRow[]) ?? []).map((o) => [o.id, o]) as Array<[string, OrgRow]>),
  );
  const profiles = ((profilesRes.data as SignupRow[]) ?? []);
  const leads = (leadsRes.data ?? []) as Array<{
    id: string;
    full_name: string;
    email: string;
    organization: string;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    notes: string | null;
  }>;
  const joins = (joinsRes.data ?? []) as Array<{
    id: string;
    email: string;
    status: string;
    role_at_org: string;
    created_at: string;
    reviewed_at: string | null;
    organization_id: string;
  }>;
  const claims = (claimsRes.data ?? []) as Array<{
    id: string;
    claimant_name: string;
    claimant_email: string;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    organization_id: string;
  }>;
  const facilityIssues = (facilityIssuesRes.data ?? []) as Array<{
    id: string;
    name: string;
    organization_id: string;
    verification_status: string;
    rejection_reason: string | null;
    verification_frozen: boolean;
    verified_at: string | null;
    contracts_verified_at: string | null;
    created_at: string;
  }>;
  const facilityHistory = (facilityHistoryRes.data ?? []) as Array<{
    id: string;
    name: string;
    organization_id: string;
    verification_status: string;
    verified_at: string | null;
  }>;
  const payers = (payersRes.data ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    rejection_reason: string | null;
  }>;
  const approvedPayers = (approvedPayersRes.data ?? []) as Array<{
    id: string;
    name: string;
    approved_at: string | null;
  }>;
  const invites = (invitesRes.data ?? []) as Array<{
    id: string;
    email: string;
    status: string;
    created_at: string;
    accepted_at: string | null;
    organization_id: string;
    role_at_org: string;
  }>;
  const stamps = (verificationsRes.data ?? []) as Array<{
    id: string;
    action: string;
    created_at: string;
    facility_id: string;
    notes: string | null;
  }>;
  const due = (dueRes.data ?? []) as Array<{
    facility_id: string;
    facility_name: string;
    organization_id: string;
    contracts_verified_at: string | null;
  }>;
  const superAdminIds = new Set(
    ((superAdminsRes.data as Array<{ user_id: string }> | null) ?? []).map((r) => r.user_id),
  );

  const pending: QueueItem[] = [];
  for (const r of leads.filter((x) => (x.status || "pending") === "pending")) {
    pending.push({
      id: `lead-${r.id}`,
      href: "/app/admin/requests",
      title: r.full_name,
      detail: `${r.email} · ${r.organization}`,
      when: r.created_at,
      badge: "Access request",
      tone: "amber",
    });
  }
  for (const r of joins.filter((x) => x.status === "pending")) {
    pending.push({
      id: `join-${r.id}`,
      href: "/app/admin/join-requests",
      title: r.email,
      detail: `Join ${orgName(orgs, r.organization_id)} as ${r.role_at_org.replace("_", " ")}`,
      when: r.created_at,
      badge: "Join request",
      tone: "amber",
    });
  }
  for (const r of claims.filter((x) => x.status === "pending")) {
    pending.push({
      id: `claim-${r.id}`,
      href: "/app/admin/claims",
      title: r.claimant_name,
      detail: `${r.claimant_email} · claim ${orgName(orgs, r.organization_id)}`,
      when: r.created_at,
      badge: "Org claim",
      tone: "amber",
    });
  }
  for (const r of facilityIssues.filter((x) => x.verification_status === "pending")) {
    pending.push({
      id: `fac-${r.id}`,
      href: "/app/verifications",
      title: r.name,
      detail: orgName(orgs, r.organization_id),
      when: r.created_at,
      badge: "Facility review",
      tone: "amber",
    });
  }
  for (const r of payers.filter((x) => x.status === "pending")) {
    pending.push({
      id: `payer-${r.id}`,
      href: "/app/verifications",
      title: r.name,
      detail: "Suggested insurance payer",
      when: r.created_at,
      badge: "Payer review",
      tone: "amber",
    });
  }
  for (const r of invites.filter((x) => x.status === "pending")) {
    pending.push({
      id: `invite-${r.id}`,
      href: `/app/admin/organizations/${r.organization_id}`,
      title: r.email,
      detail: `Invite to ${orgName(orgs, r.organization_id)} · ${r.role_at_org.replace("_", " ")}`,
      when: r.created_at,
      badge: "Invite outstanding",
    });
  }
  pending.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  const problems: QueueItem[] = [];
  const recentCutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
  for (const p of profiles.filter(
    (x) => !x.organization_id && !superAdminIds.has(x.user_id) && x.created_at >= recentCutoff,
  )) {
    problems.push({
      id: `stuck-${p.id}`,
      href: "/app/admin/join-requests",
      title: p.full_name || p.email || "Signed-up user",
      detail: `${p.email || "No email"} · signed up, no organization yet`,
      when: p.created_at,
      badge: "Stuck in setup",
      tone: "red",
    });
  }
  for (const o of [...orgs.values()].filter((x) => !x.verified && x.created_at >= recentCutoff)) {
    problems.push({
      id: `unverified-${o.id}`,
      href: `/app/admin/organizations/${o.id}`,
      title: o.name,
      detail: o.email_domain ? `Unverified · ${o.email_domain}` : "Organization not verified",
      when: o.created_at,
      badge: "Unverified org",
      tone: "amber",
    });
  }
  for (const r of facilityIssues.filter((x) => x.verification_status === "rejected")) {
    problems.push({
      id: `rej-fac-${r.id}`,
      href: `/app/facilities/${r.id}`,
      title: r.name,
      detail: r.rejection_reason || `Rejected · ${orgName(orgs, r.organization_id)}`,
      when: r.created_at,
      badge: "Facility rejected",
      tone: "red",
    });
  }
  for (const r of facilityIssues.filter((x) => x.verification_frozen)) {
    problems.push({
      id: `frozen-${r.id}`,
      href: `/app/facilities/${r.id}/verify`,
      title: r.name,
      detail: `${orgName(orgs, r.organization_id)} · frozen until re-verified`,
      when: r.contracts_verified_at || r.created_at,
      badge: "Frozen",
      tone: "red",
    });
  }
  for (const r of due) {
    const already =
      problems.some((p) => p.id === `frozen-${r.facility_id}`) ||
      facilityIssues.some((f) => f.id === r.facility_id && f.verification_frozen);
    if (already) continue;
    const state = verificationState(r.contracts_verified_at, false);
    if (state.tier !== "stale" && state.tier !== "never") continue;
    problems.push({
      id: `due-${r.facility_id}`,
      href: `/app/facilities/${r.facility_id}/verify`,
      title: r.facility_name,
      detail: `${orgName(orgs, r.organization_id)} · ${state.label}`,
      when: r.contracts_verified_at || new Date().toISOString(),
      badge: "Stale verification",
      tone: "amber",
    });
  }
  for (const r of leads.filter((x) => x.status === "denied")) {
    problems.push({
      id: `denied-lead-${r.id}`,
      href: "/app/admin/requests",
      title: r.full_name,
      detail: r.notes || `${r.email} · access denied`,
      when: r.reviewed_at || r.created_at,
      badge: "Access denied",
      tone: "red",
    });
  }
  for (const r of payers.filter((x) => x.status === "rejected")) {
    problems.push({
      id: `rej-payer-${r.id}`,
      href: "/app/admin/insurance",
      title: r.name,
      detail: r.rejection_reason || "Payer suggestion rejected",
      when: r.created_at,
      badge: "Payer rejected",
    });
  }
  problems.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  const history: HistoryItem[] = [];
  for (const r of leads.filter((x) => x.reviewed_at)) {
    history.push({
      id: `h-lead-${r.id}`,
      href: "/app/admin/requests",
      title: `${r.full_name} access request`,
      detail: `${r.email} · ${r.organization}`,
      when: r.reviewed_at as string,
      result: r.status,
      ok: r.status === "approved",
    });
  }
  for (const r of joins.filter((x) => x.reviewed_at && x.status !== "pending")) {
    history.push({
      id: `h-join-${r.id}`,
      href: "/app/admin/join-requests",
      title: `Join request · ${r.email}`,
      detail: orgName(orgs, r.organization_id),
      when: r.reviewed_at as string,
      result: r.status,
      ok: r.status === "approved",
    });
  }
  for (const r of claims.filter((x) => x.reviewed_at && x.status !== "pending")) {
    history.push({
      id: `h-claim-${r.id}`,
      href: "/app/admin/claims",
      title: `Claim · ${r.claimant_name}`,
      detail: orgName(orgs, r.organization_id),
      when: r.reviewed_at as string,
      result: r.status,
      ok: r.status === "approved",
    });
  }
  for (const r of facilityHistory) {
    history.push({
      id: `h-fac-${r.id}`,
      href: `/app/facilities/${r.id}`,
      title: r.name,
      detail: `${orgName(orgs, r.organization_id)} · facility ${r.verification_status}`,
      when: r.verified_at as string,
      result: r.verification_status,
      ok: r.verification_status === "approved",
    });
  }
  for (const r of approvedPayers) {
    if (!r.approved_at) continue;
    history.push({
      id: `h-payer-${r.id}`,
      href: "/app/admin/insurance",
      title: r.name,
      detail: "Insurance payer approved",
      when: r.approved_at,
      result: "approved",
      ok: true,
    });
  }
  for (const r of invites.filter((x) => x.status === "accepted" && x.accepted_at)) {
    history.push({
      id: `h-invite-${r.id}`,
      href: `/app/admin/organizations/${r.organization_id}`,
      title: `${r.email} accepted invite`,
      detail: orgName(orgs, r.organization_id),
      when: r.accepted_at as string,
      result: "accepted",
      ok: true,
    });
  }
  for (const r of stamps) {
    history.push({
      id: `h-stamp-${r.id}`,
      href: `/app/facilities/${r.facility_id}/verify`,
      title: `Verification ${r.action}`,
      detail: r.notes || "Contract verification stamp",
      when: r.created_at,
      result: r.action,
      ok: !/reject|fail|deny/i.test(r.action),
    });
  }
  history.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  const signupWeek = profiles.filter((p) => p.created_at >= weekAgo).length;
  const errors: string[] = [];
  for (const [label, res] of [
    ["organizations", orgsRes],
    ["profiles", profilesRes],
    ["access requests", leadsRes],
    ["join requests", joinsRes],
    ["claims", claimsRes],
    ["facilities", facilityIssuesRes],
    ["payers", payersRes],
    ["verification history", verificationsRes],
    ["due facilities", dueRes],
  ] as const) {
    if (res.error) errors.push(`${label}: ${res.error.message}`);
  }
  if (invitesRes.error && !/permission denied for table users/i.test(invitesRes.error.message)) {
    errors.push(`invites: ${invitesRes.error.message}`);
  }

  return {
    orgs,
    profiles,
    pending,
    problems,
    history,
    signupWeek,
    errors,
    lastManagedId:
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("cl_managed_org_id") : null,
  };
}

type OpsData = Awaited<ReturnType<typeof loadOps>>;

function QueueList({
  items,
  empty,
  limit,
}: {
  items: QueueItem[];
  empty: string;
  limit: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.slice(0, limit).map((item) => (
        <li key={item.id}>
          <Link
            to={item.href}
            className="flex items-start gap-3 py-3 px-1 -mx-1 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <Badge
                  variant={item.tone === "red" ? "destructive" : "secondary"}
                  className="text-[10px] whitespace-nowrap"
                >
                  {item.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.detail}</p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {whenLabel(item.when)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminOverview({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedJoin, setCopiedJoin] = useState(false);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : "https://www.centerlinked.com"}/join`;

  const refresh = async () => {
    setLoading(true);
    try {
      setData(await loadOps());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const lastOrg = useMemo(() => {
    if (!data?.lastManagedId) return null;
    return data.orgs.get(data.lastManagedId) ?? null;
  }, [data]);

  const pendingLimit = compact ? 6 : 20;
  const problemLimit = compact ? 5 : 20;
  const historyLimit = compact ? 6 : 25;
  const signupLimit = compact ? 5 : 15;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            {compact ? "Admin snapshot" : "Admin overview"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signups, pending reviews, problems, and the last completed admin work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lastOrg && (
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/admin/organizations/${lastOrg.id}`}>
                Continue {lastOrg.name}
              </Link>
            </Button>
          )}
          {compact ? (
            <Button asChild size="sm">
              <Link to="/app/admin">
                Open full admin <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/app/admin/organizations/new">
                <Building2 className="h-4 w-4" /> New organization
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 sm:p-5 border-primary/20 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="min-w-0">
            <p className="font-heading font-semibold text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary shrink-0" />
              Organization join link
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Send this anywhere. They create an account, add their organization, locations, and in-network contracts.
            </p>
            <p className="text-sm font-medium mt-2 break-all">{joinUrl}</p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(joinUrl);
                setCopiedJoin(true);
                toast.success("Join link copied");
                window.setTimeout(() => setCopiedJoin(false), 1800);
              } catch {
                toast.error("Could not copy link");
              }
            }}
          >
            {copiedJoin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedJoin ? "Copied" : "Copy link"}
          </Button>
        </div>
      </Card>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading admin queues…
        </div>
      ) : data ? (
        <>
          {data.errors.length > 0 && (
            <Card className="p-4 border-amber-500/40 bg-amber-500/10">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Some queues could not load
              </p>
              <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                {data.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Signups · 7 days
              </p>
              <p className="text-2xl font-bold mt-1">{data.signupWeek}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Pending
              </p>
              <p className="text-2xl font-bold mt-1 text-amber-700">{data.pending.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Problems
              </p>
              <p className="text-2xl font-bold mt-1 text-destructive">{data.problems.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recent reviews
              </p>
              <p className="text-2xl font-bold mt-1">{Math.min(data.history.length, historyLimit)}</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="font-heading font-semibold flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" /> Pending
                </h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/admin/requests">Access requests</Link>
                </Button>
              </div>
              <QueueList items={data.pending} empty="Nothing waiting for review." limit={pendingLimit} />
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="font-heading font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Problems
                </h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/verifications">
                    <Snowflake className="h-3.5 w-3.5" /> Verifications
                  </Link>
                </Button>
              </div>
              <QueueList
                items={data.problems}
                empty="No rejected, frozen, or stuck items right now."
                limit={problemLimit}
              />
            </Card>
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Recent signups
              </h2>
            </div>
            {data.profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No profiles yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.profiles.slice(0, signupLimit).map((p) => {
                  const org = p.organization_id ? data.orgs.get(p.organization_id) : null;
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.full_name || p.email || "New user"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.email || "No email"} · {org ? org.name : "No organization"}
                        </p>
                      </div>
                      <Badge variant={org ? "secondary" : "destructive"} className="text-[10px] shrink-0">
                        {org ? "Linked" : "Needs org"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline">
                        {whenLabel(p.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-heading font-semibold flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Review history
            </h2>
            {data.history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No completed reviews yet. Approvals, denials, and verification stamps will show here.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.history.slice(0, historyLimit).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex items-start gap-3 py-3 px-1 -mx-1 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <Badge
                        variant={item.ok ? "secondary" : "destructive"}
                        className="text-[10px] capitalize shrink-0"
                      >
                        {item.result}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline shrink-0">
                        {whenLabel(item.when)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <p className="text-xs text-muted-foreground">
            Pricing-page questions still go to admin@centerlinked.com — they are not stored as in-app
            tickets. Denied access requests, rejected facilities, frozen programs, and users stuck in
            organization setup appear under Problems.
          </p>
        </>
      ) : null}
    </div>
  );
}

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
