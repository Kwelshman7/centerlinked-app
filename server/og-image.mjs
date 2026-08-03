import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Same default preview art as index.html — used when an org has no usable logo. */
export const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/170e9ec4-cd01-4bc9-83f3-f3d5bbee0de8";

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_FETCH_MS = 8_000;
const PAD_X = 96;
const PAD_Y = 72;
const NAME_BAND = 88;
const LOGO_MAX_W = OG_WIDTH - PAD_X * 2;
const LOGO_MAX_H = OG_HEIGHT - PAD_Y * 2 - NAME_BAND;

function siteUrl() {
  return (process.env.SITE_URL || "https://www.centerlinked.com").replace(/\/+$/, "");
}

export function orgOgImagePath(slug) {
  return `/api/og-image?slug=${encodeURIComponent(slug)}`;
}

export function orgOgImageUrl(slug) {
  return `${siteUrl()}${orgOgImagePath(slug)}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

async function supabaseOrgBySlug(slug) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key || !slug) return null;

  try {
    const res = await fetch(
      `${base}/rest/v1/organizations?slug=eq.${encodeURIComponent(slug)}&select=name,slug,logo_url&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) {
      console.error("[og-image] org query failed", res.status);
      return null;
    }
    const rows = await res.json();
    return rows[0] ?? null;
  } catch (err) {
    console.error("[og-image] org query error", err?.message || err);
    return null;
  }
}

async function fetchLogoBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGO_FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (type && !type.startsWith("image/") && !type.includes("octet-stream")) {
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > LOGO_MAX_BYTES) return null;

    // Validate / normalize via sharp (rejects unsupported formats).
    await sharp(buf).metadata();
    return buf;
  } catch (err) {
    console.error("[og-image] logo fetch failed", err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function backgroundSvg(name) {
  const label = escapeXml(name);
  return Buffer.from(`
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F7F8FA"/>
      <stop offset="100%" stop-color="#EEF1F5"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <text
    x="${OG_WIDTH / 2}"
    y="${OG_HEIGHT - PAD_Y + 8}"
    text-anchor="middle"
    font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    font-size="34"
    font-weight="600"
    fill="#1F2937"
  >${label}</text>
</svg>`);
}

/**
 * Build a 1200×630 PNG with the org logo (contain) and name.
 * Returns null when the org/logo cannot be used — caller should fall back.
 */
export async function renderOrgOgImage(slug) {
  if (!slug || typeof slug !== "string") return null;

  const org = await supabaseOrgBySlug(slug.trim());
  if (!org?.name) return null;

  const logoUrl = resolvePublicLogoUrl(org.logo_url);
  if (!logoUrl) return null;

  const logoBuf = await fetchLogoBuffer(logoUrl);
  if (!logoBuf) return null;

  try {
    const logo = await sharp(logoBuf)
      .rotate()
      .resize(LOGO_MAX_W, LOGO_MAX_H, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer({ resolveWithObject: true });

    const left = Math.round((OG_WIDTH - logo.info.width) / 2);
    const top = Math.round(PAD_Y + (LOGO_MAX_H - logo.info.height) / 2);

    const png = await sharp(backgroundSvg(org.name))
      .composite([{ input: logo.data, left, top }])
      .png()
      .toBuffer();

    return {
      buffer: png,
      contentType: "image/png",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      alt: `${org.name} logo`,
      slug: org.slug || slug,
    };
  } catch (err) {
    console.error("[og-image] compose failed", err?.message || err);
    return null;
  }
}

/**
 * Absolute share-image URL for an org, or the CenterLinked default.
 */
export function resolveOrgShareImageUrl(org) {
  if (org?.slug && resolvePublicLogoUrl(org.logo_url)) {
    return orgOgImageUrl(org.slug);
  }
  return DEFAULT_OG_IMAGE;
}
