/** Shared OG helpers safe for Edge middleware (no native modules). */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Fallback preview art when an org cannot be resolved. Public org URLs always use /api/og-image. */
export const DEFAULT_OG_IMAGE = "https://www.centerlinked.com/og-image.png";

const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "auth",
  "request-access",
  "privacy",
  "terms",
  "create-organization",
  "setup-organization",
  "app",
  "p",
  "o",
  "assets",
  "favicon.png",
  "og-image.png",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "placeholder.svg",
]);

export function isSocialPreviewBot(userAgent) {
  if (!userAgent) return false;
  return /bot|crawl|slurp|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|discord|telegram|preview|embed|applebot|imessage|slack|pinterest|reddit|skype|vkshare|embedly|iframely|opengraph|notion|google-inspectiontool|bingpreview|yandex|duckduckbot|baiduspider|outbrain|nuzzel|buffer|hootsuite|snapchat|line\/|kakaotalk|wechat/i.test(
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
    path.startsWith("/setup-organization") ||
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

/** Bump when share-card generation changes so crawlers do not keep a cached 302 to og-image.png. */
const SHARE_ASSET_VERSION = "5";

export function orgOgImagePath(slug, opts = {}) {
  const params = new URLSearchParams({
    slug: String(slug),
    v: SHARE_ASSET_VERSION,
  });
  // Cache-bust when the card is built from a favicon so CDN entries for the
  // older logo-only image are not reused.
  if (opts.icon) params.set("i", "1");
  return `/api/og-image?${params.toString()}`;
}

/** Same-origin org tab/share icon. Never /favicon.png. */
export function orgOgIconPath(slug, opts = {}) {
  const params = new URLSearchParams({
    slug: String(slug),
    v: SHARE_ASSET_VERSION,
  });
  if (opts.favicon) params.set("f", "1");
  return `/api/og-icon?${params.toString()}`;
}

export function orgOgIconUrl(slug, opts = {}) {
  return `${siteOrigin()}${orgOgIconPath(slug, opts)}`;
}

export function orgOgImageUrl(slug, opts = {}) {
  return `${siteOrigin()}${orgOgImagePath(slug, opts)}`;
}

function isBlockedIpLiteral(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "metadata.google.internal") {
    return true;
  }
  if (h === "::1" || h === "[::1]") return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** True for RFC1918 / loopback / link-local / ULA addresses (after DNS resolve). */
export function isBlockedIpAddress(address) {
  const ip = String(address || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!ip) return true;
  if (isBlockedIpLiteral(ip)) return true;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  if (ip.startsWith("::ffff:")) {
    return isBlockedIpLiteral(ip.slice("::ffff:".length));
  }
  // Unique local fc00::/7
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true;
  return ip === "::1";
}

export { isBlockedIpLiteral };

/** Project storage host + CenterLinked site hosts. */
export function isAllowedLogoHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  const allowed = new Set(["www.centerlinked.com", "centerlinked.com"]);
  for (const raw of [process.env.SITE_URL, process.env.VITE_SUPABASE_URL]) {
    if (!raw) continue;
    try {
      allowed.add(new URL(raw).hostname.toLowerCase());
    } catch {
      /* ignore invalid env */
    }
  }
  return allowed.has(host);
}

/**
 * HTTPS image URLs that are safe to fetch server-side (SSRF-hardened).
 * Org logos are often hosted on the treatment center's own site, not Storage.
 */
export function isSafeHttpsImageUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (!host.includes(".")) return false;
  if (isBlockedIpLiteral(host)) return false;
  return true;
}

/**
 * Normalize stored logo values to a public HTTPS URL.
 * Uploads already store full public URLs; also accept bare storage paths
 * and org-website logos (https only, private IPs rejected).
 */
export function resolvePublicLogoUrl(logoUrl) {
  const raw = (logoUrl ?? "").trim();
  if (!raw) return null;

  if (/^https:\/\//i.test(raw)) {
    return isSafeHttpsImageUrl(raw) ? raw : null;
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

/** Always a generated 1200×630 card for public orgs — never the marketing landing graphic. */
export function resolveOrgShareImageUrl(org) {
  if (!org?.slug) return DEFAULT_OG_IMAGE;
  const usesIcon = !!(org.favicon_url && resolvePublicLogoUrl(org.favicon_url));
  return orgOgImageUrl(org.slug, { icon: usesIcon });
}

/** Same-origin favicon PNG for crawlers. Favicon file first, then logo, never CenterLinked. */
export function resolveOrgShareIconUrl(org) {
  if (!org?.slug) return null;
  return orgOgIconUrl(org.slug, { favicon: !!(org.favicon_url && resolvePublicLogoUrl(org.favicon_url)) });
}
