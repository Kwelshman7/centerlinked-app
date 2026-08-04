import { supabase } from "@/integrations/supabase/client";
import { verificationState, type VerificationTier } from "@/lib/verification";
import {
  normalizeOrgAccountStatus,
  type OrgAccountStatus,
} from "@/lib/org-account-status";

export type OrgHealth = "on_track" | "due_soon" | "behind";

export interface FacilityFreshnessRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  organization_id: string;
  verification_status: string;
  contracts_verified_at: string | null;
  contracts_verified_by: string | null;
  verification_frozen: boolean;
  preferred_provider: boolean;
  preferred_until: string | null;
  hidden_from_org_page: boolean;
  slug: string | null;
}

export interface OrgOpsRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hq_city: string | null;
  hq_state: string | null;
  verified: boolean;
  email_domain: string | null;
  website: string | null;
  description: string | null;
  phone: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  account_status: OrgAccountStatus;
  account_status_reason: string | null;
  subscription_status: string | null;
  facilityCount: number;
  approvedCount: number;
  freshCount: number;
  recentCount: number;
  staleCount: number;
  frozenCount: number;
  neverCount: number;
  verifiedThisMonthCount: number;
  pctVerifiedThisMonth: number;
  worstTier: VerificationTier;
  health: OrgHealth;
  needsSuspend: boolean;
  lastVerifiedAt: string | null;
  lastVerifiedBy: string | null;
  lastVerifiedByName: string | null;
}

export interface OpsKpis {
  orgsOnTrack: number;
  orgsDueSoon: number;
  orgsBehind: number;
  needsSuspend: number;
  totalActiveOrgs: number;
  facilitiesFrozen: number;
  reverificationsThisMonth: number;
}

export interface ReverificationLogRow {
  id: string;
  created_at: string;
  action: string;
  notes: string | null;
  facility_id: string;
  facility_name: string;
  organization_id: string;
  organization_name: string;
  user_id: string;
  actor_name: string;
  actor_email: string | null;
}

const TIER_RANK: Record<VerificationTier, number> = {
  fresh: 0,
  recent: 1,
  stale: 2,
  never: 3,
  frozen: 4,
};

function worstTier(tiers: VerificationTier[]): VerificationTier {
  if (!tiers.length) return "never";
  return tiers.reduce((worst, tier) => (TIER_RANK[tier] > TIER_RANK[worst] ? tier : worst), "fresh");
}

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function isVerifiedThisMonth(iso: string | null | undefined, startIso: string) {
  if (!iso) return false;
  return new Date(iso).getTime() >= new Date(startIso).getTime();
}

export function computeOrgHealth(input: {
  facilityCount: number;
  worstTier: VerificationTier;
  staleCount: number;
  frozenCount: number;
  neverCount: number;
}): OrgHealth {
  if (input.facilityCount === 0) return "on_track";
  if (input.frozenCount > 0 || input.neverCount > 0 || input.worstTier === "frozen" || input.worstTier === "never") {
    return "behind";
  }
  if (input.staleCount > 0 || input.worstTier === "stale") return "due_soon";
  return "on_track";
}

