import { buffer } from "node:stream/consumers";
import { handleBeforeUserCreated } from "../server/auth/handlers/before-user-created.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (req.readable) {
    const buf = await buffer(req);
    return buf.toString("utf8");
  }
  return JSON.stringify(req.body ?? {});
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const result = await handleBeforeUserCreated(rawBody, req.headers);
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/auth-before-user-created]", err);
    res.status(500).json({ error: { message: "Internal server error", http_code: 500 } });
  }
}
