// Lightweight per-page social meta tag setter. Mutates document.head
// directly. Human browsers use this after hydration; link-preview crawlers
// are handled server-side in server/og-meta.mjs.

const SITE_URL = "https://www.centerlinked.com";

/** Same default preview art as index.html / server/og-image.mjs. */
export const DEFAULT_OG_IMAGE = "https://www.centerlinked.com/og-image.png";

const DEFAULT_FAVICON = "/favicon.png";

type SocialMeta = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  /** Tab/bookmark icon — prefer org.favicon_url, then logo_url, on public share pages. */
  icon?: string | null;
  /** Shown as og:site_name — use the org name for branded shares. */
  siteName?: string | null;
  /** Large cards match the generated 1200×630 org OG images. */
  card?: "summary" | "summary_large_image";
  imageAlt?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  return el;
}

function setLink(rel: string, href: string, opts?: { type?: string | null }) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (opts?.type) {
    el.type = opts.type;
  } else {
    el.removeAttribute("type");
  }
  return el;
}

function applyFavicon(icon?: string | null) {
  const href = icon?.trim() || DEFAULT_FAVICON;
  const isDefault = href === DEFAULT_FAVICON;
  setLink("icon", href, isDefault ? { type: "image/png" } : undefined);

  if (isDefault) {
    document.head.querySelector('link[rel="apple-touch-icon"]')?.remove();
  } else {
    setLink("apple-touch-icon", href);
  }
}

export function applySocialMeta({
  title,
  description,
  path,
  image,
  icon,
  siteName,
  card = "summary_large_image",
  imageAlt,
  imageWidth,
  imageHeight,
}: SocialMeta) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const desc = (description ?? "").trim() || "Referral profile.";
  const cardType = card;
  const shareImage = (image ?? "").trim() || DEFAULT_OG_IMAGE;
  const alt = (imageAlt ?? siteName ?? title).trim() || title;

  document.title = title;

  const ensure = (selector: string, attrs: Record<string, string>) => {
    setMeta(selector, attrs);
  };

  ensure('meta[name="description"]', { name: "description", content: desc });
  ensure('meta[property="og:title"]', { property: "og:title", content: title });
  ensure('meta[property="og:description"]', { property: "og:description", content: desc });
  ensure('meta[property="og:url"]', { property: "og:url", content: url });
  ensure('meta[property="og:type"]', { property: "og:type", content: "website" });
  ensure('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: (siteName ?? title).trim(),
  });
  ensure('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  ensure('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
  ensure('meta[name="twitter:card"]', { name: "twitter:card", content: cardType });

  ensure('meta[property="og:image"]', { property: "og:image", content: shareImage });
  ensure('meta[property="og:image:alt"]', { property: "og:image:alt", content: alt });
  ensure('meta[name="twitter:image"]', { name: "twitter:image", content: shareImage });

  if (imageWidth) {
    ensure('meta[property="og:image:width"]', {
      property: "og:image:width",
      content: String(imageWidth),
    });
  } else {
    document.head.querySelector('meta[property="og:image:width"]')?.remove();
  }
  if (imageHeight) {
    ensure('meta[property="og:image:height"]', {
      property: "og:image:height",
      content: String(imageHeight),
    });
  } else {
    document.head.querySelector('meta[property="og:image:height"]')?.remove();
  }

  document.head.querySelector('meta[name="twitter:site"]')?.remove();

  setLink("canonical", url);
  applyFavicon(icon);

  return () => {};
}

/** Absolute URL for the generated 1200×630 org share card. */
export function orgOgImageUrl(slug: string, usesFavicon = false): string {
  const extra = usesFavicon ? "&i=1" : "";
  return `${SITE_URL}/api/og-image?slug=${encodeURIComponent(slug)}&v=3${extra}`;
}

export function orgOgIconUrl(slug: string, hasFavicon = false): string {
  const extra = hasFavicon ? "&f=1" : "";
  return `/api/og-icon?slug=${encodeURIComponent(slug)}&v=3${extra}`;
}

/**
 * Always a generated 1200×630 org card for public share URLs.
 * Never the CenterLinked marketing/login graphic.
 */
export function orgShareImage(org: {
  slug?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  cover_image_url?: string | null;
}): string {
  if (!org.slug) return DEFAULT_OG_IMAGE;
  return orgOgImageUrl(org.slug, !!org.favicon_url?.trim());
}

export function orgShareCardType(_org?: { logo_url?: string | null }): "summary_large_image" {
  return "summary_large_image";
}

/** Tab / share-preview icon from the org favicon (then logo), served same-origin. */
export function orgShareIcon(org?: {
  slug?: string | null;
  favicon_url?: string | null;
  logo_url?: string | null;
} | null): string | null {
  if (org?.slug) return orgOgIconUrl(org.slug, !!org.favicon_url?.trim());
  const favicon = org?.favicon_url?.trim();
  if (favicon) return favicon;
  const logo = org?.logo_url?.trim();
  return logo || null;
}
