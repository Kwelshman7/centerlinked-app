import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { adminNotifyAddress, sendEmail } from "../send.mjs";
import { accessRequestAdminEmail } from "../templates.mjs";

const accessRequestSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    organization: z.string().trim().min(2).max(160),
    role: z.string().trim().max(120).optional().nullable(),
    num_facilities: z.coerce.number().int().min(1).max(10_000).optional().nullable(),
    notes: z.string().trim().max(2_000).optional().nullable(),
  })
  .strict();

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function requestIp(headers) {
  const vercelIp = headers?.["x-vercel-forwarded-for"];
  const forwarded = headers?.["x-forwarded-for"];
  const raw = String(vercelIp || forwarded || "unknown").split(",")[0].trim();
  return raw.length > 0 && raw.length <= 128 ? raw : "unknown";
}

function fingerprint(value, key) {
  return createHmac("sha256", key).update(value).digest("hex");
}

async function consumeRateLimit(admin, fingerprintValue) {
  const { data, error } = await admin.rpc("consume_access_request_rate_limit", {
    _fingerprint: fingerprintValue,
    _max_attempts: 5,
    _window_seconds: 900,
  });
  if (error) throw new Error("Access-request rate limit is unavailable");
  return data === true;
}

/**
 * Notify admin@centerlinked.com of a new request-access submission.
 * Body: { full_name, email, organization, role?, num_facilities?, notes? }
 */
export async function handleNotifyAccessRequest(body, headers = {}) {
  const parsed = accessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, json: { error: "Invalid access request" } };
  }

  const { full_name, email, organization, role, notes, num_facilities } = parsed.data;
  const admin = supabaseAdmin();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!admin || !serviceRole) {
    console.error("[notify-access-request] intake is not configured");
    return { status: 503, json: { error: "Request service is temporarily unavailable" } };
  }

  try {
    const ipAllowed = await consumeRateLimit(admin, fingerprint(`ip:${requestIp(headers)}`, serviceRole));
    const emailAllowed = await consumeRateLimit(admin, fingerprint(`email:${email}`, serviceRole));
    if (!ipAllowed || !emailAllowed) {
      return { status: 429, json: { error: "Too many requests. Please try again later." } };
    }
  } catch (error) {
    console.error("[notify-access-request] rate-limit failure", error instanceof Error ? error.message : "unknown");
    return { status: 503, json: { error: "Request service is temporarily unavailable" } };
  }

  const { error: insertError } = await admin.from("early_access_leads").insert({
    full_name,
    email,
    organization,
    facilities: num_facilities == null ? "1" : String(num_facilities),
    role: role || null,
    notes: notes || null,
    status: "pending",
  });
  if (insertError) {
    console.error("[notify-access-request] lead persistence failed", insertError.code || "unknown");
    return { status: 503, json: { error: "Request service is temporarily unavailable" } };
  }

  const template = accessRequestAdminEmail({
    full_name,
    email,
    organization,
    role,
    num_facilities,
    notes,
  });

  const result = await sendEmail({
    to: adminNotifyAddress(),
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: email,
  });

  if (!result.ok) {
    console.error("[notify-access-request] notification failed", result.status || "unknown");
    return { status: 202, json: { ok: true } };
  }

  return { status: 202, json: { ok: true } };
}
