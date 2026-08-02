import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../send.mjs";
import { orgWelcomeEmail } from "../templates.mjs";

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

async function assertSuperAdmin(accessToken) {
  const client = supabaseAuthed(accessToken);
  if (!client) return { ok: false, error: "Auth not configured", status: 500 };

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const { data: roleRow, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (roleError || !roleRow) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, userId: userData.user.id };
}

async function resolveRecipient(admin, org) {
  if (org.bd_contact_email) {
    return {
      email: org.bd_contact_email,
      name: org.bd_contact_name || null,
    };
  }

  if (org.created_by) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", org.created_by)
      .maybeSingle();
    if (profile?.email) {
      return { email: profile.email, name: profile.full_name };
    }
  }

  const { data: members } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", org.id)
    .limit(10);

  const userIds = (members || []).map((m) => m.user_id).filter(Boolean);
  if (userIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("email, full_name, user_id")
      .in("user_id", userIds);

    const withEmail = (profiles || []).find((p) => p.email);
    if (withEmail) {
      return { email: withEmail.email, name: withEmail.full_name };
    }
  }

  // Fall back to matching early-access lead by organization name
  const { data: lead } = await admin
    .from("early_access_leads")
    .select("email, full_name")
    .ilike("organization", org.name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lead?.email) {
    return { email: lead.email, name: lead.full_name };
  }

  return null;
}

/**
 * Send welcome email after an organization is verified.
 * Auth: Bearer access token of a super_admin.
 * Body: { organization_id, to_email?, to_name? }
 */
export async function handleSendWelcome(body, accessToken) {
  const auth = await assertSuperAdmin(accessToken);
  if (!auth.ok) {
    return { status: auth.status, json: { error: auth.error } };
  }

  const organizationId = String(body?.organization_id || "").trim();
  if (!organizationId) {
    return { status: 400, json: { error: "organization_id is required" } };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[send-welcome] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 503, json: { error: "Email service is temporarily unavailable" } };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, verified, bd_contact_email, bd_contact_name, created_by")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { status: 404, json: { error: "Organization not found" } };
  }

  if (!org.verified) {
    return { status: 400, json: { error: "Organization is not verified yet" } };
  }

  let recipient = null;
  const overrideEmail = String(body?.to_email || "").trim().toLowerCase();
  if (overrideEmail) {
    recipient = {
      email: overrideEmail,
      name: String(body?.to_name || "").trim() || null,
    };
  } else {
    recipient = await resolveRecipient(admin, org);
  }

  if (!recipient?.email) {
    return {
      status: 422,
      json: {
        error:
          "No recipient email found. Set BD contact email on the organization, or pass to_email.",
      },
    };
  }

  const template = orgWelcomeEmail({
    recipientName: recipient.name,
    organizationName: org.name,
  });

  const result = await sendEmail({
    to: recipient.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.ok) {
    console.error("[send-welcome]", result.error);
    return {
      status: 502,
      json: { error: "Could not send welcome email" },
    };
  }

  return {
    status: 200,
    json: { ok: true, to: recipient.email },
  };
}
