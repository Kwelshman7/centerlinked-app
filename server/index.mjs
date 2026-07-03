import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { injectSocialMeta, isPublicSharePath, resolvePublicMeta } from "./og-meta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist");
const indexPath = path.join(distDir, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");
const port = Number(process.env.PORT) || 8080;

const app = express();

app.use(express.static(distDir, { index: false }));

app.get("*", async (req, res) => {
  if (isPublicSharePath(req.path)) {
    try {
      const meta = await resolvePublicMeta(req.path);
      if (meta) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300");
        res.send(injectSocialMeta(indexHtml, meta));
        return;
      }
    } catch (err) {
      console.error("OG meta resolution failed:", err);
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(indexPath);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`CenterLinked server listening on http://0.0.0.0:${port}`);
});
