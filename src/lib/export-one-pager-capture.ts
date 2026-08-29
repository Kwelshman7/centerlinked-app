import { createRoot, type Root } from "react-dom/client";
import { createElement, type ComponentType, type CSSProperties } from "react";

/** Letter at 96dpi — matches the facility one-pager capture canvas. */
export const LETTER_WIDTH_PX = 816;
export const LETTER_HEIGHT_PX = 1056;

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForFonts(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.startsWith("data:")) resolve(result);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

async function rasterToDataUrl(
  blob: Blob,
  opts: { maxEdge: number; type: "image/jpeg" | "image/png"; quality: number },
): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    try {
      const scale = Math.min(1, opts.maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return blobToDataUrl(blob);
      if (opts.type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      return canvas.toDataURL(opts.type, opts.quality);
    } finally {
      bitmap.close();
    }
  } catch {
    try {
      return await blobToDataUrl(blob);
    } catch {
      return null;
    }
  }
}

export type ResolveImageKind = "photo" | "logo" | "icon";

/** CSS fill for capture — data URLs in backgrounds are not re-fetched (or cache-busted) by html-to-image. */
export function photoFillStyle(
  src: string,
  fit: "cover" | "contain" = "cover",
  extra?: CSSProperties,
): CSSProperties {
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: fit,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    ...extra,
  };
}

function sameImageUrl(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const left = new URL(a, window.location.href);
    const right = new URL(b, window.location.href);
    return left.pathname === right.pathname && decodeURIComponent(left.pathname) === decodeURIComponent(right.pathname);
  } catch {
    return false;
  }
}

/** Copy an already-decoded page <img> (Supabase photos on the live sheet). */
function copyDecodedImage(url: string): string | null {
  const match = Array.from(document.images).find(
    (img) =>
      img.naturalWidth > 0 &&
      (img.currentSrc === url || img.src === url || sameImageUrl(img.currentSrc || img.src, url)),
  );
  if (!match) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = match.naturalWidth;
    canvas.height = match.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(match, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
}

async function fetchAsDataUrl(url: string, kind: ResolveImageKind): Promise<string | null> {
  const proxied = `/api/public-image?url=${encodeURIComponent(url)}`;
  const attempts: Array<() => Promise<Response>> = [
    () => fetch(proxied, { credentials: "omit", cache: "reload" }),
    () =>
      fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "reload",
        referrerPolicy: "no-referrer",
      }),
  ];

  for (const run of attempts) {
    try {
      const res = await run();
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob.size < 32) continue;
      const type = (blob.type || "").toLowerCase();
      if (type && !type.startsWith("image/") && type !== "application/octet-stream") continue;
      const asLogo = kind !== "photo" || type.includes("png") || type.includes("svg") || type.includes("webp");
      return rasterToDataUrl(blob, {
        maxEdge: kind === "photo" ? 2000 : 1400,
        type: asLogo && kind !== "photo" ? "image/png" : "image/jpeg",
        quality: 0.9,
      });
    } catch {
      /* next attempt */
    }
  }
  return null;
}

/**
 * Load a remote photo as a data URL for PDF capture.
 * Never return blob: or http(s) URLs — html-to-image cache-busts those and they paint as yellow blocks.
 */
export async function resolveImageUrl(
  src: string | null | undefined,
  kind: ResolveImageKind = "photo",
): Promise<string | null> {
  const url = src?.trim();
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  const fromPage = copyDecodedImage(url);
  if (fromPage) return fromPage;

  if (url.startsWith("blob:")) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return rasterToDataUrl(blob, {
        maxEdge: kind === "photo" ? 2000 : 1400,
        type: kind === "photo" ? "image/jpeg" : "image/png",
        quality: 0.9,
      });
    } catch {
      return null;
    }
  }

  return fetchAsDataUrl(url, kind);
}

/** Resolve unique remote photos in order; skips failures. */
export async function resolveUniqueImages(
  urls: Array<string | null | undefined>,
  limit = 4,
  kind: ResolveImageKind = "photo",
): Promise<string[]> {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    unique.push(url);
    if (unique.length >= Math.max(limit, 1) + 3) break;
  }
  const resolved = await Promise.all(unique.map((url) => resolveImageUrlReliable(url, kind)));
  return resolved.filter((item): item is string => !!item).slice(0, limit);
}

