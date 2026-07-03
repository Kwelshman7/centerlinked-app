// Lightweight per-page social meta tag setter. Mutates document.head
// directly. Human browsers use this after hydration; link-preview crawlers
// are handled server-side in server/og-meta.mjs.

const SITE_URL = "https://www.centerlinked.com";

type SocialMeta = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  /** Shown as og:site_name — use the org name for branded shares. */
  siteName?: string | null;
  /** summary works best for org logos; large image for cover photos. */
  card?: "summary" | "summary_large_image";
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

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  return el;
}

export function applySocialMeta({
  title,
  description,
  path,
  image,
  siteName,
  card = "summary",
}: SocialMeta) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const desc = (description ?? "").trim() || "Referral profile.";
  const cardType = card;

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

  if (image) {
    ensure('meta[property="og:image"]', { property: "og:image", content: image });
    ensure('meta[property="og:image:alt"]', { property: "og:image:alt", content: (siteName ?? title).trim() });
    ensure('meta[name="twitter:image"]', { name: "twitter:image", content: image });
  } else {
    document.head.querySelector('meta[property="og:image"]')?.remove();
    document.head.querySelector('meta[property="og:image:alt"]')?.remove();
    document.head.querySelector('meta[name="twitter:image"]')?.remove();
  }

  document.head.querySelector('meta[name="twitter:site"]')?.remove();

  setLink("canonical", url);

  return () => {};
}

/** Prefer org logo for share cards; fall back to cover or facility photo. */
export function orgShareImage(org: {
  logo_url?: string | null;
  cover_image_url?: string | null;
}): string | null {
  return org.logo_url || org.cover_image_url || null;
}

export function orgShareCardType(org: { logo_url?: string | null }): "summary" | "summary_large_image" {
  return org.logo_url ? "summary" : "summary_large_image";
}
