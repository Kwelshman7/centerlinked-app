import { handleSendVerificationReminders } from "../server/email/handlers/send-verification-reminders.mjs";

export const config = {
  maxDuration: 60,
};

function getBearerToken(req) {
  const header = req.headers?.authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

/**
 * Cron target. Vercel sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations; without a configured secret this route refuses to run so it can
 * never be triggered anonymously.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[api/send-verification-reminders] CRON_SECRET is not configured");
    res.status(503).json({ error: "Service is not configured" });
    return;
  }
  if (getBearerToken(req) !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const dryRun = String(req.query?.dryRun ?? "") === "1";

  try {
    const result = await handleSendVerificationReminders({ dryRun });
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/send-verification-reminders]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