/** Decode data URLs into the image cache before capture. */
export async function preloadDataUrls(urls: Array<string | null | undefined>): Promise<void> {
  await Promise.all(
    urls.filter((url): url is string => !!url && url.startsWith("data:")).map(async (url) => {
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } catch {
        /* still usable as a CSS background */
      }
    }),
  );
}

export async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, 8000);
        }),
    ),
  );
}

/**
 * Resolve a remote image to a data URL with retries.
 * PDF capture must not proceed on empty slots when the org has real photos.
 */
export async function resolveImageUrlReliable(
  src: string | null | undefined,
  kind: ResolveImageKind = "photo",
  attempts = 3,
): Promise<string | null> {
  const url = src?.trim();
  if (!url) return null;
  for (let i = 0; i < attempts; i++) {
    const resolved = await resolveImageUrl(url, kind);
    if (resolved?.startsWith("data:") && resolved.length > 64) return resolved;
    await sleep(180 * (i + 1));
  }
  return null;
}

/** Try candidates in order until one resolves to a capture-ready data URL. */
export async function resolveFirstImageUrl(
  urls: Array<string | null | undefined>,
  kind: ResolveImageKind = "photo",
): Promise<string | null> {
  for (const url of urls) {
    const resolved = await resolveImageUrlReliable(url, kind);
    if (resolved) return resolved;
  }
  return null;
}

/**
 * After off-screen render: fonts + every <img> must have decoded pixels.
 * Retries once if any image is still empty (common when data: decode races).
 */
export async function waitForCaptureReady(node: HTMLElement): Promise<void> {
  await waitForFonts();
  await preloadDataUrls(
    Array.from(node.querySelectorAll("img"))
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean),
  );
  await waitForImages(node);
  const empty = () =>
    Array.from(node.querySelectorAll("img")).filter(
      (img) => !(img.complete && img.naturalWidth > 0),
    );
  if (empty().length === 0) {
    await sleep(120);
    return;
  }
  await sleep(400);
  await waitForImages(node);
  await sleep(200);
}

export function slugifyFilename(name: string, fallback = "document"): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

export function titleCaseFilename(name: string, fallback = "Organization"): string {
  const slug = slugifyFilename(name, fallback);
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

export async function orgHidesPlatformMark(orgId: string | null | undefined): Promise<boolean> {
  if (!orgId) return false;
  try {
    const { fetchOrganizationBilling, isSubscriptionActive } = await import("@/lib/billing");
    const billing = await fetchOrganizationBilling(orgId);
    return isSubscriptionActive(billing?.subscription_status);
  } catch {
    return false;
  }
}

export async function renderOffscreenElement<P extends object>(
  marker: string,
  Component: ComponentType<P>,
  props: P,
): Promise<{ host: HTMLElement; node: HTMLElement; root: Root; cleanup: () => void }> {
  const host = document.createElement("div");
  host.setAttribute(`data-${marker}-host`, "true");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${LETTER_WIDTH_PX}px`,
    `height:${LETTER_HEIGHT_PX}px`,
    "overflow:hidden",
    "pointer-events:none",
    "opacity:1",
    "z-index:0",
  ].join(";");
  document.body.appendChild(host);

  const root = createRoot(host);
  await new Promise<void>((resolve) => {
    root.render(createElement(Component, props));
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const node = host.querySelector<HTMLElement>(`[data-${marker}]`);
  if (!node) {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
    throw new Error("One-pager failed to render");
  }

  const cleanup = () => {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
  };

  return { host, node, root, cleanup };
}

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

/**
 * html-to-image must NOT cache-bust. It appends ?timestamp to src, which
 * breaks blob: and data: URLs and paints the yellow/green broken-image tiles.
 */
export const htmlToImageSafeOptions = {
  cacheBust: false,
  imagePlaceholder: TRANSPARENT_PIXEL,
  onImageErrorHandler: () => undefined,
};
