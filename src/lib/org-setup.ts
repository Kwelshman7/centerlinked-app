import { supabase } from "@/integrations/supabase/client";

export type MatchingOrg = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  verified: boolean;
  email_domain: string | null;
  has_admin: boolean;
};

export type PendingJoinRequest = {
  id: string;
  organization_id: string;
  status: string;
  created_at: string;
  organization_name: string | null;
};

export type OrgSetupOptions = {
  email: string;
  email_domain: string;
  matching_org: MatchingOrg | null;
  pending_join_request: PendingJoinRequest | null;
  can_create: boolean;
};

export async function claimPendingOrgInvite(): Promise<{ joined: boolean; organization_id?: string }> {
  const { data, error } = await supabase.rpc("claim_pending_org_invite");
  if (error) throw error;
  const result = data as { joined?: boolean; organization_id?: string } | null;
  return {
    joined: Boolean(result?.joined),
    organization_id: result?.organization_id,
  };
}

export async function getOrgSetupOptions(): Promise<OrgSetupOptions> {
  const { data, error } = await supabase.rpc("get_org_setup_options");
  if (error) throw error;
  const raw = (data ?? {}) as Partial<OrgSetupOptions>;
  return {
    email: raw.email ?? "",
    email_domain: raw.email_domain ?? "",
    matching_org: (raw.matching_org as MatchingOrg | null) ?? null,
    pending_join_request: (raw.pending_join_request as PendingJoinRequest | null) ?? null,
    can_create: Boolean(raw.can_create),
  };
}

export async function requestToJoinOrganization(organizationId: string): Promise<string> {
  const { data, error } = await supabase.rpc("request_to_join_organization", {
    _organization_id: organizationId,
  });
  if (error) throw error;
  return data as string;
}

export async function reviewJoinRequest(requestId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc("review_organization_join_request", {
    _request_id: requestId,
    _approve: approve,
  });
  if (error) throw error;
}

export type AdminAssignResult = {
  linked: boolean;
  invited: boolean;
  user_id?: string;
  invite_id?: string;
  role_at_org?: string;
  already_pending?: boolean;
};

export async function adminAssignUserToOrganization(input: {
  email: string;
  organizationId: string;
  roleAtOrg?: "facility_admin" | "bd_rep";
}): Promise<AdminAssignResult> {
  const { data, error } = await supabase.rpc("admin_assign_user_to_organization", {
    _email: input.email.trim().toLowerCase(),
    _organization_id: input.organizationId,
    _role_at_org: input.roleAtOrg || "facility_admin",
  });
  if (error) throw error;
  return (data ?? {}) as AdminAssignResult;
}
