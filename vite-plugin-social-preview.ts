import type { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { isPublicSharePath, isSocialPreviewBot } from "./server/og-share.mjs";
import { renderPreviewHtml } from "./server/og-meta.mjs";
import { renderOrgOgImage, renderOrgOgIcon } from "./server/og-image.mjs";
import { handlePublicImage } from "./server/public-image.mjs";

/**
 * Dev-only OG preview for crawlers + local /api/og-image.
 * Must NOT intercept normal browsers for public pages — ending the response
 * with raw index.html skips Vite's transformIndexHtml (React Refresh preamble),
 * which leaves public pages as a blank root.
 */
export function socialPreviewPlugin(): Plugin {
  let indexHtml = "";

  return {
    name: "centerlinked-social-preview",
    configResolved(config) {
      indexHtml = fs.readFileSync(path.resolve(config.root, "index.html"), "utf8");
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "POST") return next();
        if (!req.url) return next();

        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;

        if (pathname === "/api/one-pager-copy") {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Allow", "POST");
            res.end("Method not allowed");
            return;
          }
          try {
            const { readJsonBody, sendJson, getBearerToken } = await import("./server/email/http.mjs");
            const { handleOnePagerCopy } = await import("./server/one-pager-copy.mjs");
            const body = await readJsonBody(req);
            if (body === null) {
              sendJson(res, 400, { error: "Invalid JSON body" });
              return;
            }
            const result = await handleOnePagerCopy(body, getBearerToken(req));
            sendJson(res, result.status, result.json);
          } catch (err) {
            console.error("[one-pager-copy]", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
          return;
        }

        if (req.method !== "GET" && req.method !== "HEAD") return next();

        if (pathname === "/api/public-image") {
          const raw = url.searchParams.get("url");
          try {
            const result = await handlePublicImage(raw);
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, String(value));
            }
            if (!result.body || result.status >= 400) {
              res.statusCode = result.status;
              res.end();
              return;
            }
            if (req.method === "HEAD") {
              res.statusCode = 200;
              res.end();
              return;
            }
            res.statusCode = 200;
            res.end(result.body);
          } catch (err) {
            console.error("[public-image]", err);
            res.statusCode = 502;
            res.end();
          }
          return;
        }

        if (pathname === "/api/og-icon") {
          const slug = url.searchParams.get("slug");
          try {
            const image = slug ? await renderOrgOgIcon(slug) : null;
            if (!image) {
              res.statusCode = slug ? 404 : 400;
              res.end();
              return;
            }
            res.setHeader("Content-Type", image.contentType);
            res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
            if (req.method === "HEAD") {
              res.statusCode = 200;
              res.end();
              return;
            }
            res.statusCode = 200;
            res.end(image.buffer);
          } catch (err) {
            console.error("[og-icon]", err);
            res.statusCode = 500;
            res.end();
          }
          return;
        }

        if (pathname === "/api/og-image") {
          const slug = url.searchParams.get("slug");
          try {
            const image = slug ? await renderOrgOgImage(slug) : null;
            if (!image) {
              res.statusCode = slug ? 404 : 400;
              res.end();
              return;
            }
            res.setHeader("Content-Type", image.contentType);
            res.setHeader(
              "Cache-Control",
              "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
            );
            if (req.method === "HEAD") {
              res.statusCode = 200;
              res.end();
              return;
            }
            res.statusCode = 200;
            res.end(image.buffer);
          } catch (err) {
            console.error("[og-image]", err);
            res.statusCode = 500;
            res.end();
          }
          return;
        }

        if (!isPublicSharePath(pathname)) return next();

        const userAgent = req.headers["user-agent"] ?? "";
        if (!isSocialPreviewBot(userAgent)) return next();

        try {
          const html = await renderPreviewHtml(pathname, indexHtml);
          if (!html) return next();

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch (err) {
          console.error("[social-preview]", err);
          next();
        }
      });
    },
  };
}
