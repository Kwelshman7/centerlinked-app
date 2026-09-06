import { buildSitemapXml } from "../server/sitemap.mjs";

export const config = {
  maxDuration: 15,
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { xml } = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    // Crawlers re-fetch often; an hour of edge cache keeps this off the database.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[api/sitemap]", err);
    res.status(500).json({ error: "Could not build sitemap" });
  }
}
