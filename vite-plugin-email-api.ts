import type { Plugin } from "vite";
import { getBearerToken, readJsonBody, sendJson } from "./server/email/http.mjs";
import { handleNotifyAccessRequest } from "./server/email/handlers/notify-access-request.mjs";
import { handleNotifyAuthEvent } from "./server/email/handlers/notify-auth-event.mjs";
import { handleSendWelcome } from "./server/email/handlers/send-welcome.mjs";

const EMAIL_API_PATHS = new Set([
  "/api/notify-access-request",
  "/api/send-welcome",
  "/api/notify-auth-event",
]);

/**
 * Local Vite middleware so email API routes work during `npm run dev`
 * (same handlers as Vercel serverless routes).
 */
export function emailApiPlugin(): Plugin {
  return {
    name: "centerlinked-email-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url ? new URL(req.url, "http://localhost").pathname : "";
        if (!EMAIL_API_PATHS.has(pathname)) {
          return next();
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

          if (pathname === "/api/notify-access-request") {
            const result = await handleNotifyAccessRequest(body, req.headers);
            sendJson(res, result.status, result.json);
            return;
          }

          if (pathname === "/api/notify-auth-event") {
            const result = await handleNotifyAuthEvent(body, getBearerToken(req));
            sendJson(res, result.status, result.json);
            return;
          }

          const result = await handleSendWelcome(body, getBearerToken(req));
          sendJson(res, result.status, result.json);
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === "BODY_TOO_LARGE") {
            sendJson(res, 413, { error: "Request body too large" });
            return;
          }
          console.error("[email-api] unexpected handler failure");
          sendJson(res, 500, { error: "Internal server error" });
        }
      });
    },
  };
}
