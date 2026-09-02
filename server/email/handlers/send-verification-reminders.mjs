import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../send.mjs";
import { verificationReminderEmail } from "../templates.mjs";
import { siteUrl } from "../config.mjs";

/** Nudge at 25 days so a facility is prompted before the 30-day fresh window lapses. */
const DUE_AFTER_DAYS = 25;

/** Do not email the same facility's owner more than once inside this window. */
const RESEND_COOLDOWN_DAYS = 7;

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 86_400_000);
}

/**
 * Who should be nudged about this facility. Per-facility BD contact wins so a
 * multi-site org routes each location to the rep who owns it; otherwise the
 * org-level BD contact; otherwise the org's facility admins.
 */
async function resolveRecipients(admin, facility, org, adminProfilesByOrg) {
  if (facility.bd_contact_email) {
    return [{ email: facility.bd_contact_email.toLowerCase(), name: facility.bd_contact_name, userId: null }];
  }
  if (org?.bd_contact_email) {
    return [{ email: org.bd_contact_email.toLowerCase(), name: org.bd_contact_name, userId: null }];
  }
  return adminProfilesByOrg.get(facility.organization_id) || [];
}

async function loadOrgAdmins(admin, orgIds) {
  const byOrg = new Map();
  if (!orgIds.length) return byOrg;

  const { data: members } = await admin
    .from("organization_members")
    .select("organization_id, user_id, role_at_org")
    .in("organization_id", orgIds)
    .eq("role_at_org", "facility_admin");

  const userIds = [...new Set((members || []).map((m) => m.user_id).filter(Boolean))];
  if (!userIds.length) return byOrg;

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, email, full_name")
    .in("user_id", userIds);

  const profileById = new Map((profiles || []).map((p) => [p.user_id, p]));
  for (const m of members || []) {
    const p = profileById.get(m.user_id);
    if (!p?.email) continue;
    const list = byOrg.get(m.organization_id) || [];
    list.push({ email: p.email.toLowerCase(), name: p.full_name, userId: p.user_id });
    byOrg.set(m.organization_id, list);
  }
  return byOrg;
}

/**
 * Email organizations whose facilities are due for contract verification.
 *
 * Invoked by Vercel Cron. Groups by recipient so one person gets one email
 * listing everything they own, rather than one email per facility.
 *
 * @returns {{ status: number, json: object }}
 */
export async function handleSendVerificationReminders({ dryRun = false } = {}) {
  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[verification-reminders] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 503, json: { error: "Service is not configured" } };
  }

  const { data: due, error: dueError } = await admin.rpc("list_facilities_due_for_verification", {
    _days: DUE_AFTER_DAYS,
  });

  if (dueError) {
    console.error("[verification-reminders] list failed:", dueError.message);
    return { status: 502, json: { error: "Could not list facilities due for verification" } };
  }

  let rows = due || [];
  if (!rows.length) {
    return { status: 200, json: { ok: true, due: 0, emailed: 0, skipped: 0 } };
  }

  // Only nudge organizations that someone has actually claimed. Seeded profiles
  // are real companies who never signed up — emailing them a "confirm your
  // contracts" reminder would be unsolicited mail about an account they do not
  // have. Membership is the consent signal.
  const candidateOrgIds = [...new Set(rows.map((r) => r.organization_id).filter(Boolean))];
  const { data: claimed, error: claimedError } = await admin
    .from("organization_members")
    .select("organization_id")
    .in("organization_id", candidateOrgIds);

  if (claimedError) {
    console.error("[verification-reminders] membership lookup failed:", claimedError.message);
    return { status: 502, json: { error: "Could not resolve claimed organizations" } };
  }

  const claimedOrgIds = new Set((claimed || []).map((m) => m.organization_id));
  const unclaimedSkipped = rows.length;
  rows = rows.filter((r) => claimedOrgIds.has(r.organization_id));

  if (!rows.length) {
    return {
      status: 200,
      json: { ok: true, due: 0, emailed: 0, skipped: 0, unclaimed: unclaimedSkipped },
    };
  }

  const facilityIds = rows.map((r) => r.facility_id);
  const orgIds = [...new Set(rows.map((r) => r.organization_id).filter(Boolean))];

  // Skip anything already nudged inside the cooldown window.
  const cutoff = new Date(Date.now() - RESEND_COOLDOWN_DAYS * 86_400_000).toISOString();
  const { data: recent } = await admin
    .from("verification_reminders")
    .select("facility_id")
    .in("facility_id", facilityIds)
    .gte("created_at", cutoff);
  const recentlyNudged = new Set((recent || []).map((r) => r.facility_id));

  const [{ data: facilities }, { data: orgs }] = await Promise.all([
    admin
      .from("facilities")
      .select("id, name, organization_id, bd_contact_email, bd_contact_name, verification_frozen")
      .in("id", facilityIds),
    admin
      .from("organizations")
      .select("id, name, bd_contact_email, bd_contact_name")
      .in("id", orgIds),
  ]);

  const facilityById = new Map((facilities || []).map((f) => [f.id, f]));
  const orgById = new Map((orgs || []).map((o) => [o.id, o]));
  const adminProfilesByOrg = await loadOrgAdmins(admin, orgIds);

  // recipientEmail -> { name, orgId, userId, facilities: [...] }
  const buckets = new Map();
  let skipped = 0;
  let unroutable = 0;

  for (const row of rows) {
    if (recentlyNudged.has(row.facility_id)) {
      skipped += 1;
      continue;
    }
    const facility = facilityById.get(row.facility_id);
    if (!facility) {
      skipped += 1;
      continue;
    }
    const org = orgById.get(row.organization_id);
    const recipients = await resolveRecipients(admin, facility, org, adminProfilesByOrg);
    if (!recipients.length) {
      unroutable += 1;
      continue;
    }

    for (const r of recipients) {
      const bucket = buckets.get(r.email) || {
        name: r.name,
        userId: r.userId,
        orgId: row.organization_id,
        orgName: org?.name || null,
        facilities: [],
      };
      bucket.facilities.push({
        id: facility.id,
        name: facility.name || row.facility_name,
        organizationId: row.organization_id,
        daysSince: daysSince(row.contracts_verified_at),
        verifyUrl: `${siteUrl()}/app/facilities/${facility.id}/verify`,
      });
      buckets.set(r.email, bucket);
    }
  }

  if (dryRun) {
    return {
      status: 200,
      json: {
        ok: true,
        dryRun: true,
        due: rows.length,
        wouldEmail: buckets.size,
        skipped,
        unroutable,
        recipients: [...buckets.entries()].map(([email, b]) => ({
          email,
          org: b.orgName,
          facilities: b.facilities.map((f) => f.name),
        })),
      },
    };
  }

  let emailed = 0;
  let failed = 0;

  for (const [email, bucket] of buckets) {
    const template = verificationReminderEmail({
      recipientName: bucket.name,
      organizationName: bucket.orgName,
      facilities: bucket.facilities,
    });

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.ok) {
      failed += 1;
      console.error("[verification-reminders] send failed:", result.error);
      continue;
    }
    emailed += 1;

    // Record only after a successful send so a failure retries next run.
    const reminderRows = bucket.facilities.map((f) => ({
      organization_id: f.organizationId,
      facility_id: f.id,
      recipient_user_id: bucket.userId,
      reason: "monthly_due",
    }));
    const { error: insertError } = await admin.from("verification_reminders").insert(reminderRows);
    if (insertError) {
      console.error("[verification-reminders] log failed:", insertError.message);
    }
  }

  return {
    status: 200,
    json: { ok: true, due: rows.length, emailed, failed, skipped, unroutable },
  };
}
