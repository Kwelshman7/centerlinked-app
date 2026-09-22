import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchLaunchImportShareUrl } from "@/lib/transactional-email";
import { formatDistanceToNow } from "@/lib/relative-time";
import { verificationState } from "@/lib/verification";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Inbox,
  Loader2,
  Shield,
  Snowflake,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QueueItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  when: string;
  badge: string;
  tone?: "amber" | "red";
};

type WorkQueue = {
  href: string;
  label: string;
  count: number;
  hint: string;
  showCount?: boolean;
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
  return formatDistanceToNow(date);
}

function orgName(orgs: Map<string, OrgRow>, id: string | null | undefined) {
  if (!id) return "Unknown organization";
  return orgs.get(id)?.name ?? "Unknown organization";
}

function isTestNoise(...parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join(" ");
  if (/walkthrough|\be2e\b|signup\.e2e|example\.com|billing-test|inbox probe|qa\+centerlinked/i.test(text)) {
    return true;
  }
  const name = (parts[0] || "").trim();
  return /^\d{8,}$/.test(name);
}

async function loadOps() {
  const recentCutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    orgsRes,
    profilesRes,
    membersRes,
    leadsRes,
    joinsRes,
    claimsRes,
    facilityIssuesRes,
    payersRes,
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
      .is("organization_id", null)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("organization_members").select("organization_id"),
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
        "id,name,organization_id,verification_status,rejection_reason,verification_frozen,verified_at,contracts_verified_at,created_at,updated_at",
      )
      .or("verification_status.eq.pending,verification_status.eq.rejected,verification_frozen.eq.true")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("payers")
      .select("id,name,status,created_at,rejection_reason")
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.rpc("list_facilities_due_for_verification", { _days: 60 }),
    supabase.from("user_roles").select("user_id").eq("role", "super_admin"),
  ]);

  const orgs = new Map(
    (((orgsRes.data as OrgRow[]) ?? []).map((o) => [o.id, o]) as Array<[string, OrgRow]>),
  );
  const profiles = ((profilesRes.data as SignupRow[]) ?? []);
  const liveOrgIds = new Set<string>(
    ((membersRes.data as Array<{ organization_id: string }> | null) ?? []).map((r) => r.organization_id),
  );
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
  for (const claim of claims.filter((x) => x.status === "approved")) {
    liveOrgIds.add(claim.organization_id);
  }
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
    updated_at: string;
  }>;
  const payers = (payersRes.data ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    rejection_reason: string | null;
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

  const pendingAccess = leads.filter(
    (x) => (x.status || "pending") === "pending" && !isTestNoise(x.full_name, x.email, x.organization),
  );
  const pendingJoins = joins.filter((x) => x.status === "pending" && !isTestNoise(x.email));
  const pendingClaims = claims.filter(
    (x) => x.status === "pending" && !isTestNoise(x.claimant_name, x.claimant_email),
  );
  const pendingFacilities = facilityIssues.filter(
    (x) => x.verification_status === "pending" && !isTestNoise(x.name, orgName(orgs, x.organization_id)),
  );
  const pendingPayers = payers.filter((x) => x.status === "pending" && !isTestNoise(x.name));

  const inbox: QueueItem[] = [];
  for (const r of pendingAccess) {
    inbox.push({
      id: `lead-${r.id}`,
      href: "/app/admin/requests",
      title: r.full_name,
      detail: `${r.email} · ${r.organization}`,
      when: r.created_at,
      badge: "Access",
      tone: "amber",
    });
  }
  for (const r of pendingJoins) {
    inbox.push({
      id: `join-${r.id}`,
      href: "/app/admin/join-requests",
      title: r.email,
      detail: `Join ${orgName(orgs, r.organization_id)} as ${r.role_at_org.replace("_", " ")}`,
      when: r.created_at,
      badge: "Join",
      tone: "amber",
    });
  }
  for (const r of pendingClaims) {
    inbox.push({
      id: `claim-${r.id}`,
      href: "/app/admin/claims",
      title: r.claimant_name,
      detail: `${r.claimant_email} · ${orgName(orgs, r.organization_id)}`,
      when: r.created_at,
      badge: "Claim",
      tone: "amber",
    });
  }
  for (const r of pendingFacilities) {
    inbox.push({
      id: `fac-${r.id}`,
      href: "/app/verifications",
      title: r.name,
      detail: orgName(orgs, r.organization_id),
      when: r.created_at,
      badge: "Facility",
      tone: "amber",
    });
  }
  for (const r of pendingPayers) {
    inbox.push({
      id: `payer-${r.id}`,
      href: "/app/verifications",
      title: r.name,
      detail: "Suggested insurance payer",
      when: r.created_at,
      badge: "Payer",
      tone: "amber",
    });
  }
  inbox.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  const listing: QueueItem[] = [];
  const frozen = facilityIssues.filter(
    (x) =>
      x.verification_frozen &&
      liveOrgIds.has(x.organization_id) &&
      !isTestNoise(x.name, orgName(orgs, x.organization_id)),
  );
  for (const r of frozen) {
    listing.push({
      id: `frozen-${r.id}`,
      href: `/app/facilities/${r.id}/verify`,
      title: r.name,
      detail: `${orgName(orgs, r.organization_id)} · frozen until re-verified`,
      when: r.updated_at || r.contracts_verified_at || r.created_at,
      badge: "Frozen",
      tone: "red",
    });
  }
  let staleCount = 0;
  for (const r of due) {
    if (!liveOrgIds.has(r.organization_id) || isTestNoise(r.facility_name, orgName(orgs, r.organization_id))) continue;
    if (listing.some((p) => p.id === `frozen-${r.facility_id}`)) continue;
    const state = verificationState(r.contracts_verified_at, false);
    if (state.tier !== "stale" && state.tier !== "never") continue;
    staleCount += 1;
    listing.push({
      id: `due-${r.facility_id}`,
      href: `/app/facilities/${r.facility_id}/verify`,
      title: r.facility_name,
      detail: `${orgName(orgs, r.organization_id)} · ${state.label}`,
      when: r.contracts_verified_at || new Date().toISOString(),
      badge: state.tier === "never" ? "Never verified" : "Stale",
      tone: "amber",
    });
  }
  const rejected = facilityIssues.filter(
    (x) =>
      x.verification_status === "rejected" &&
      liveOrgIds.has(x.organization_id) &&
      (x.updated_at || x.created_at) >= recentCutoff &&
      !isTestNoise(x.name),
  );
  for (const r of rejected) {
    listing.push({
      id: `rej-fac-${r.id}`,
      href: `/app/facilities/${r.id}`,
      title: r.name,
      detail: r.rejection_reason || `Rejected · ${orgName(orgs, r.organization_id)}`,
      when: r.updated_at || r.created_at,
      badge: "Rejected",
      tone: "red",
    });
  }
  listing.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  const unverifiedOrgs = [...orgs.values()].filter(
    (x) => !x.verified && liveOrgIds.has(x.id) && !isTestNoise(x.name),
  );

  const needsOrg = profiles.filter(
    (p) => !superAdminIds.has(p.user_id) && !isTestNoise(p.full_name, p.email),
  );

  const errors: string[] = [];
  for (const [label, res] of [
    ["organizations", orgsRes],
    ["profiles", profilesRes],
    ["members", membersRes],
    ["access requests", leadsRes],
    ["join requests", joinsRes],
    ["claims", claimsRes],
    ["facilities", facilityIssuesRes],
    ["payers", payersRes],
    ["due facilities", dueRes],
  ] as const) {
    if (res.error) errors.push(`${label}: ${res.error.message}`);
  }

  const work: WorkQueue[] = [
    {
      href: "/app/admin/requests",
      label: "Access requests",
      count: pendingAccess.length,
      hint: "People asking to join CenterLinked",
    },
    {
      href: "/app/admin/join-requests",
      label: "Join requests",
      count: pendingJoins.length,
      hint: "Work emails waiting on an org",
    },
    {
      href: "/app/admin/claims",
      label: "Org claims",
      count: pendingClaims.length,
      hint: "Someone claiming a listing",
    },
    {
      href: "/app/verifications",
      label: "Facility reviews",
      count: pendingFacilities.length,
      hint: "Programs waiting for approval",
    },
    {
      href: "/app/verifications",
      label: "Payer reviews",
      count: pendingPayers.length,
      hint: "Suggested insurance names",
    },
    {
      href: "/app/admin/join-requests",
      label: "No organization",
      count: needsOrg.length,
      hint: "Signed up, not on a listing yet",
    },
  ];

  const health: WorkQueue[] = [
    {
      href: "/app/verifications",
      label: "Frozen programs",
      count: frozen.length,
      hint: "Hidden from Search until re-verified",
    },
    {
      href: "/app/verifications",
      label: "Stale insurance",
      count: staleCount,
      hint: "Contracts past the verification window",
    },
    {
      href: "/app/admin/organizations",
      label: "Unverified orgs",
      count: unverifiedOrgs.length,
      hint: "Live orgs still marked unverified",
    },
    {
      href: "/app/admin/data-quality",
      label: "Data gaps",
      count: 0,
      hint: "Missing insurance, BD contacts, locations",
      showCount: false,
    },
    {
      href: "/app/admin/insurance-queue",
      label: "Insurance queue",
      count: 0,
      hint: "Fill who accepts what",
      showCount: false,
    },
    {
      href: "/app/admin/bd-queue",
      label: "BD contact queue",
      count: 0,
      hint: "Who to call on a program",
      showCount: false,
    },
  ];

  return {
    orgs,
    inbox,
    listing,
    work,
    health,
    needsOrg,
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
    return <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.slice(0, limit).map((item) => (
        <li key={item.id}>
          <Link
            to={item.href}
            className="flex items-start gap-3 py-2.5 px-1 -mx-1 rounded-md hover:bg-muted/50 transition-colors"
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

function WorkTiles({ items }: { items: WorkQueue[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item) => (
        <Link key={`${item.href}-${item.label}`} to={item.href}>
          <Card
            className={cn(
              "h-full p-3 hover:border-primary/40 transition-colors",
              item.count > 0 && item.showCount !== false && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{item.label}</p>
              {item.showCount !== false ? (
                <p
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    item.count > 0 ? "text-amber-800" : "text-muted-foreground",
                  )}
                >
                  {item.count}
                </p>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{item.hint}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function copyText(value: string, ok: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(ok);
    return true;
  } catch {
    toast.error("Could not copy link");
    return false;
  }
}

export function AdminOverview({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedJoin, setCopiedJoin] = useState(false);
  const [copiedLaunch, setCopiedLaunch] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const joinUrl = "https://www.centerlinked.com/join";

  useEffect(() => {
    fetchLaunchImportShareUrl()
      .then((result) => setLaunchUrl(result.url))
      .catch(() => setLaunchUrl(null));
  }, []);

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

  const openCount = (data?.work.reduce((sum, item) => sum + item.count, 0) ?? 0) + (data?.listing.length ?? 0);
  const inboxLimit = compact ? 6 : 12;
  const listingLimit = compact ? 4 : 8;
  const signupLimit = compact ? 4 : 10;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {openCount > 0
              ? `${openCount} item${openCount === 1 ? "" : "s"} waiting — start with the highlighted queues.`
              : "Nothing in the review queues. Use the listing queues if Search looks thin."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lastOrg && (
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/admin/organizations/${lastOrg.id}`}>Continue {lastOrg.name}</Link>
            </Button>
          )}
          {compact ? (
            <Button asChild size="sm">
              <Link to="/app/admin">Open admin</Link>
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

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading queues…
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

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Review
            </h2>
            <WorkTiles items={data.work} />
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Listing quality
            </h2>
            <WorkTiles items={data.health} />
          </div>

          <div className={cn("grid gap-4", compact ? "" : "lg:grid-cols-2")}>
            <Card className="p-4">
              <h2 className="font-heading font-semibold flex items-center gap-2 mb-1">
                <Inbox className="h-4 w-4 text-primary" /> Needs a decision
              </h2>
              <p className="text-xs text-muted-foreground mb-2">Access, joins, claims, and program reviews.</p>
              <QueueList items={data.inbox} empty="No requests waiting." limit={inboxLimit} />
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-heading font-semibold flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-amber-600" /> Search is at risk
                </h2>
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <Link to="/app/verifications">Verifications</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Frozen or stale programs drop out of insurance-fit Search.
              </p>
              <QueueList
                items={data.listing}
                empty="No frozen or stale programs right now."
                limit={listingLimit}
              />
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> People without an organization
              </h2>
              <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                <Link to="/app/admin/join-requests">Join requests</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              They can already Search. Assign them to a listing if they should manage one.
            </p>
            {data.needsOrg.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Everyone on the list has an organization.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.needsOrg.slice(0, signupLimit).map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/app/admin/join-requests"
                      className="flex items-center gap-3 py-2.5 px-1 -mx-1 rounded-md hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.full_name || p.email || "New user"}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email || "No email"}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {whenLabel(p.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!compact ? (
            <Card className="p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Share</p>
                  <p className="text-xs text-muted-foreground">
                    Join link for BD reps. Launch import is for trusted helpers only.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (await copyText(joinUrl, "Join link copied")) {
                        setCopiedJoin(true);
                        window.setTimeout(() => setCopiedJoin(false), 1800);
                      }
                    }}
                  >
                    {copiedJoin ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedJoin ? "Join copied" : "Copy join link"}
                  </Button>
                  {launchUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (await copyText(launchUrl, "Launch import link copied")) {
                          setCopiedLaunch(true);
                          window.setTimeout(() => setCopiedLaunch(false), 1800);
                        }
                      }}
                    >
                      {copiedLaunch ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedLaunch ? "Import copied" : "Copy import link"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
