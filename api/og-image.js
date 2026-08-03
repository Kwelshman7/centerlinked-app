import { DEFAULT_OG_IMAGE, renderOrgOgImage } from "../server/og-image.mjs";

/**
 * Dynamic 1200×630 Open Graph image for a public organization profile.
 * Keyed by slug so crawler caches never mix org previews.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method not allowed");
    return;
  }

  const slug = req.query.slug;
  if (typeof slug !== "string" || !slug.trim()) {
    res.redirect(302, DEFAULT_OG_IMAGE);
    return;
  }

  try {
    const image = await renderOrgOgImage(slug.trim());
    if (!image) {
      res.redirect(302, DEFAULT_OG_IMAGE);
      return;
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Disposition", `inline; filename="og-${encodeURIComponent(image.slug)}.png"`);
    // Prevent intermediary caches from serving one org's image for another slug.
    res.setHeader("Vary", "Accept");
    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }
    res.status(200).end(image.buffer);
  } catch (err) {
    console.error("[og-image] handler error", err?.message || err);
    res.redirect(302, DEFAULT_OG_IMAGE);
  }
}