export async function fetchAdminOpsBundle(referenceDate = new Date()) {
  const { start, end } = monthBounds(referenceDate);

  type OrgRaw = {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    hq_city: string | null;
    hq_state: string | null;
    verified: boolean | null;
    email_domain: string | null;
    website: string | null;
    description: string | null;
    phone: string | null;
    bd_contact_name: string | null;
    bd_contact_phone: string | null;
    bd_contact_email: string | null;
    account_status?: string | null;
    account_status_reason?: string | null;
    subscription_status?: string | null;
  };

  let orgsRaw: OrgRaw[] | null = null;
  {
    const full = await supabase
      .from("organizations")
      .select(
        "id,name,slug,logo_url,hq_city,hq_state,verified,email_domain,website,description,phone,bd_contact_name,bd_contact_phone,bd_contact_email,account_status,account_status_reason,subscription_status",
      )
      .order("name");
    if (full.error?.message?.toLowerCase().includes("account_status")) {
      const fallback = await supabase
        .from("organizations")
        .select(
          "id,name,slug,logo_url,hq_city,hq_state,verified,email_domain,website,description,phone,bd_contact_name,bd_contact_phone,bd_contact_email,subscription_status",
        )
        .order("name");
      if (fallback.error) throw fallback.error;
      orgsRaw = (fallback.data as OrgRaw[]) ?? [];
    } else if (full.error) {
      throw full.error;
    } else {
      orgsRaw = (full.data as OrgRaw[]) ?? [];
    }
  }

  const [{ data: facilitiesRaw, error: facError }, { data: logsRaw, error: logsError }] =
    await Promise.all([
      supabase
        .from("facilities")
        .select(
          "id,name,city,state,organization_id,verification_status,contracts_verified_at,contracts_verified_by,verification_frozen,preferred_provider,preferred_until,hidden_from_org_page,slug",
        )
        .order("name"),
      supabase
        .from("contract_verifications")
        .select("id,created_at,action,notes,facility_id,user_id")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  if (facError) throw facError;
  if (logsError) throw logsError;

  const facilities = (facilitiesRaw as FacilityFreshnessRow[]) ?? [];
  const orgsBase = (orgsRaw ?? []).map((o) => ({
    ...o,
    account_status: normalizeOrgAccountStatus(o.account_status),
  }));

  const verifierIds = Array.from(
    new Set(
      facilities
        .map((f) => f.contracts_verified_by)
        .filter((id): id is string => !!id)
        .concat(((logsRaw as Array<{ user_id: string }>) ?? []).map((l) => l.user_id)),
    ),
  );

  const facilityIds = Array.from(new Set(((logsRaw as Array<{ facility_id: string }>) ?? []).map((l) => l.facility_id)));

  const [{ data: profiles }, { data: logFacilities }] = await Promise.all([
    verifierIds.length
      ? supabase.from("profiles").select("user_id,full_name,email").in("user_id", verifierIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; full_name: string | null; email: string | null }> }),
    facilityIds.length
      ? supabase.from("facilities").select("id,name,organization_id").in("id", facilityIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; organization_id: string }> }),
  ]);

  const profileMap = new Map(
    ((profiles as Array<{ user_id: string; full_name: string | null; email: string | null }>) ?? []).map((p) => [
      p.user_id,
      p,
    ]),
  );
  const facMap = new Map(
    ((logFacilities as Array<{ id: string; name: string; organization_id: string }>) ?? []).map((f) => [f.id, f]),
  );
  const orgNameMap = new Map(orgsBase.map((o) => [o.id, o.name]));

  const byOrg = new Map<string, FacilityFreshnessRow[]>();
  for (const f of facilities) {
    const list = byOrg.get(f.organization_id) ?? [];
    list.push(f);
    byOrg.set(f.organization_id, list);
  }

  const orgs: OrgOpsRow[] = orgsBase.map((o) => {
    const list = byOrg.get(o.id) ?? [];
    const approved = list.filter((f) => f.verification_status === "approved");
    const tiers = approved.map((f) => verificationState(f.contracts_verified_at, f.verification_frozen).tier);
    const counts = { fresh: 0, recent: 0, stale: 0, frozen: 0, never: 0 };
    for (const t of tiers) counts[t] += 1;
    const worst = worstTier(tiers);
    const health = computeOrgHealth({
      facilityCount: approved.length,
      worstTier: worst,
      staleCount: counts.stale,
      frozenCount: counts.frozen,
      neverCount: counts.never,
    });
    const verifiedThisMonthCount = approved.filter((f) =>
      isVerifiedThisMonth(f.contracts_verified_at, start),
    ).length;
    const last = approved
      .filter((f) => f.contracts_verified_at)
      .sort(
        (a, b) =>
          new Date(b.contracts_verified_at!).getTime() - new Date(a.contracts_verified_at!).getTime(),
      )[0];
    const accountStatus = o.account_status;
    const needsSuspend = accountStatus === "active" && health === "behind";

    return {
      id: o.id,
      name: o.name,
      slug: o.slug ?? null,
      logo_url: o.logo_url ?? null,
      hq_city: o.hq_city ?? null,
      hq_state: o.hq_state ?? null,
      verified: !!o.verified,
      email_domain: o.email_domain ?? null,
      website: o.website ?? null,
      description: o.description ?? null,
      phone: o.phone ?? null,
      bd_contact_name: o.bd_contact_name ?? null,
      bd_contact_phone: o.bd_contact_phone ?? null,
      bd_contact_email: o.bd_contact_email ?? null,
      account_status: accountStatus,
      account_status_reason: o.account_status_reason ?? null,
      subscription_status: o.subscription_status ?? null,
      facilityCount: list.length,
      approvedCount: approved.length,
      freshCount: counts.fresh,
      recentCount: counts.recent,
      staleCount: counts.stale,
      frozenCount: counts.frozen,
      neverCount: counts.never,
      verifiedThisMonthCount,
      pctVerifiedThisMonth: approved.length
        ? Math.round((verifiedThisMonthCount / approved.length) * 100)
        : 100,
      worstTier: worst,
      health,
      needsSuspend,
      lastVerifiedAt: last?.contracts_verified_at ?? null,
      lastVerifiedBy: last?.contracts_verified_by ?? null,
      lastVerifiedByName: last?.contracts_verified_by
        ? profileMap.get(last.contracts_verified_by)?.full_name ||
          profileMap.get(last.contracts_verified_by)?.email ||
          "Unknown"
        : null,
    };
  });

  const activeOrgs = orgs.filter((o) => o.account_status === "active");
  const kpis: OpsKpis = {
    orgsOnTrack: activeOrgs.filter((o) => o.health === "on_track").length,
    orgsDueSoon: activeOrgs.filter((o) => o.health === "due_soon").length,
    orgsBehind: activeOrgs.filter((o) => o.health === "behind").length,
    needsSuspend: activeOrgs.filter((o) => o.needsSuspend).length,
    totalActiveOrgs: activeOrgs.length,
    facilitiesFrozen: facilities.filter((f) => f.verification_frozen).length,
    reverificationsThisMonth: ((logsRaw as unknown[]) ?? []).length,
  };

  const logs: ReverificationLogRow[] = ((logsRaw as Array<{
    id: string;
    created_at: string;
    action: string;
    notes: string | null;
    facility_id: string;
    user_id: string;
  }>) ?? []).map((row) => {
    const fac = facMap.get(row.facility_id);
    const actor = profileMap.get(row.user_id);
    const orgId = fac?.organization_id ?? "";
    return {
      id: row.id,
      created_at: row.created_at,
      action: row.action,
      notes: row.notes,
      facility_id: row.facility_id,
      facility_name: fac?.name ?? "Unknown facility",
      organization_id: orgId,
      organization_name: orgNameMap.get(orgId) ?? "Unknown org",
      user_id: row.user_id,
      actor_name: actor?.full_name || actor?.email || "Unknown",
      actor_email: actor?.email ?? null,
    };
  });

  return { orgs, facilities, kpis, logs, monthStart: start, monthEnd: end };
}
