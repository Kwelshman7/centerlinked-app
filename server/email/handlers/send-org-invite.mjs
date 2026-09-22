import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../send.mjs";
import { orgInviteEmail } from "../templates.mjs";

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function supabaseAuthed(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !accessToken) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Caller must be able to create the invite already: an org member (BD reps
 * included) or a facility_admin / super_admin. Mirrors `create_org_invite`
 * and the Members invite form. Still not an open mailer — a pending
 * `org_invites` row is required below.
 */
async function assertCanSendOrgInvite(accessToken, organizationId) {
  const client = supabaseAuthed(accessToken);
  if (!client) return { ok: false, error: "Auth not configured", status: 500 };

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const userId = userData.user.id;
  const { data: isAdmin } = await client.rpc("is_org_facility_admin", {
    _org_id: organizationId,
    _user_id: userId,
  });
  if (isAdmin === true) {
    return { ok: true, userId };
  }

  const { data: isMember } = await client.rpc("is_org_member", {
    _org_id: organizationId,
    _user_id: userId,
  });
  if (isMember === true) {
    return { ok: true, userId };
  }

  return { ok: false, error: "Forbidden", status: 403 };
}

/**
 * Email a pending organization invite.
 *
 * Auth: Bearer access token of an org member, facility_admin, or super_admin.
 * Body: { organization_id, email }
 *
 * Deliberately narrow: this will only send to an address that already has a
 * `pending` row in `org_invites` for that organization. Without that check the
 * endpoint would be an authenticated open mailer.
 */
export async function handleSendOrgInvite(body, accessToken) {
  const organizationId = String(body?.organization_id || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();

  if (!organizationId || !email) {
    return { status: 400, json: { error: "organization_id and email are required" } };
  }

  const auth = await assertCanSendOrgInvite(accessToken, organizationId);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[send-org-invite] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 503, json: { error: "Email service is temporarily unavailable" } };
  }

  // The invite row is the authorization to send. No row, no email.
  const { data: invite, error: inviteError } = await admin
    .from("org_invites")
    .select("id, email, role_at_org, status, organization_id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError || !invite) {
    return { status: 404, json: { error: "No pending invite found for that address" } };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const template = orgInviteEmail({
    organizationName: org?.name || null,
    inviterName: inviterProfile?.full_name || null,
    roleAtOrg: invite.role_at_org,
    email: invite.email,
  });

  const result = await sendEmail({
    to: invite.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.ok) {
    console.error("[send-org-invite]", result.error);
    return { status: 502, json: { error: "Could not send the invite email" } };
  }

  return { status: 200, json: { ok: true, to: invite.email } };
}
