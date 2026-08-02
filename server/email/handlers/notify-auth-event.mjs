import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { adminNotifyAddress, sendEmail } from "../send.mjs";
import {
  accountCreatedEmail,
  adminNewSignupEmail,
  loginNoticeEmail,
} from "../templates.mjs";

const authEventSchema = z
  .object({
    event: z.enum(["signup", "login"]),
    full_name: z.string().trim().max(120).optional().nullable(),
  })
  .strict();

function supabaseAuthed(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !accessToken) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function fingerprint(value, key) {
  return createHmac("sha256", key).update(value).digest("hex");
}

async function consumeRateLimit(admin, fingerprintValue, maxAttempts, windowSeconds) {
  const { data, error } = await admin.rpc("consume_access_request_rate_limit", {
    _fingerprint: fingerprintValue,
    _max_attempts: maxAttempts,
    _window_seconds: windowSeconds,
  });
  if (error) throw new Error("Auth-event rate limit is unavailable");
  return data === true;
}

/**
 * Send signup or login transactional emails for the authenticated user.
 * Auth: Bearer access token.
 * Body: { event: "signup" | "login", full_name? }
 */
export async function handleNotifyAuthEvent(body, accessToken) {
  const parsed = authEventSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return { status: 400, json: { error: "Invalid auth notification request" } };
  }
  const event = parsed.data.event;

  const client = supabaseAuthed(accessToken);
  if (!client) {
    console.error("[notify-auth-event] auth client is not configured");
    return { status: 503, json: { error: "Notification service is temporarily unavailable" } };
  }

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user?.email) {
    return { status: 401, json: { error: "Unauthorized" } };
  }

  const user = userData.user;
  const email = user.email.trim().toLowerCase();
  const fullName =
    String(parsed.data.full_name || "").trim() ||
    String(user.user_metadata?.full_name || "").trim() ||
    null;

  const admin = supabaseAdmin();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!admin || !serviceRole) {
    console.error("[notify-auth-event] rate-limit backend is not configured");
    return { status: 503, json: { error: "Notification service is temporarily unavailable" } };
  }

  try {
    // signup: 2 / 24h per user; login: 5 / hour per user
    const allowed = await consumeRateLimit(
      admin,
      fingerprint(`auth-event:${event}:${user.id}`, serviceRole),
      event === "signup" ? 2 : 5,
      event === "signup" ? 86_400 : 3_600,
    );
    if (!allowed) {
      return { status: 429, json: { error: "Too many requests. Please try again later." } };
    }
  } catch (error) {
    console.error(
      "[notify-auth-event] rate-limit failure",
      error instanceof Error ? error.message : "unknown",
    );
    return { status: 503, json: { error: "Notification service is temporarily unavailable" } };
  }

  if (event === "signup") {
    const userTemplate = accountCreatedEmail({ recipientName: fullName });
    const userResult = await sendEmail({
      to: email,
      subject: userTemplate.subject,
      html: userTemplate.html,
      text: userTemplate.text,
    });

    if (!userResult.ok) {
      console.error("[notify-auth-event:signup:user]", userResult.error);
      return {
        status: 502,
        json: { error: "Could not send notification email" },
      };
    }

    const adminTemplate = adminNewSignupEmail({ full_name: fullName, email });
    const adminResult = await sendEmail({
      to: adminNotifyAddress(),
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      text: adminTemplate.text,
      replyTo: email,
    });

    if (!adminResult.ok) {
      console.error("[notify-auth-event:signup:admin]", adminResult.error);
      // User email already sent — still report success without leaking vendor errors.
      return {
        status: 200,
        json: {
          ok: true,
          event,
        },
      };
    }

    return {
      status: 200,
      json: {
        ok: true,
        event,
      },
    };
  }

  const template = loginNoticeEmail({
    recipientName: fullName,
    signedInAt: new Date().toUTCString(),
  });

  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.ok) {
    console.error("[notify-auth-event:login]", result.error);
    return {
      status: 502,
      json: { error: "Could not send notification email" },
    };
  }

  return { status: 200, json: { ok: true, event } };
}
