import { adminNotifyAddress, sendEmail } from "../send.mjs";
import { accessRequestAdminEmail } from "../templates.mjs";

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Notify admin@centerlinked.com of a new request-access submission.
 * Body: { full_name, email, organization, role?, num_facilities?, notes? }
 */
export async function handleNotifyAccessRequest(body) {
  const full_name = String(body?.full_name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const organization = String(body?.organization || "").trim();
  const role = String(body?.role || "").trim() || null;
  const notes = String(body?.notes || "").trim() || null;
  const numRaw = body?.num_facilities;
  const num_facilities =
    numRaw === "" || numRaw == null ? null : String(numRaw).trim();

  if (!full_name || !email || !organization) {
    return { status: 400, json: { error: "full_name, email, and organization are required" } };
  }
  if (!isValidEmail(email)) {
    return { status: 400, json: { error: "Invalid email address" } };
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
    console.error("[notify-access-request]", result.error);
    return {
      status: result.status && result.status >= 400 ? result.status : 502,
      json: { error: result.error },
    };
  }

  return { status: 200, json: { ok: true, id: result.id } };
}
