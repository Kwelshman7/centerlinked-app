import type { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { isPublicSharePath, renderPreviewHtml } from "./server/og-meta.mjs";

export function socialPreviewPlugin(): Plugin {
  let indexHtml = "";

  return {
    name: "centerlinked-social-preview",
    configResolved(config) {
      indexHtml = fs.readFileSync(path.resolve(config.root, "index.html"), "utf8");
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.url) return next();

        const pathname = new URL(req.url, "http://localhost").pathname;
        if (!isPublicSharePath(pathname)) return next();

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
