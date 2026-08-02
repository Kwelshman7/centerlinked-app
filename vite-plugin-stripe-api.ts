import type { Plugin } from "vite";
import { getBearerToken, readJsonBody, sendJson } from "./server/email/http.mjs";
import { handleBillingOverview } from "./server/stripe/handlers/billing-overview.mjs";
import { handleCreateCheckoutSession } from "./server/stripe/handlers/create-checkout-session.mjs";
import { handleCreatePortalSession } from "./server/stripe/handlers/create-portal-session.mjs";
import { handleStripeWebhook } from "./server/stripe/handlers/webhook.mjs";

const JSON_PATHS = new Set([
  "/api/create-checkout-session",
  "/api/create-portal-session",
]);

async function readRawBody(req: import("http").IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Local Vite middleware for Stripe billing API routes
 * (same handlers as Vercel serverless routes).
 */
export function stripeApiPlugin(): Plugin {
  return {
    name: "centerlinked-stripe-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url ? new URL(req.url, "http://localhost").pathname : "";

        if (pathname === "/api/stripe-webhook") {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
            res.end();
            return;
          }
          if (req.method !== "POST") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }
          try {
            const rawBody = await readRawBody(req);
            const signature = req.headers["stripe-signature"];
            const result = await handleStripeWebhook(rawBody, signature);
            sendJson(res, result.status, result.json);
          } catch (err) {
            console.error("[stripe-api webhook]", err);
            sendJson(res, 500, { error: "Internal server error" });
          }
          return;
        }

        if (pathname === "/api/billing-overview") {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.end();
            return;
          }
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }
          try {
            const result = await handleBillingOverview(getBearerToken(req));
            sendJson(res, result.status, result.json);
          } catch (err) {
            console.error("[stripe-api billing-overview]", err);
            sendJson(res, 500, { error: "Internal server error" });
          }
          return;
        }

        if (!JSON_PATHS.has(pathname)) {
          return next();
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.end();
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const body = await readJsonBody(req);
          if (body === null) {
            sendJson(res, 400, { error: "Invalid JSON body" });
            return;
          }

          const token = getBearerToken(req);
          const result =
            pathname === "/api/create-portal-session"
              ? await handleCreatePortalSession(body, token)
              : await handleCreateCheckoutSession(body, token);
          sendJson(res, result.status, result.json);
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === "BODY_TOO_LARGE") {
            sendJson(res, 413, { error: "Request body too large" });
            return;
          }
          console.error("[stripe-api]", err);
          sendJson(res, 500, { error: "Internal server error" });
        }
      });
    },
  };
}
