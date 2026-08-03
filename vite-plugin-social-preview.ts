import type { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { isPublicSharePath, isSocialPreviewBot } from "./server/og-share.mjs";
import { renderPreviewHtml } from "./server/og-meta.mjs";
import { DEFAULT_OG_IMAGE, renderOrgOgImage } from "./server/og-image.mjs";

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
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        if (!req.url) return next();

        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;

        if (pathname === "/api/og-image") {
          const slug = url.searchParams.get("slug");
          try {
            const image = slug ? await renderOrgOgImage(slug) : null;
            if (!image) {
              res.statusCode = 302;
              res.setHeader("Location", DEFAULT_OG_IMAGE);
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
            res.statusCode = 302;
            res.setHeader("Location", DEFAULT_OG_IMAGE);
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
