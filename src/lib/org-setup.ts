import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fullNameFromAuthUser } from "@/lib/auth-user";
import { resolveInviteClaim } from "@/lib/invite-claim";

const ORG_RPC_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ORG_RPC_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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

async function ensureProfileOrganization(
  userId: string,
  email: string | null | undefined,
  organizationId: string,
  fullName?: string | null,
): Promise<boolean> {
  const name = fullName?.trim() || null;
  const { data: prof, error: loadError } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (loadError) {
    console.warn("Could not load profile for org link:", loadError.message);
    return false;
  }
  if (prof?.organization_id) {
    if (name && !prof.full_name?.trim()) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("user_id", userId);
      if (error) console.warn("Could not save profile name:", error.message);
    }
    return true;
  }
  if (!prof) {
    const { error } = await supabase.from("profiles").insert({
      user_id: userId,
      email: email ?? null,
      full_name: name,
      organization_id: organizationId,
    });
    if (!error) return true;
    if (!/duplicate|unique/i.test(error.message)) {
      console.warn("Could not link profile to organization:", error.message);
      return false;
    }
    // Auth just created the row without an org — fall through and attach it.
  }
  const patch: { organization_id: string; full_name?: string } = {
    organization_id: organizationId,
  };
  if (name && !prof?.full_name?.trim()) patch.full_name = name;
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) {
    console.warn("Could not link profile to organization:", error.message);
    return false;
  }
  const { data: linked } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return linked?.organization_id === organizationId;
}

export async function claimPendingOrgInvite(): Promise<{ joined: boolean; organization_id?: string }> {
  const { data, error } = await withTimeout(
    supabase.rpc("claim_pending_org_invite"),
    "Invite check timed out",
  );
  if (error) throw error;
  const result = data as { joined?: boolean; organization_id?: string; reason?: string } | null;
  const alreadyInOrg = result?.reason === "already_in_org";

  const { data: userData, error: userError } = await supabase.auth.getUser();
  let user = userData.user;
  if (!user) {
    const { data: sessionData } = await supabase.auth.getSession();
    user = sessionData.session?.user ?? undefined;
  }

  let profileOrganizationId: string | null = null;
  let membershipOrganizationId: string | null = null;
  if (user?.id && alreadyInOrg) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();
    profileOrganizationId = prof?.organization_id ?? null;
  }
  if (user?.id && !Boolean(result?.joined && result?.organization_id) && !profileOrganizationId) {
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membershipError) {
      toast.error("Couldn't confirm your organization membership", {
        description: membershipError.message,
      });
    } else {
      membershipOrganizationId = membership?.organization_id ?? null;
    }
  }

  const { joined, organization_id: organizationId } = resolveInviteClaim({
    joined: result?.joined,
    organization_id: result?.organization_id,
    reason: result?.reason,
    profileOrganizationId,
    membershipOrganizationId,
  });

  if (!user && (joined || (userError && !alreadyInOrg))) {
    toast.error("Couldn't confirm who is signed in", {
      description: userError?.message || "Refresh the page, then sign in again with the invited work email.",
    });
  }

  if (joined && organizationId && user?.id && !alreadyInOrg) {
    const linked = await ensureProfileOrganization(
      user.id,
      user.email,
      organizationId,
      fullNameFromAuthUser(user),
    );
    if (!linked) {
      toast.error("You've joined, but your account didn't link to the organization", {
        description: "Refresh the page. If Members is still missing, sign out and back in with this work email.",
      });
    }
  } else if (joined && organizationId && user?.id && alreadyInOrg && !profileOrganizationId) {
    // Membership exists; profile row is stale. Persist quietly — a toast here
    // fired on every AuthContext load when the write was already skipped.
    await ensureProfileOrganization(
      user.id,
      user.email,
      organizationId,
      fullNameFromAuthUser(user),
    );
  }

  return {
    joined,
    organization_id: organizationId,
  };
}

export async function getOrgSetupOptions(): Promise<OrgSetupOptions> {
  const { data, error } = await withTimeout(
    supabase.rpc("get_org_setup_options"),
    "Couldn't load organization options",
  );
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
  const { data, error } = await withTimeout(
    supabase.rpc("request_to_join_organization", {
      _organization_id: organizationId,
    }),
    "Join request timed out",
  );
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
