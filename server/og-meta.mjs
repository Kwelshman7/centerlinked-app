import {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  isPublicSharePath,
  isSocialPreviewBot,
  resolveOrgShareImageUrl,
  resolvePublicLogoUrl,
  siteOrigin,
} from "./og-share.mjs";

export { isPublicSharePath, isSocialPreviewBot };

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function orgDescription(org) {
  const loc = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  return (
    (org.tagline || org.description || "").trim() ||
    `${org.name}${loc ? ` — ${loc}` : ""}. Referral profile.`
  );
}

function buildMeta({ title, description, path, image, icon, siteName, imageAlt }) {
  const origin = siteOrigin();
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "")}`;
  const url = `${origin}${normalizedPath === "/" ? "" : normalizedPath}`;
  const shareImage = image || DEFAULT_OG_IMAGE;
  const isGenerated = shareImage.includes("/api/og-image");

  return {
    title,
    description: (description || "").trim() || "Referral profile.",
    url,
    image: shareImage,
    imageAlt: imageAlt || `${siteName || title} logo`,
    imageWidth: isGenerated || shareImage === DEFAULT_OG_IMAGE ? OG_WIDTH : undefined,
    imageHeight: isGenerated || shareImage === DEFAULT_OG_IMAGE ? OG_HEIGHT : undefined,
    imageType: isGenerated ? "image/png" : undefined,
    icon: icon || null,
    siteName: siteName || title,
    card: "summary_large_image",
  };
}

async function supabaseRow(table, query, opts = {}) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  try {
    const res = await fetch(`${base}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) {
      if (!opts.quiet) {
        console.error("[og-meta] query failed", table, res.status);
      }
      return null;
    }
    const rows = await res.json();
    return rows[0] ?? null;
  } catch (err) {
    if (!opts.quiet) {
      console.error("[og-meta] query error", table, err?.message || err);
    }
    return null;
  }
}

const ORG_SHARE_SELECT =
  "name,tagline,description,logo_url,favicon_url,cover_image_url,hq_city,hq_state,slug";
const ORG_SHARE_SELECT_FALLBACK =
  "name,tagline,description,logo_url,cover_image_url,hq_city,hq_state,slug";

async function supabaseOrg(filter) {
  const row = await supabaseRow(
    "organizations",
    `${filter}&select=${ORG_SHARE_SELECT}&limit=1`,
    { quiet: true },
  );
  if (row) return row;
  return supabaseRow(
    "organizations",
    `${filter}&select=${ORG_SHARE_SELECT_FALLBACK}&limit=1`,
  );
}

function resolveShareIcon(org) {
  return resolvePublicLogoUrl(org?.favicon_url) || resolvePublicLogoUrl(org?.logo_url);
}

