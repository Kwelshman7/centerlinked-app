/**
 * Super-admin ops: attach an existing user to an organization as facility_admin.
 * Uses service role. Dry-run unless --apply.
 *
 * Usage:
 *   node server/assign-org-admin.mjs --email "user@example.com" --org "Remedy"
 *   node server/assign-org-admin.mjs --email "user@example.com" --org "Remedy" --apply
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(resolve(process.cwd(), name), "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (process.env[key] == null) process.env[key] = value;
      }
    } catch {
      /* missing file is fine */
    }
  }
}

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  if (!domain) return "(invalid)";
  const keep = local.slice(0, 2);
  return `${keep}…@${domain}`;
}

loadEnv();

const emailArg = String(arg("--email") || "").trim().toLowerCase();
const nameQuery = String(arg("--name") || "").trim();
const orgQuery = String(arg("--org") || "").trim();
const apply = process.argv.includes("--apply");

if ((!emailArg && !nameQuery) || !orgQuery) {
  console.error("Usage: node server/assign-org-admin.mjs --org \"Org name\" [--email user@example.com | --name Coyle] [--apply]");
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_SERVICE_ROLE / VITE_SUPABASE_URL");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: orgs, error: orgError } = await admin
  .from("organizations")
  .select("id,name,slug,verified,email_domain")
  .ilike("name", `%${orgQuery}%`);

if (orgError) {
  console.error("Org lookup failed:", orgError.message);
  process.exit(1);
}

console.log(`Orgs matching "${orgQuery}": ${(orgs || []).length}`);
for (const o of orgs || []) {
  console.log(`  - ${o.name}  verified=${o.verified}  domain=${o.email_domain || "—"}  id=${o.id}`);
}

let email = emailArg;
if (!email && nameQuery) {
  const { data: leadByName } = await admin
    .from("early_access_leads")
    .select("email,full_name")
    .ilike("full_name", `%${nameQuery}%`)
    .maybeSingle();
  email = String(leadByName?.email || "").trim().toLowerCase();
}

if (!email) {
  console.error("Could not resolve an email from --email or --name.");
  process.exit(1);
}

const { data: profiles, error: profileError } = await admin
  .from("profiles")
  .select("user_id,full_name,email,organization_id")
  .ilike("email", email);

if (profileError) {
  console.error("Profile lookup failed:", profileError.message);
  process.exit(1);
}

console.log(`Profiles for ${maskEmail(email)}: ${(profiles || []).length}`);
for (const p of profiles || []) {
  console.log(`  - ${p.full_name || "(no name)"}  org=${p.organization_id || "none"}  user=${p.user_id}`);
}

const { data: leads } = await admin
  .from("early_access_leads")
  .select("id,full_name,email,organization,status")
  .ilike("email", email);

console.log(`Access leads: ${(leads || []).length}`);
for (const l of leads || []) {
  console.log(`  - ${l.full_name}  status=${l.status}  org_note=${l.organization}`);
}

const org = (orgs || []).find((o) => o.name.toLowerCase().includes(orgQuery.toLowerCase())) || (orgs || [])[0];
const profile = (profiles || [])[0];
const leadName = leads?.[0]?.full_name || profile?.full_name || null;

if (!org) {
  console.error("No organization match. Stop.");
  process.exit(1);
}

if (!apply) {
  if (profile?.user_id) {
    console.log(`Dry-run: would link ${maskEmail(email)} → ${org.name} as facility_admin`);
  } else {
    console.log(`Dry-run: would invite ${maskEmail(email)} → ${org.name} as facility_admin (no account yet)`);
  }
  process.exit(0);
}

if (profile?.user_id) {
  const { error: linkError } = await admin.rpc("link_user_to_organization", {
    _user_id: profile.user_id,
    _organization_id: org.id,
    _role_at_org: "facility_admin",
  });

  if (linkError) {
    console.error("link_user_to_organization failed:", linkError.message);
    process.exit(1);
  }

  const { data: after } = await admin
    .from("profiles")
    .select("user_id,full_name,organization_id")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  console.log(`Applied: linked ${after?.full_name || maskEmail(email)} to ${org.name}`);
} else {
  const { data: existing } = await admin
    .from("org_invites")
    .select("id")
    .eq("organization_id", org.id)
    .ilike("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (!existing?.id) {
    const { error: inviteError } = await admin.from("org_invites").insert({
      organization_id: org.id,
      email,
      role_at_org: "facility_admin",
      status: "pending",
    });
    if (inviteError) {
      console.error("Invite insert failed:", inviteError.message);
      process.exit(1);
    }
  }

  console.log(`Applied: pending admin invite for ${maskEmail(email)} → ${org.name}`);
}

const { orgAssignedEmail } = await import("./email/templates.mjs");
const { sendEmail } = await import("./email/send.mjs");
const template = orgAssignedEmail({
  recipientName: leadName,
  organizationName: org.name,
  alreadyLinked: Boolean(profile?.user_id),
});
const sent = await sendEmail({
  to: email,
  subject: template.subject,
  html: template.html,
  text: template.text,
});
if (!sent.ok) {
  console.error("Invite created, but email failed:", sent.error);
  process.exit(1);
}
console.log("Assignment email sent.");
