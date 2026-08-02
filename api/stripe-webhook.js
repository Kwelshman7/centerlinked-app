import { buffer } from "node:stream/consumers";
import { handleStripeWebhook } from "../server/stripe/handlers/webhook.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.readable) return buffer(req);
  return Buffer.from(JSON.stringify(req.body ?? {}));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];
    const result = await handleStripeWebhook(rawBody, signature);
    res.status(result.status).json(result.json);
  } catch (err) {
    console.error("[api/stripe-webhook]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
