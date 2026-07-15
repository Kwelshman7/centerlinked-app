import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import { renderPreviewHtml, isPublicSharePath, isSocialPreviewBot } from "./og-meta.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Read the built index.html
const distPath = join(__dirname, "..", "dist");
const indexHtmlPath = join(distPath, "index.html");

if (!existsSync(indexHtmlPath)) {
  console.error("Error: dist/index.html not found. Run 'npm run build' first.");
  process.exit(1);
}

const indexHtml = readFileSync(indexHtmlPath, "utf8");

// Serve static files from dist
app.use(express.static(distPath));

// OG meta API endpoint
app.get("/api/og", async (req, res) => {
  const path = req.query.path;
  if (typeof path !== "string" || !path.startsWith("/")) {
    res.status(400).send("Missing path");
    return;
  }

  const html = await renderPreviewHtml(path, indexHtml);
  if (!html) {
    res.status(404).send("Not found");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(html);
});

// Middleware to handle social media bot requests
app.use((req, res, next) => {
  const userAgent = req.get("user-agent") || "";
  
  if (isSocialPreviewBot(userAgent) && isPublicSharePath(req.path)) {
    // Redirect social media bots to the OG endpoint
    const ogUrl = `/api/og?path=${encodeURIComponent(req.path)}`;
    return res.redirect(ogUrl);
  }
  
  next();
});

// SPA fallback - serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(indexHtmlPath);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
