import { createClient } from "@supabase/supabase-js";
import { adminNotifyAddress, sendEmail } from "../send.mjs";
import {
  accountCreatedEmail,
  adminNewSignupEmail,
  loginNoticeEmail,
} from "../templates.mjs";

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
 * Send signup or login transactional emails for the authenticated user.
 * Auth: Bearer access token.
 * Body: { event: "signup" | "login", full_name? }
 */
export async function handleNotifyAuthEvent(body, accessToken) {
  const event = String(body?.event || "").trim().toLowerCase();
  if (event !== "signup" && event !== "login") {
    return { status: 400, json: { error: 'event must be "signup" or "login"' } };
  }

  const client = supabaseAuthed(accessToken);
  if (!client) {
    return { status: 500, json: { error: "Auth not configured" } };
  }

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData?.user?.email) {
    return { status: 401, json: { error: "Unauthorized" } };
  }

  const user = userData.user;
  const email = user.email.trim().toLowerCase();
  const fullName =
    String(body?.full_name || "").trim() ||
    String(user.user_metadata?.full_name || "").trim() ||
    null;

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
        status: userResult.status && userResult.status >= 400 ? userResult.status : 502,
        json: { error: userResult.error },
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
      // User email already sent — still report success with a warning.
      return {
        status: 200,
        json: {
          ok: true,
          event,
          user_email_id: userResult.id,
          admin_error: adminResult.error,
        },
      };
    }

    return {
      status: 200,
      json: {
        ok: true,
        event,
        user_email_id: userResult.id,
        admin_email_id: adminResult.id,
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
      status: result.status && result.status >= 400 ? result.status : 502,
      json: { error: result.error },
    };
  }

  return { status: 200, json: { ok: true, event, id: result.id } };
}
