import { handlePublicImage } from "../server/public-image.mjs";

/**
 * Same-origin image proxy for PDF one-pager capture (CORS-clean blobs).
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method not allowed");
    return;
  }

  const raw = req.query.url;
  if (typeof raw !== "string" || !raw.trim()) {
    res.status(400).end("Missing url");
    return;
  }

  try {
    const result = await handlePublicImage(raw.trim());
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
    if (!result.body || result.status >= 400) {
      res.status(result.status).end();
      return;
    }
    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }
    res.status(200).end(result.body);
  } catch (err) {
    console.error("[public-image]", err?.message || err);
    res.status(502).end();
  }
}
