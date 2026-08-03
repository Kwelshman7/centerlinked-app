/** Shared OG helpers safe for Edge middleware (no native modules). */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Same default preview art as index.html — used when an org has no usable logo. */
export const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/170e9ec4-cd01-4bc9-83f3-f3d5bbee0de8";

const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "auth",
  "request-access",
  "privacy",
  "terms",
  "create-organization",
  "app",
  "p",
  "o",
  "assets",
  "favicon.png",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "placeholder.svg",
]);

export function isSocialPreviewBot(userAgent) {
  if (!userAgent) return false;
  return /bot|crawl|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|discord|telegram|preview|embed|applebot|imessage|slack/i.test(
    userAgent,
  );
}

/** Public org/program URLs that should never use the default CenterLinked OG card. */
export function isPublicSharePath(pathname) {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/") return false;
  if (
    path.startsWith("/app") ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth") ||
    path.startsWith("/request-access") ||
    path.startsWith("/privacy") ||
    path.startsWith("/terms") ||
    path.startsWith("/create-organization") ||
    path.startsWith("/assets")
  ) {
    return false;
  }
  if (/^\/o\/[^/]+\/p\/[^/]+$/.test(path)) return true;
  if (/^\/o\/[^/]+$/.test(path)) return true;
  if (/^\/p\/[^/]+$/.test(path)) return true;
  const short = path.match(/^\/([^/]+)$/);
  return !!(short && !RESERVED_SLUGS.has(short[1]));
}

export function siteOrigin() {
  return (process.env.SITE_URL || "https://www.centerlinked.com").replace(/\/+$/, "");
}

export function orgOgImagePath(slug) {
  return `/api/og-image?slug=${encodeURIComponent(slug)}`;
}

export function orgOgImageUrl(slug) {
  return `${siteOrigin()}${orgOgImagePath(slug)}`;
}

/**
 * Normalize stored logo values to a public HTTPS URL.
 * Uploads already store full public URLs; also accept bare storage paths.
 */
export function resolvePublicLogoUrl(logoUrl) {
  const raw = (logoUrl ?? "").trim();
  if (!raw) return null;

  if (/^https:\/\//i.test(raw)) return raw;
  if (/^http:\/\//i.test(raw)) return `https://${raw.slice("http://".length)}`;

  const base = (process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  if (!base) return null;

  const path = raw.replace(/^\/+/, "");
  if (path.startsWith("storage/v1/")) return `${base}/${path}`;
  if (path.startsWith("object/public/")) return `${base}/storage/v1/${path}`;
  return `${base}/storage/v1/object/public/org-logos/${path}`;
}

/** Absolute share-image URL for an org, or the CenterLinked default. */
export function resolveOrgShareImageUrl(org) {
  if (org?.slug && resolvePublicLogoUrl(org.logo_url)) {
    return orgOgImageUrl(org.slug);
  }
  return DEFAULT_OG_IMAGE;
}
