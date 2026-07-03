import { readFileSync } from "fs";
import { join } from "path";
import { renderPreviewHtml } from "../server/og-meta.mjs";

const indexHtml = readFileSync(join(process.cwd(), "dist/index.html"), "utf8");

export default async function handler(req, res) {
  const path = req.query.path;
  if (typeof path !== "string" || !path.startsWith("/")) {
    res.status(400).end("Missing path");
    return;
  }

  const html = await renderPreviewHtml(path, indexHtml);
  if (!html) {
    res.status(404).end("Not found");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).end(html);
}
