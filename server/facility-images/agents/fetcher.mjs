const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const SKIP_PATTERNS =
  /logo|icon|badge|seal|avatar|favicon|sprite|placeholder|complianz|gravatar|emoji|svg|gif|banner-ad|social-share|facebook|twitter|instagram|linkedin|youtube|pinterest|tiktok|staff|team|doctor|patient|people|person|portrait|headshot|counselor|therapist|group-photo|senior-therapy|senior-and-alcohol|senior-recovery|senior-addiction|doctor\.jpg|meditation|interviewing|therapy|support-group|emergency-room|stock-photo|stockphoto|shutterstock|getty|istock|unsplash|pexels|new-client|client-pic|veteran-ready|insurance-questions|virtual-tour|get-help|national-locations|-\d+x\d+\.(?:jpg|jpeg|png|webp)/i;

const PREFERRED_PATTERNS =
  /facility|building|campus|exterior|interior|room|bedroom|lounge|common.?area|amenity|pool|gym|kitchen|dining|rehab.?center|treatment.?center|aerial|drone|grounds|garden|patio|courtyard|office|reception|hallway|library|wellness.?center|recovery.?center|detox|residence|housing|accommodation|property|site|location|campus/i;

function resolveUrl(raw, base) {
  try {
    return new URL(raw, base).href;
  } catch {
    return null;
  }
}

function isLikelyPhoto(url, width = 0, height = 0) {
  if (!url || SKIP_PATTERNS.test(url)) return false;
  if (/\.svg(\?|$)/i.test(url)) return false;
  if (width > 0 && height > 0) {
    if (width < 600 || height < 400) return false;
    if (width / height > 4 || height / width > 3) return false;
  }
  return true;
}

function scoreCandidate(url, meta = {}) {
  let score = 0;
  if (PREFERRED_PATTERNS.test(url)) score += 3;
  if (PREFERRED_PATTERNS.test(meta.alt || "")) score += 2;
  if (PREFERRED_PATTERNS.test(meta.title || "")) score += 1;
  if (meta.width >= 1200) score += 2;
  if (meta.height >= 800) score += 1;
  if (/webp|jpg|jpeg|png/i.test(url)) score += 1;
  if (SKIP_PATTERNS.test(url)) score -= 10;
  // Require some facility relevance signal when not from preferred patterns
  if (!PREFERRED_PATTERNS.test(url) && !PREFERRED_PATTERNS.test(meta.alt || "")) score -= 2;
  return score;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (res.ok) return res.text();

  // Cloudflare and similar blocks — try Internet Archive snapshot.
  if (res.status === 403 || res.status === 401) {
    return fetchTextViaArchive(url);
  }
  return null;
}

