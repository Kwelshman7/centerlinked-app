import fs from "node:fs";
import sharp from "sharp";
import {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  orgOgImagePath,
  orgOgImageUrl,
  resolveOrgShareImageUrl,
  resolvePublicLogoUrl,
} from "./og-share.mjs";
import { fetchSafeImageBuffer } from "./safe-image-fetch.mjs";

export {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  orgOgImagePath,
  orgOgImageUrl,
  resolveOrgShareImageUrl,
  resolvePublicLogoUrl,
};

const PAD_X = 96;
const PAD_Y = 72;

const OG_FONT_FILES = [
  "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  "/Library/Fonts/Arial Bold.ttf",
];

let cachedFontCss = undefined;

function ogFontCss() {
  if (cachedFontCss !== undefined) return cachedFontCss;
  for (const file of OG_FONT_FILES) {
    try {
      if (!fs.existsSync(file)) continue;
      const b64 = fs.readFileSync(file).toString("base64");
      cachedFontCss = `@font-face{font-family:OgSans;src:url('data:font/ttf;base64,${b64}') format('truetype');font-weight:700;font-style:normal;}`;
      return cachedFontCss;
    } catch {
      /* next candidate */
    }
  }
  cachedFontCss = "";
  return cachedFontCss;
}

function svgText(x, y, size, opacity, content) {
  const css = ogFontCss();
  if (!css) return "";
  return `<text x="${x}" y="${y}" font-family="OgSans" font-size="${size}" font-weight="700" fill="#ffffff" fill-opacity="${opacity}">${content}</text>`;
}

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
  const withBrand = await supabaseOrgQuery(
    slug,
    "name,slug,logo_url,favicon_url,cover_image_url,brand_color",
  );
  if (withBrand.ok) return withBrand.row;

  const withFavicon = await supabaseOrgQuery(slug, "name,slug,logo_url,favicon_url");
  if (withFavicon.ok) return withFavicon.row;

  const fallback = await supabaseOrgQuery(slug, "name,slug,logo_url");
  if (!fallback.ok) {
    console.error("[og-image] org query failed", fallback.status);
  }
  return fallback.row;
}

async function fetchLogoBuffer(url) {
  const image = await fetchSafeImageBuffer(url);
  if (!image) return null;
  try {
    await sharp(image.buffer).metadata();
    return image.buffer;
  } catch (err) {
    console.error("[og-image] logo decode failed", err?.message || err);
    return null;
  }
}

function brandBackgroundSvg(name, brand) {
  const label = escapeXml(name);
  const fill = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(brand || "").trim())
    ? String(brand).trim()
    : "#1A73E8";
  const css = ogFontCss();
  return Buffer.from(`
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${css ? `<defs><style>${css}</style></defs>` : ""}
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${escapeXml(fill)}"/>
  <rect x="0" y="${OG_HEIGHT - 140}" width="${OG_WIDTH}" height="140" fill="#000000" fill-opacity="0.28"/>
  ${svgText(PAD_X, OG_HEIGHT - 58, 42, 1, label)}
  ${svgText(PAD_X, OG_HEIGHT - 28, 20, 0.8, "Referral profile")}
</svg>`);
}

function nameBandSvg(name) {
  const css = ogFontCss();
  return Buffer.from(`
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${css ? `<defs><style>${css}</style></defs>` : ""}
  <rect x="0" y="${OG_HEIGHT - 160}" width="${OG_WIDTH}" height="160" fill="#081020" fill-opacity="0.62"/>
  ${svgText(PAD_X, OG_HEIGHT - 68, 42, 1, escapeXml(name))}
  ${svgText(PAD_X, OG_HEIGHT - 32, 20, 0.82, "Referral profile")}
</svg>`);
}

async function coverBackground(coverBuf, name, brand) {
  if (!coverBuf) {
    return sharp(brandBackgroundSvg(name, brand)).png().toBuffer();
  }
  try {
    const photo = await sharp(coverBuf)
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
      .modulate({ brightness: 0.62 })
      .png()
      .toBuffer();
    return sharp(photo).composite([{ input: nameBandSvg(name), left: 0, top: 0 }]).png().toBuffer();
  } catch {
    return sharp(brandBackgroundSvg(name, brand)).png().toBuffer();
  }
}

