import { handleCreatePortalSession } from "../server/stripe/handlers/create-portal-session.mjs";
import { setBillingCors } from "../server/lib/cors.mjs";

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
  setBillingCors(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await handleCreatePortalSession(body, getBearerToken(req));
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/create-portal-session]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
