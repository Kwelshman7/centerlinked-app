import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { adminNotifyAddress, sendEmail } from "../send.mjs";
import { pricingInquiryAdminEmail } from "../templates.mjs";

const inquirySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(40),
    question: z.string().trim().min(10).max(2_000),
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
  if (error) throw new Error("Pricing-inquiry rate limit is unavailable");
  return data === true;
}

/**
 * Notify admin@centerlinked.com of a pricing-page message.
 * Body: { name, email, phone, question }
 */
export async function handleNotifyPricingInquiry(body, headers = {}) {
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, json: { error: "Please check your name, email, phone, and question." } };
  }

  const { name, email, phone, question } = parsed.data;
  const admin = supabaseAdmin();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (admin && serviceRole) {
    try {
      const ipAllowed = await consumeRateLimit(
        admin,
        fingerprint(`pricing-inquiry:ip:${requestIp(headers)}`, serviceRole),
      );
      const emailAllowed = await consumeRateLimit(
        admin,
        fingerprint(`pricing-inquiry:email:${email}`, serviceRole),
      );
      if (!ipAllowed || !emailAllowed) {
        return { status: 429, json: { error: "Too many requests. Please try again later." } };
      }
    } catch (error) {
      console.error(
        "[notify-pricing-inquiry] rate-limit failure",
        error instanceof Error ? error.message : "unknown",
      );
      return { status: 503, json: { error: "Message service is temporarily unavailable" } };
    }
  }

  const template = pricingInquiryAdminEmail({ name, email, phone, question });
  const result = await sendEmail({
    to: adminNotifyAddress(),
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: email,
  });

  if (!result.ok) {
    console.error("[notify-pricing-inquiry] send failed", result.status || "unknown");
    return { status: 502, json: { error: "Could not send your message. Please try again." } };
  }

  return { status: 200, json: { ok: true } };
}
