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

function isUsablePublicOrigin(value) {
  const raw = (value || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    // Never emit localhost / loopback into production share metadata.
    if (/^(localhost|127\.0\.0\.1)$/i.test(u.hostname)) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export function siteOrigin() {
  const candidates = [
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    "https://www.centerlinked.com",
  ];
  for (const candidate of candidates) {
    const origin = isUsablePublicOrigin(candidate);
    if (origin) return origin;
  }
  return "https://www.centerlinked.com";
}

export function orgOgImagePath(slug, opts = {}) {
  const params = new URLSearchParams({ slug: String(slug) });
  // Cache-bust when the card is built from a favicon so CDN entries for the
  // older logo-only image are not reused.
  if (opts.icon) params.set("i", "1");
  return `/api/og-image?${params.toString()}`;
}

export function orgOgImageUrl(slug, opts = {}) {
  return `${siteOrigin()}${orgOgImagePath(slug, opts)}`;
}

/**
 * Normalize stored logo values to a public HTTPS URL.
 * Uploads already store full public URLs; also accept bare storage paths.
 */
export function resolvePublicLogoUrl(logoUrl) {
  const raw = (logoUrl ?? "").trim();
  if (!raw) return null;

  if (/^https:\/\//i.test(raw)) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      const supabaseHost = process.env.VITE_SUPABASE_URL
        ? new URL(process.env.VITE_SUPABASE_URL).hostname.toLowerCase()
        : "";
      const siteHost = process.env.SITE_URL
        ? new URL(process.env.SITE_URL).hostname.toLowerCase()
        : "www.centerlinked.com";
      if (
        host === supabaseHost
        || host.endsWith(".supabase.co")
        || host === siteHost
        || host === "www.centerlinked.com"
        || host === "centerlinked.com"
      ) {
        return raw;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (/^http:\/\//i.test(raw)) {
    return resolvePublicLogoUrl(`https://${raw.slice("http://".length)}`);
  }

  const base = (process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  if (!base) return null;

  const path = raw.replace(/^\/+/, "");
  if (path.startsWith("storage/v1/")) return `${base}/${path}`;
  if (path.startsWith("object/public/")) return `${base}/storage/v1/${path}`;
  return `${base}/storage/v1/object/public/org-logos/${path}`;
}

/** Absolute share-image URL for an org, or the CenterLinked default. */
export function resolveOrgShareImageUrl(org) {
  if (!org?.slug) return DEFAULT_OG_IMAGE;
  if (resolvePublicLogoUrl(org.favicon_url)) {
    return orgOgImageUrl(org.slug, { icon: true });
  }
  if (resolvePublicLogoUrl(org.logo_url)) {
    return orgOgImageUrl(org.slug);
  }
  return DEFAULT_OG_IMAGE;
}
