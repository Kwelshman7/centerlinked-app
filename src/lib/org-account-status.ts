import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OrgAccountStatus = Database["public"]["Enums"]["org_account_status"];

export const ORG_ACCOUNT_STATUSES: OrgAccountStatus[] = ["active", "suspended", "archived"];

export function normalizeOrgAccountStatus(
  value: string | null | undefined,
): OrgAccountStatus {
  if (value === "suspended" || value === "archived" || value === "active") return value;
  return "active";
}

export function isOrgPubliclyActive(status: OrgAccountStatus | null | undefined) {
  return normalizeOrgAccountStatus(status) === "active";
}

export async function setOrganizationAccountStatus(
  orgId: string,
  status: OrgAccountStatus,
  reason?: string | null,
) {
  return supabase.rpc("admin_set_organization_account_status", {
    _org_id: orgId,
    _status: status,
    _reason: reason?.trim() || null,
  });
}

export function accountStatusLabel(status: OrgAccountStatus) {
  switch (status) {
    case "suspended":
      return "Suspended";
    case "archived":
      return "Archived";
    default:
      return "Active";
  }
}
