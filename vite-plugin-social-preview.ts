import type { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { injectSocialMeta, isPublicSharePath, resolvePublicMeta } from "./server/og-meta.mjs";

export function socialPreviewPlugin(): Plugin {
  let indexHtml = "";

  return {
    name: "centerlinked-social-preview",
    configResolved(config) {
      const htmlPath = path.resolve(config.root, "index.html");
      indexHtml = fs.readFileSync(htmlPath, "utf8");
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.url) return next();

        const pathname = new URL(req.url, "http://localhost").pathname;

        if (!isPublicSharePath(pathname)) return next();

        try {
          const meta = await resolvePublicMeta(pathname);
          if (!meta) return next();

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(injectSocialMeta(indexHtml, meta));
          return;
        } catch (err) {
          console.error("[social-preview]", err);
          return next();
        }
      });
    },
  };
}
