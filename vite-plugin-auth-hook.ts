import type { Plugin } from "vite";
import { sendJson } from "./server/email/http.mjs";
import { handleBeforeUserCreated } from "./server/auth/handlers/before-user-created.mjs";

async function readRawBody(req: import("http").IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Local Vite middleware for Supabase before-user-created Auth Hook. */
export function authHookPlugin(): Plugin {
  return {
    name: "centerlinked-auth-hook",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url ? new URL(req.url, "http://localhost").pathname : "";
        if (pathname !== "/api/auth-before-user-created") {
          return next();
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const rawBody = await readRawBody(req);
          const result = await handleBeforeUserCreated(rawBody, req.headers as Record<string, string>);
          sendJson(res, result.status, result.json);
        } catch (err) {
          console.error("[auth-hook]", err);
          sendJson(res, 500, { error: { message: "Internal server error", http_code: 500 } });
        }
      });
    },
  };
}