function initialsFor(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function brandFill(brand) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(brand || "").trim())
    ? String(brand).trim()
    : "#1A73E8";
}

/**
 * Build a 1200×630 PNG: cover photo when available, org favicon/logo, org name.
 * Always returns a branded card when the org exists — never the marketing landing graphic.
 */
export async function renderOrgOgImage(slug) {
  if (!slug || typeof slug !== "string") return null;

  const org = await supabaseOrgBySlug(slug.trim());
  if (!org?.name) return null;

  const [faviconBuf, logoMarkBuf, coverBuf] = await Promise.all([
    fetchLogoBuffer(resolvePublicLogoUrl(org.favicon_url)),
    fetchLogoBuffer(resolvePublicLogoUrl(org.logo_url)),
    fetchLogoBuffer(resolvePublicLogoUrl(org.cover_image_url)),
  ]);
  const logoBuf = logoMarkBuf || faviconBuf;

  try {
    const base = await coverBackground(coverBuf, org.name, org.brand_color);
    const layers = [];

    if (logoBuf) {
      try {
        const logo = await sharp(logoBuf)
          .rotate()
          .resize(280, 280, { fit: "inside", withoutEnlargement: true })
          .png()
          .toBuffer({ resolveWithObject: true });
        const tile = await sharp({
          create: {
            width: logo.info.width + 32,
            height: logo.info.height + 32,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0.96 },
          },
        })
          .png()
          .composite([{ input: logo.data, left: 16, top: 16 }])
          .toBuffer();
        layers.push({ input: tile, left: PAD_X, top: PAD_Y });
      } catch (err) {
        console.error("[og-image] logo composite failed", err?.message || err);
      }
    }

    const png = await sharp(base).composite(layers).png().toBuffer();

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
    try {
      const png = await sharp(brandBackgroundSvg(org.name, org.brand_color)).png().toBuffer();
      return {
        buffer: png,
        contentType: "image/png",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        alt: `${org.name} logo`,
        slug: org.slug || slug,
      };
    } catch (fallbackErr) {
      console.error("[og-image] brand fallback failed", fallbackErr?.message || fallbackErr);
      return null;
    }
  }
}

const ICON_SIZE = 180;

function initialsIconSvg(name, brand) {
  const fill = escapeXml(brandFill(brand));
  const label = escapeXml(initialsFor(name) || "•");
  const css = ogFontCss();
  const text = css
    ? `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="OgSans" font-size="72" font-weight="700" fill="#ffffff">${label}</text>`
    : "";
  return Buffer.from(`
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${css ? `<defs><style>${css}</style></defs>` : ""}
  <rect width="${ICON_SIZE}" height="${ICON_SIZE}" rx="32" fill="${fill}"/>
  ${text}
</svg>`);
}

async function rasterUploadedFavicon(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(ICON_SIZE, ICON_SIZE, {
      fit: "cover",
      position: "centre",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
}

async function rasterLogoAsIcon(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(ICON_SIZE, ICON_SIZE, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
}

/**
 * Square PNG for tab icons and share-link previews.
 * 1) organizations.favicon_url (Settings upload)
 * 2) organizations.logo_url
 * 3) org initials on brand_color
 * Never CenterLinked art.
 */
export async function renderOrgOgIcon(slug) {
  if (!slug || typeof slug !== "string") return null;

  const org = await supabaseOrgBySlug(slug.trim());
  if (!org?.name) return null;

  const result = (buffer) => ({
    buffer,
    contentType: "image/png",
    slug: org.slug || slug,
  });

  const faviconBuf = await fetchLogoBuffer(resolvePublicLogoUrl(org.favicon_url));
  if (faviconBuf) {
    try {
      return result(await rasterUploadedFavicon(faviconBuf));
    } catch (err) {
      console.error("[og-icon] favicon raster failed", err?.message || err);
    }
  }

  const logoBuf = await fetchLogoBuffer(resolvePublicLogoUrl(org.logo_url));
  if (logoBuf) {
    try {
      return result(await rasterLogoAsIcon(logoBuf));
    } catch (err) {
      console.error("[og-icon] logo raster failed", err?.message || err);
    }
  }

  try {
    return result(await sharp(initialsIconSvg(org.name, org.brand_color)).png().toBuffer());
  } catch (err) {
    console.error("[og-icon] initials fallback failed", err?.message || err);
    return null;
  }
}
