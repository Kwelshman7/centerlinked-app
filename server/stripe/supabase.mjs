import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function supabaseAuthed(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !accessToken) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verify Bearer token and ensure caller can manage org billing
 * (facility_admin or super_admin with an organization_id).
 */
export async function assertOrgBillingAdmin(accessToken) {
  if (!accessToken) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const client = supabaseAuthed(accessToken);
  if (!client) return { ok: false, error: "Auth not configured", status: 500 };

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const userId = userData.user.id;
  const email = userData.user.email || null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("organization_id, full_name, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[assertOrgBillingAdmin] profile lookup failed", profileError.message);
    return { ok: false, error: "Could not verify billing permissions", status: 500 };
  }

  const organizationId = profile?.organization_id || null;
  if (!organizationId) {
    return { ok: false, error: "Join or create an organization before billing", status: 400 };
  }

  const { data: isAdmin, error: adminError } = await client.rpc("is_org_facility_admin", {
    _org_id: organizationId,
    _user_id: userId,
  });

  if (adminError) {
    console.error("[assertOrgBillingAdmin] is_org_facility_admin failed", adminError.message);
    return { ok: false, error: "Could not verify billing permissions", status: 500 };
  }

  if (!isAdmin) {
    return {
      ok: false,
      error: "Only organization admins can manage billing",
      status: 403,
    };
  }

  const { data: roles, error: rolesError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    console.error("[assertOrgBillingAdmin] roles lookup failed", rolesError.message);
    return { ok: false, error: "Could not verify billing permissions", status: 500 };
  }

  const roleList = (roles || []).map((r) => r.role);

  return {
    ok: true,
    userId,
    email: profile?.email || email,
    fullName: profile?.full_name || null,
    organizationId,
    roles: roleList,
  };
}
