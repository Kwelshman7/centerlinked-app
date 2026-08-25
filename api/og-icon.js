import { renderOrgOgIcon } from "../server/og-image.mjs";

/**
 * Same-origin org favicon for shared links.
 * Never redirects to the CenterLinked marketing favicon.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method not allowed");
    return;
  }

  const slug = req.query.slug;
  if (typeof slug !== "string" || !slug.trim()) {
    res.status(400).end();
    return;
  }

  try {
    const image = await renderOrgOgIcon(slug.trim());
    if (!image) {
      res.status(404).end();
      return;
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Disposition", `inline; filename="icon-${encodeURIComponent(image.slug)}.png"`);
    res.setHeader("Vary", "Accept");
    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }
    res.status(200).end(image.buffer);
  } catch (err) {
    console.error("[og-icon] handler error", err?.message || err);
    res.status(500).end();
  }
}
