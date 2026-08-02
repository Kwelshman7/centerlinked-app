import { handleNotifyAuthEvent } from "../server/email/handlers/notify-auth-event.mjs";

export const config = {
  api: {
    bodyParser: { sizeLimit: "16kb" },
  },
};

function getBearerToken(req) {
  const header = req.headers?.authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await handleNotifyAuthEvent(body, getBearerToken(req));
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/notify-auth-event]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
