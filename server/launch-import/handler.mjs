import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { parseLaunchPdf } from "./parse-pdf.mjs";
import { sendEmail } from "../email/send.mjs";
import { orgClaimInviteEmail } from "../email/templates.mjs";
import { siteUrl } from "../email/config.mjs";

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "mail.com",
  "gmx.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "tutanota.com",
  "duck.com",
]);

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
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

function launchToken() {
  return String(process.env.LAUNCH_IMPORT_TOKEN || "").trim();
}

export function launchTokenMatches(provided) {
  const expected = launchToken();
  const got = String(provided || "").trim();
  if (!expected || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function launchShareUrl() {
  return `${siteUrl()}/launch/${launchToken()}`;
}

function trimTo(value, max) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return email;
}

function emailDomain(email) {
  return (email || "").split("@")[1] || "";
}

function isPersonalEmail(email) {
  return PERSONAL_EMAIL_DOMAINS.has(emailDomain(email));
}

function normalizePayerName(raw) {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "'")
    .replace(/[^\w\s&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAssignedBd(contact) {
  const name = trimTo(contact?.name, 120);
  if (!name) return false;
  return !!(trimTo(contact?.phone, 40) || normalizeEmail(contact?.email));
}

function uniqueStrings(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value.slice(0, 120));
  }
  return out.slice(0, 40);
}

async function assertSuperAdmin(accessToken) {
  const client = supabaseAuthed(accessToken);
  if (!client) return { ok: false, error: "Auth not configured", status: 500 };
  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user) return { ok: false, error: "Unauthorized", status: 401 };
  const { data: roleRow, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (roleError || !roleRow) return { ok: false, error: "Forbidden", status: 403 };
  return { ok: true };
}

function resolvePayer(rawName, payers) {
  const original = String(rawName || "").trim();
  if (!original) return null;
  const norm = normalizePayerName(original);
  const compact = norm.replace(/\s+/g, "");
  const hit =
    payers.find((p) => normalizePayerName(p.name) === norm) ||
    payers.find((p) => normalizePayerName(p.name).replace(/\s+/g, "") === compact) ||
    payers.find((p) =>
      (p.aliases || []).some((alias) => normalizePayerName(alias) === norm),
    );
  return {
    payer_id: hit?.id ?? null,
    payer_name: hit?.name ?? original.slice(0, 200),
    original_imported_value: original.slice(0, 200),
  };
}

function contractRowsForFacility(facility, payers) {
  const drafts = [];
  const inNames = uniqueStrings(facility.payers_in_network);
  const inNorm = new Set(inNames.map((name) => normalizePayerName(name)).filter(Boolean));
  for (const raw of inNames) {
    const resolved = resolvePayer(raw, payers);
    if (!resolved) continue;
    drafts.push({
      ...resolved,
      in_network: true,
      plan_types: [],
      contract_status: "active",
      verified_at: null,
    });
  }
  for (const raw of uniqueStrings(facility.payers_out_of_network)) {
    if (inNorm.has(normalizePayerName(raw))) continue;
    const resolved = resolvePayer(raw, payers);
    if (!resolved) continue;
    drafts.push({
      ...resolved,
      in_network: false,
      plan_types: [],
      contract_status: "out_of_network",
      verified_at: null,
    });
  }
  return drafts;
}

async function handleParse(body) {
  if (!launchTokenMatches(body.token)) {
    return { status: 403, json: { error: "This launch link is not valid." } };
  }
  try {
    const parsed = await parseLaunchPdf({
      pdfBase64: body.pdf_base64,
      filename: trimTo(body.filename, 200) || "facility.pdf",
    });
    return { status: 200, json: { ok: true, ...parsed } };
  } catch (err) {
    return {
      status: err.status || 500,
      json: { error: err instanceof Error ? err.message : "Couldn't read that PDF" },
    };
  }
}

async function handleCommit(body) {
  if (!launchTokenMatches(body.token)) {
    return { status: 403, json: { error: "This launch link is not valid." } };
  }
  if (body.confirmed !== true) {
    return { status: 400, json: { error: "Confirm the extract is correct before saving." } };
  }

  const orgName = trimTo(body.organization?.name, 200);
  if (!orgName) return { status: 400, json: { error: "Organization name is required." } };

  const bd = {
    name: trimTo(body.bd?.name, 120),
    phone: trimTo(body.bd?.phone, 40),
    email: normalizeEmail(body.bd?.email),
  };
  if (!hasAssignedBd(bd)) {
    return {
      status: 400,
      json: { error: "Add a BD contact name plus a direct phone or email." },
    };
  }

  const ownerName = trimTo(body.owner?.name, 120);
  const ownerEmail = normalizeEmail(body.owner?.email);
  if (!ownerName || !ownerEmail) {
    return { status: 400, json: { error: "The organization owner's name and work email are required." } };
  }
  if (isPersonalEmail(ownerEmail)) {
    return {
      status: 400,
      json: {
        error:
          "Use the owner's work email. Personal addresses cannot sign up unless CenterLinked has approved that exact email.",
      },
    };
  }

  const facilities = Array.isArray(body.facilities) ? body.facilities : [];
  if (!facilities.length) {
    return { status: 400, json: { error: "Add at least one facility before saving." } };
  }
  for (const facility of facilities) {
    if (!trimTo(facility?.name, 200)) {
      return { status: 400, json: { error: "Every facility needs a name." } };
    }
  }

  const admin = supabaseAdmin();
  if (!admin) return { status: 500, json: { error: "Launch import is not configured." } };

  const { data: nameHits, error: nameError } = await admin
    .from("organizations")
    .select("id,name,hq_city,hq_state")
    .ilike("name", orgName)
    .limit(5);
  if (nameError) return { status: 500, json: { error: nameError.message } };
  const exact = (nameHits || []).find(
    (row) => String(row.name || "").trim().toLowerCase() === orgName.toLowerCase(),
  );
  if (exact) {
    return {
      status: 409,
      json: {
        error: `${orgName} is already in CenterLinked. Do not create a second listing — ask Kyle if this should be merged.`,
      },
    };
  }

  const domain = emailDomain(ownerEmail);
  const { data: domainHit } = await admin
    .from("organizations")
    .select("id,name")
    .eq("email_domain", domain)
    .maybeSingle();
  if (domainHit?.id) {
    return {
      status: 409,
      json: {
        error: `An organization for ${domain} already exists (${domainHit.name}). Do not create a duplicate.`,
      },
    };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      website: trimTo(body.organization?.website, 240),
      description: trimTo(body.organization?.description, 4000),
      phone: trimTo(body.organization?.phone, 40),
      hq_city: trimTo(body.organization?.hq_city, 120),
      hq_state: trimTo(body.organization?.hq_state, 40),
      email_domain: domain,
      bd_contact_name: bd.name,
      bd_contact_phone: bd.phone,
      bd_contact_email: bd.email,
      num_facilities: facilities.length,
    })
    .select("id,name,slug")
    .single();
  if (orgError || !org) {
    return { status: 500, json: { error: orgError?.message || "Could not create the organization." } };
  }

  const { data: payerRows } = await admin
    .from("payers")
    .select("id,name,aliases,active")
    .eq("status", "approved");
  const payers = (payerRows || []).filter((p) => p.active !== false);

  const createdFacilities = [];
  for (const facility of facilities) {
    const { data: fac, error: facError } = await admin
      .from("facilities")
      .insert({
        organization_id: org.id,
        name: trimTo(facility.name, 200),
        tagline: trimTo(facility.tagline, 240),
        address_line1: trimTo(facility.address_line1, 240),
        city: trimTo(facility.city, 120),
        state: trimTo(facility.state, 40),
        zip: trimTo(facility.zip, 20),
        phone: trimTo(facility.phone, 40),
        website: trimTo(facility.website, 240),
        description: trimTo(facility.description, 4000),
        capacity: Number(facility.capacity) || null,
        levels_of_care: uniqueStrings(facility.levels_of_care),
        highlights: uniqueStrings(facility.highlights),
        bd_contact_name: bd.name,
        bd_contact_phone: bd.phone,
        bd_contact_email: bd.email,
        verification_status: "pending",
      })
      .select("id,name,slug")
      .single();
    if (facError || !fac) {
      return {
        status: 500,
        json: {
          error: facError?.message || `Saved ${org.name}, but could not add ${facility.name}.`,
          organization_id: org.id,
        },
      };
    }

    const contracts = contractRowsForFacility(facility, payers).map((row) => ({
      facility_id: fac.id,
      payer_id: row.payer_id,
      payer_name: row.payer_name,
      in_network: row.in_network,
      plan_types: [],
      contract_status: row.contract_status,
      original_imported_value: row.original_imported_value,
    }));
    if (contracts.length) {
      const { error: contractError } = await admin.from("insurance_contracts").insert(contracts);
      if (contractError) {
        return {
          status: 500,
          json: {
            error: `Saved ${fac.name}, but insurance rows failed: ${contractError.message}`,
            organization_id: org.id,
          },
        };
      }
    }
    createdFacilities.push(fac);
  }

  const { data: existingInvite } = await admin
    .from("org_invites")
    .select("id")
    .eq("organization_id", org.id)
    .ilike("email", ownerEmail)
    .eq("status", "pending")
    .maybeSingle();
  if (!existingInvite?.id) {
    const { error: inviteError } = await admin.from("org_invites").insert({
      organization_id: org.id,
      email: ownerEmail,
      role_at_org: "facility_admin",
      status: "pending",
    });
    if (inviteError) {
      return {
        status: 500,
        json: {
          error: `Organization saved, but the claim invite failed: ${inviteError.message}`,
          organization_id: org.id,
        },
      };
    }
  }

  const template = orgClaimInviteEmail({
    recipientName: ownerName,
    organizationName: org.name,
  });
  const sent = await sendEmail({
    to: ownerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    status: 200,
    json: {
      ok: true,
      organization_id: org.id,
      organization_name: org.name,
      slug: org.slug,
      facilities_created: createdFacilities.length,
      claim_email: ownerEmail,
      email_sent: Boolean(sent.ok),
      email_error: sent.ok ? undefined : sent.error,
    },
  };
}

export async function handleLaunchImport(body, accessToken) {
  const action = String(body?.action || "").trim();

  if (action === "share-url") {
    const auth = await assertSuperAdmin(accessToken);
    if (!auth.ok) return { status: auth.status, json: { error: auth.error } };
    if (!launchToken()) {
      return { status: 503, json: { error: "LAUNCH_IMPORT_TOKEN is not configured." } };
    }
    return { status: 200, json: { ok: true, url: launchShareUrl() } };
  }

  if (action === "check") {
    if (!launchTokenMatches(body.token)) {
      return { status: 403, json: { error: "This launch link is not valid." } };
    }
    return { status: 200, json: { ok: true } };
  }

  if (action === "parse") return handleParse(body);
  if (action === "commit") return handleCommit(body);

  return { status: 400, json: { error: "Unknown launch-import action." } };
}

