const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "auth",
  "request-access",
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

function buildMeta({ title, description, path, image, siteName, card = "summary" }) {
  const url = `${process.env.SITE_URL || "https://www.centerlinked.com"}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    title,
    description: (description || "").trim() || "Referral profile.",
    url,
    image: image || null,
    siteName: siteName || title,
    card,
  };
}

async function supabaseRow(table, query) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const res = await fetch(`${base}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
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

    const org = await supabaseRow(
      "organizations",
      `id=eq.${encodeURIComponent(facility.organization_id)}&select=name,tagline,description,logo_url,cover_image_url,slug&limit=1`,
    );
    if (!org || org.slug !== orgSlug) return null;

    return buildMeta({
      title: `${facility.name} — ${org.name}`,
      description: facility.description || facility.tagline || orgDescription(org),
      path,
      image: org.logo_url || facility.image_urls?.[0] || org.cover_image_url,
      siteName: org.name,
      card: org.logo_url ? "summary" : "summary_large_image",
    });
  }

  const orgScoped = path.match(/^\/o\/([^/]+)$/);
  if (orgScoped) {
    const org = await supabaseRow(
      "organizations",
      `slug=eq.${encodeURIComponent(orgScoped[1])}&select=name,tagline,description,logo_url,cover_image_url,hq_city,hq_state,slug&limit=1`,
    );
    if (!org) return null;
    return buildMeta({
      title: org.name,
      description: orgDescription(org),
      path: `/o/${org.slug}`,
      image: org.logo_url || org.cover_image_url,
      siteName: org.name,
      card: org.logo_url ? "summary" : "summary_large_image",
    });
  }

  const legacyProgram = path.match(/^\/p\/([^/]+)$/);
  if (legacyProgram) {
    const facility = await supabaseRow(
      "facilities",
      `slug=eq.${encodeURIComponent(legacyProgram[1])}&verification_status=eq.approved&select=name,tagline,description,image_urls,organization_id&limit=1`,
    );
    if (!facility) return null;

    const org = await supabaseRow(
      "organizations",
      `id=eq.${encodeURIComponent(facility.organization_id)}&select=name,tagline,description,logo_url,cover_image_url,slug&limit=1`,
    );
    if (!org) return null;

    const canonicalPath = org.slug
      ? `/o/${org.slug}/p/${legacyProgram[1]}`
      : `/p/${legacyProgram[1]}`;

    return buildMeta({
      title: `${facility.name} — ${org.name}`,
      description: facility.description || facility.tagline || orgDescription(org),
      path: canonicalPath,
      image: org.logo_url || facility.image_urls?.[0] || org.cover_image_url,
      siteName: org.name,
      card: org.logo_url ? "summary" : "summary_large_image",
    });
  }

  const shortOrg = path.match(/^\/([^/]+)$/);
  if (shortOrg && !RESERVED_SLUGS.has(shortOrg[1])) {
    const org = await supabaseRow(
      "organizations",
      `slug=eq.${encodeURIComponent(shortOrg[1])}&select=name,tagline,description,logo_url,cover_image_url,hq_city,hq_state,slug&limit=1`,
    );
    if (!org) return null;
    return buildMeta({
      title: org.name,
      description: orgDescription(org),
      path: `/o/${org.slug}`,
      image: org.logo_url || org.cover_image_url,
      siteName: org.name,
      card: org.logo_url ? "summary" : "summary_large_image",
    });
  }

  return null;
}

export async function renderPreviewHtml(pathname, baseHtml) {
  const meta = await resolvePublicMeta(pathname);
  if (!meta) return null;
  return injectSocialMeta(baseHtml, meta);
}

export function injectSocialMeta(baseHtml, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const siteName = escapeHtml(meta.siteName);
  const card = meta.card === "summary_large_image" ? "summary_large_image" : "summary";
  const image = meta.image ? escapeHtml(meta.image) : null;

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

  if (image) {
    html = html
      .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}">`)
      .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}">`);
    if (!html.includes('property="og:image:alt"')) {
      html = html.replace(
        /<meta property="og:image"/i,
        `<meta property="og:image:alt" content="${siteName}">\n    <meta property="og:image"`,
      );
    } else {
      html = html.replace(
        /<meta property="og:image:alt"[^>]*>/i,
        `<meta property="og:image:alt" content="${siteName}">`,
      );
    }
  } else {
    html = html
      .replace(/\n?\s*<meta property="og:image"[^>]*>/i, "")
      .replace(/\n?\s*<meta name="twitter:image"[^>]*>/i, "")
      .replace(/\n?\s*<meta property="og:image:alt"[^>]*>/i, "");
  }

  return html;
}
