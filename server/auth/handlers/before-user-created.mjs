import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hookSecretBytes() {
  const raw = process.env.BEFORE_USER_CREATED_HOOK_SECRET || "";
  const trimmed = raw.replace(/^v1,/, "").replace(/^whsec_/, "");
  if (!trimmed) return null;
  return Buffer.from(trimmed, "base64");
}

/**
 * Verify Standard Webhooks signature (Supabase Auth Hooks).
 * @returns {boolean}
 */
function verifyStandardWebhook(rawBody, headers) {
  const secret = hookSecretBytes();
  if (!secret) return false;

  const id = headers["webhook-id"] || headers["Webhook-Id"];
  const timestamp = headers["webhook-timestamp"] || headers["Webhook-Timestamp"];
  const signatureHeader = headers["webhook-signature"] || headers["Webhook-Signature"];
  if (!id || !timestamp || !signatureHeader) return false;

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 300) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedContent).digest("base64");

  const candidates = String(signatureHeader)
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.startsWith("v1,") ? part.slice(3) : part));

  return candidates.some((candidate) => {
    try {
      const a = Buffer.from(candidate);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function reject(message, httpCode = 400) {
  // Supabase reads error body on 200/202 responses for before-user-created hooks.
  return {
    status: 200,
    json: {
      error: {
        message,
        http_code: httpCode,
      },
    },
  };
}

/**
 * Supabase Auth Hook: before-user-created
 * Blocks personal-email signups unless approved / bootstrap-listed.
 *
 * @param {string} rawBody
 * @param {Record<string, string|string[]|undefined>} headers
 */
export async function handleBeforeUserCreated(rawBody, headers = {}) {
  if (!verifyStandardWebhook(rawBody, headers)) {
    console.error("[before-user-created] invalid webhook signature");
    return { status: 401, json: { error: { message: "Invalid webhook signature", http_code: 401 } } };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return { status: 400, json: { error: { message: "Invalid JSON", http_code: 400 } } };
  }

  const email = String(payload?.user?.email || "").trim().toLowerCase();
  if (!email) {
    return reject("A valid work email is required.");
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[before-user-created] SUPABASE_SERVICE_ROLE is not configured");
    return { status: 500, json: { error: { message: "Auth hook misconfigured", http_code: 500 } } };
  }

  const { data: allowed, error } = await admin.rpc("is_email_auth_allowed", { _email: email });
  if (error) {
    console.error("[before-user-created] is_email_auth_allowed failed", error.message);
    return { status: 500, json: { error: { message: "Could not validate email", http_code: 500 } } };
  }

  if (!allowed) {
    return reject(
      "Personal email addresses aren't accepted unless CenterLinked has approved an exception. Please use your work email or request access.",
    );
  }

  return { status: 200, json: {} };
}
