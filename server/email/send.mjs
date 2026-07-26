import { ADMIN_NOTIFY_EMAIL, EMAIL_FROM } from "./config.mjs";

/**
 * Send an email via Resend's HTTP API.
 * @returns {{ ok: true, id: string } | { ok: false, error: string, status?: number }}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const recipients = Array.isArray(to) ? to : [to];
  const payload = {
    from: EMAIL_FROM,
    to: recipients,
    subject,
    html,
    text,
  };
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.message || body?.error || `Resend error (${res.status})`;
    return { ok: false, error: message, status: res.status };
  }

  return { ok: true, id: body.id };
}

export function adminNotifyAddress() {
  return ADMIN_NOTIFY_EMAIL;
}
