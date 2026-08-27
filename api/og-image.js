import { renderOrgOgImage, renderOrgOgIcon } from "../server/og-image.mjs";

/**
 * Dynamic org share assets for a public organization profile.
 * Keyed by slug so crawler caches never mix org previews.
 * Never redirects to the CenterLinked marketing graphic.
 *
 * `/api/og-icon` rewrites here (`variant=icon`). Public URLs stay `/api/og-icon`.
 */
function isIconRequest(req) {
  const variant = req.query?.variant;
  if (variant === "icon") return true;
  if (Array.isArray(variant) && variant.includes("icon")) return true;
  const url = typeof req.url === "string" ? req.url : "";
  return url.startsWith("/api/og-icon");
}

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

  const icon = isIconRequest(req);

  try {
    const image = icon
      ? await renderOrgOgIcon(slug.trim())
      : await renderOrgOgImage(slug.trim());
    if (!image) {
      res.status(404).end();
      return;
    }

    const kind = icon ? "icon" : "og";
    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Disposition", `inline; filename="${kind}-${encodeURIComponent(image.slug)}.png"`);
    // Prevent intermediary caches from serving one org's image for another slug.
    res.setHeader("Vary", "Accept");
    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }
    res.status(200).end(image.buffer);
  } catch (err) {
    console.error(icon ? "[og-icon] handler error" : "[og-image] handler error", err?.message || err);
    res.status(500).end();
  }
}
