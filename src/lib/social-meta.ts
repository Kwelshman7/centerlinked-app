// Lightweight per-page social meta tag setter. Mutates document.head
// directly (matches existing pattern in public sheet pages). Works for
// JS-executing crawlers; static social-preview crawlers see index.html.

const SITE_URL = "https://www.centerlinked.com";

type SocialMeta = {
  title: string;
  description?: string | null;
  path: string; // e.g. "/p/my-facility"
  image?: string | null;
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

export function applySocialMeta({ title, description, path, image }: SocialMeta) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const desc = (description ?? "").trim() || "Referral profile on CenterLinked.";

  document.title = title;

  const created: Array<Element> = [];
  const track = (el: Element | null) => { if (el) created.push(el); };

  const ensure = (selector: string, attrs: Record<string, string>) => {
    const existed = !!document.head.querySelector(selector);
    const el = setMeta(selector, attrs);
    if (!existed) track(el);
  };

  ensure('meta[name="description"]', { name: "description", content: desc });
  ensure('meta[property="og:title"]', { property: "og:title", content: title });
  ensure('meta[property="og:description"]', { property: "og:description", content: desc });
  ensure('meta[property="og:url"]', { property: "og:url", content: url });
  ensure('meta[property="og:type"]', { property: "og:type", content: "website" });
  ensure('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  ensure('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
  ensure('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });

  if (image) {
    ensure('meta[property="og:image"]', { property: "og:image", content: image });
    ensure('meta[name="twitter:image"]', { name: "twitter:image", content: image });
  }

  setLink("canonical", url);

  // Cleanup hook — restores prior content by re-applying defaults from index.html
  return () => {
    // We intentionally leave tags in place; SPAs navigate to other routes which
    // call applySocialMeta themselves, or unmount back to "/" which has static
    // defaults baked into index.html and remain valid for the homepage.
  };
}