async function fetchTextViaArchive(url) {
  const archivePage = `https://web.archive.org/web/2025/${url}`;
  try {
    const res = await fetch(archivePage, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function extractArchiveDomainImages(html, origin) {
  const host = new URL(origin).hostname.replace(/^www\./, "");
  const candidates = [];
  const seen = new Set();

  const patterns = [
    new RegExp(`https?:\\/\\/(?:www\\.)?${host.replace(/\./g, "\\.")}\\/wp-content\\/uploads\\/[^"'\\s>]+\\.(?:jpg|jpeg|png|webp)`, "gi"),
    /\/wp-content\/uploads\/[^"'\\s>]+\.(?:jpg|jpeg|png|webp)/gi,
  ];

  for (const pattern of patterns) {
    for (const m of html.matchAll(pattern)) {
      const raw = m[0].startsWith("http") ? m[0] : `${origin}${m[0]}`;
      const resolved = resolveUrl(raw, origin);
      if (!resolved || seen.has(resolved)) continue;
      seen.add(resolved);
      if (!isLikelyPhoto(resolved)) continue;
      candidates.push({
        url: resolved,
        width: 0,
        height: 0,
        alt: "",
        title: "",
        source: "archive",
        score: scoreCandidate(resolved, {}),
      });
    }
  }

  return candidates;
}

async function fetchWordPressMedia(origin) {
  const candidates = [];
  for (let page = 1; page <= 3; page++) {
    const api = `${origin}/wp-json/wp/v2/media?per_page=100&page=${page}&media_type=image`;
    try {
      const res = await fetch(api, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) break;
      for (const item of items) {
        const url = item.source_url;
        const width = item.media_details?.width ?? 0;
        const height = item.media_details?.height ?? 0;
        if (!isLikelyPhoto(url, width, height)) continue;
        candidates.push({
          url,
          width,
          height,
          alt: item.alt_text || item.title?.rendered || "",
          title: item.title?.rendered || "",
          source: "wordpress-api",
          score: scoreCandidate(url, {
            alt: item.alt_text,
            title: item.title?.rendered,
            width,
            height,
          }),
        });
      }
      if (items.length < 100) break;
    } catch {
      break;
    }
  }
  return candidates;
}

function extractFromHtml(html, pageUrl) {
  const candidates = [];
  const seen = new Set();

  const add = (raw, meta = {}) => {
    const url = resolveUrl(raw, pageUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    if (!isLikelyPhoto(url, meta.width, meta.height)) return;
    candidates.push({
      url,
      width: meta.width || 0,
      height: meta.height || 0,
      alt: meta.alt || "",
      title: meta.title || "",
      source: "html",
      score: scoreCandidate(url, meta),
    });
  };

  for (const m of html.matchAll(
    /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi,
  )) {
    const tag = m[0];
    const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? "";
    add(m[1], { alt });
  }

  for (const m of html.matchAll(
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
  )) {
    add(m[1], { title: "og:image" });
  }

  for (const m of html.matchAll(/url\(["']?(https?:[^"')]+\.(?:jpg|jpeg|png|webp)[^"')]*)["']?\)/gi)) {
    add(m[1]);
  }

  for (const m of html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi)) {
    add(m[0]);
  }

  return candidates;
}

async function crawlSiteLinks(startUrl, maxPages = 8) {
  const origin = new URL(startUrl).origin;
  const queue = [startUrl];
  const visited = new Set();
  const pages = [];

  while (queue.length && pages.length < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    const html = await fetchText(url);
    if (!html) continue;
    pages.push({ url, html });

    for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
      const next = resolveUrl(m[1], url);
      if (!next || !next.startsWith(origin)) continue;
      if (/\.(pdf|zip|mp4|mp3|css|js)(\?|$)/i.test(next)) continue;
      if (visited.has(next) || queue.includes(next)) continue;
      if (/(contact|privacy|terms|blog|news|careers|login|cart|checkout)/i.test(next)) continue;
      queue.push(next);
    }
  }

  return pages;
}

/**
 * Fetcher agent: discover facility photo candidates from the facility website.
 */
export async function fetchFacilityImageCandidates(facility) {
  if (!facility.website) return [];

  let startUrl = facility.website.trim();
  if (!/^https?:\/\//i.test(startUrl)) startUrl = `https://${startUrl}`;

  const origin = new URL(startUrl).origin;
  const all = [];

  all.push(...(await fetchWordPressMedia(origin)));

  const pages = await crawlSiteLinks(startUrl, 6);
  for (const page of pages) {
    all.push(...extractFromHtml(page.html, page.url));
    if (page.html.includes("web.archive.org") || all.length === 0) {
      all.push(...extractArchiveDomainImages(page.html, origin));
    }
  }

  // If crawl found nothing, try archive directly.
  if (all.length === 0) {
    const archived = await fetchTextViaArchive(startUrl);
    if (archived) {
      all.push(...extractFromHtml(archived, startUrl));
      all.push(...extractArchiveDomainImages(archived, origin));
    }
  }

  const deduped = new Map();
  for (const c of all) {
    const prev = deduped.get(c.url);
    if (!prev || c.score > prev.score) deduped.set(c.url, c);
  }

  return [...deduped.values()].sort((a, b) => b.score - a.score);
}

export async function downloadImage(url) {
  const tryDownload = async (target) => {
    const res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error("Not an image response");
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 8 * 1024 * 1024) throw new Error("Image too large");
    return { buffer, contentType };
  };

  try {
    return await tryDownload(url);
  } catch {
    // Blocked origin CDN — pull image bytes via Internet Archive.
    const archiveUrl = `https://web.archive.org/web/2025im_/${url}`;
    return await tryDownload(archiveUrl);
  }
}
