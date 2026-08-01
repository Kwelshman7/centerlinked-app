import { handleBillingOverview } from "../server/stripe/handlers/billing-overview.mjs";

function getBearerToken(req) {
  const header = req.headers?.authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const result = await handleBillingOverview(getBearerToken(req));
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/billing-overview]", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
