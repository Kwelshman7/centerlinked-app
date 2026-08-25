import { handleOnePagerCopy } from "../server/one-pager-copy.mjs";

export const config = {
  api: {
    bodyParser: { sizeLimit: "24kb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await handleOnePagerCopy(body);
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/one-pager-copy]", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}
