import { handleNotifyAccessRequest } from "../server/email/handlers/notify-access-request.mjs";

export const config = {
  api: {
    bodyParser: { sizeLimit: "16kb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await handleNotifyAccessRequest(body, req.headers);
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/notify-access-request] unexpected handler failure");
    res.status(500).json({ error: "Internal server error" });
  }
}