export async function resolvePublicMeta(pathname) {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  const orgProgram = path.match(/^\/o\/([^/]+)\/p\/([^/]+)$/);
  if (orgProgram) {
    const [, orgSlug, programSlug] = orgProgram;
    const facility = await supabaseRow(
      "facilities",
      `slug=eq.${encodeURIComponent(programSlug)}&verification_status=eq.approved&select=name,tagline,description,image_urls,organization_id&limit=1`,
    );
    if (!facility) return null;

    const org = await supabaseOrg(
      `id=eq.${encodeURIComponent(facility.organization_id)}`,
    );
    if (!org || org.slug !== orgSlug) return null;

    return buildMeta({
      title: `${facility.name} — ${org.name}`,
      description: facility.description || facility.tagline || orgDescription(org),
      path,
      image: resolveOrgShareImageUrl(org),
      icon: resolveShareIcon(org),
      siteName: org.name,
      imageAlt: `${org.name} logo`,
    });
  }

  const orgScoped = path.match(/^\/o\/([^/]+)$/);
  if (orgScoped) {
    const org = await supabaseOrg(
      `slug=eq.${encodeURIComponent(orgScoped[1])}`,
    );
    if (!org) return null;
    return buildMeta({
      title: org.name,
      description: orgDescription(org),
      path: `/o/${org.slug}`,
      image: resolveOrgShareImageUrl(org),
      icon: resolveShareIcon(org),
      siteName: org.name,
      imageAlt: `${org.name} logo`,
    });
  }

  const legacyProgram = path.match(/^\/p\/([^/]+)$/);
  if (legacyProgram) {
    const facility = await supabaseRow(
      "facilities",
      `slug=eq.${encodeURIComponent(legacyProgram[1])}&verification_status=eq.approved&select=name,tagline,description,image_urls,organization_id&limit=1`,
    );
    if (!facility) return null;

    const org = await supabaseOrg(
      `id=eq.${encodeURIComponent(facility.organization_id)}`,
    );
    if (!org) return null;

    const canonicalPath = org.slug
      ? `/o/${org.slug}/p/${legacyProgram[1]}`
      : `/p/${legacyProgram[1]}`;

    return buildMeta({
      title: `${facility.name} — ${org.name}`,
      description: facility.description || facility.tagline || orgDescription(org),
      path: canonicalPath,
      image: resolveOrgShareImageUrl(org),
      icon: resolveShareIcon(org),
      siteName: org.name,
      imageAlt: `${org.name} logo`,
    });
  }

  const shortOrg = path.match(/^\/([^/]+)$/);
  if (shortOrg && isPublicSharePath(path)) {
    const org = await supabaseOrg(
      `slug=eq.${encodeURIComponent(shortOrg[1])}`,
    );
    if (!org) return null;
    return buildMeta({
      title: org.name,
      description: orgDescription(org),
      path: `/o/${org.slug}`,
      image: resolveOrgShareImageUrl(org),
      icon: resolveShareIcon(org),
      siteName: org.name,
      imageAlt: `${org.name} logo`,
    });
  }

  return null;
}

export async function renderPreviewHtml(pathname, baseHtml) {
  try {
    const meta = await resolvePublicMeta(pathname);
    if (!meta) return null;
    return injectSocialMeta(baseHtml, meta);
  } catch (err) {
    console.error("[og-meta] render failed", err?.message || err);
    return null;
  }
}

export function injectSocialMeta(baseHtml, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const siteName = escapeHtml(meta.siteName);
  const card = "summary_large_image";
  const image = escapeHtml(meta.image || DEFAULT_OG_IMAGE);
  const imageAlt = escapeHtml(meta.imageAlt || `${meta.siteName || meta.title} logo`);
  const icon = meta.icon ? escapeHtml(meta.icon) : null;

  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}">`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${url}">`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}">`)
    .replace(/<meta name="twitter:card"[^>]*>/i, `<meta name="twitter:card" content="${card}">`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">`);

  if (!html.includes('property="og:site_name"')) {
    html = html.replace(
      /<meta property="og:type"/i,
      `<meta property="og:site_name" content="${siteName}">\n    <meta property="og:type"`,
    );
  } else {
    html = html.replace(/<meta property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${siteName}">`);
  }

  // Drop platform-default CenterLinked preview art for org-branded shares.
  html = html.replace(/\n?\s*<meta name="twitter:site"[^>]*>/i, "");

  if (icon) {
    html = html.replace(
      /<link rel="icon"[^>]*>/i,
      `<link rel="icon" href="${icon}">\n    <link rel="apple-touch-icon" href="${icon}">`,
    );
  }

  // Always set share images so missing logos fall back to the CenterLinked default.
  html = html
    .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}">`)
    .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}">`);

  const imageExtra = [
    `<meta property="og:image:alt" content="${imageAlt}">`,
    meta.imageWidth ? `<meta property="og:image:width" content="${meta.imageWidth}">` : null,
    meta.imageHeight ? `<meta property="og:image:height" content="${meta.imageHeight}">` : null,
    meta.imageType ? `<meta property="og:image:type" content="${meta.imageType}">` : null,
  ]
    .filter(Boolean)
    .join("\n    ");

  html = html.replace(/\n?\s*<meta property="og:image:alt"[^>]*>/i, "");
  html = html.replace(/\n?\s*<meta property="og:image:width"[^>]*>/i, "");
  html = html.replace(/\n?\s*<meta property="og:image:height"[^>]*>/i, "");
  html = html.replace(/\n?\s*<meta property="og:image:type"[^>]*>/i, "");
  html = html.replace(
    /<meta property="og:image"/i,
    `${imageExtra}\n    <meta property="og:image"`,
  );

  return html;
}
