import { handleNotifyAccessRequest } from "../server/email/handlers/notify-access-request.mjs";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await handleNotifyAccessRequest(body);
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/notify-access-request]", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
