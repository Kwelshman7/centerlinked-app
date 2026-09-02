import { handleSendOrgInvite } from "../server/email/handlers/send-org-invite.mjs";

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
    const result = await handleSendOrgInvite(body, getBearerToken(req));
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/send-org-invite]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
