import sharp from "sharp";
import {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  isAllowedLogoHost,
  orgOgImagePath,
  orgOgImageUrl,
  resolveOrgShareImageUrl,
  resolvePublicLogoUrl,
} from "./og-share.mjs";

export {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  orgOgImagePath,
  orgOgImageUrl,
  resolveOrgShareImageUrl,
  resolvePublicLogoUrl,
};

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_FETCH_MS = 8_000;
const PAD_X = 96;
const PAD_Y = 72;
const NAME_BAND = 88;
const LOGO_MAX_W = OG_WIDTH - PAD_X * 2;
const LOGO_MAX_H = OG_HEIGHT - PAD_Y * 2 - NAME_BAND;

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function supabaseOrgQuery(slug, select) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key || !slug) return { ok: false, row: null };

  try {
    const res = await fetch(
      `${base}/rest/v1/organizations?slug=eq.${encodeURIComponent(slug)}&select=${select}&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) {
      return { ok: false, row: null, status: res.status };
    }
    const rows = await res.json();
    return { ok: true, row: rows[0] ?? null };
  } catch (err) {
    console.error("[og-image] org query error", err?.message || err);
    return { ok: false, row: null };
  }
}

async function supabaseOrgBySlug(slug) {
  const withFavicon = await supabaseOrgQuery(slug, "name,slug,logo_url,favicon_url");
  if (withFavicon.ok) return withFavicon.row;

  const fallback = await supabaseOrgQuery(slug, "name,slug,logo_url");
  if (!fallback.ok) {
    console.error("[og-image] org query failed", fallback.status);
  }
  return fallback.row;
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

function isAllowedLogoFetchUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (isBlockedIpLiteral(host)) return false;
  return isAllowedLogoHost(host);
}

async function fetchLogoBuffer(url) {
  if (!isAllowedLogoFetchUrl(url)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGO_FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
      redirect: "error",
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
 * Build a 1200×630 PNG with the org favicon (preferred) or logo, plus name.
 * Returns null when the org/mark cannot be used — caller should fall back.
 */
export async function renderOrgOgImage(slug) {
  if (!slug || typeof slug !== "string") return null;

  const org = await supabaseOrgBySlug(slug.trim());
  if (!org?.name) return null;

  let logoBuf = await fetchLogoBuffer(resolvePublicLogoUrl(org.favicon_url));
  if (!logoBuf) {
    logoBuf = await fetchLogoBuffer(resolvePublicLogoUrl(org.logo_url));
  }
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
