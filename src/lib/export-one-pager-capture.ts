import { createRoot, type Root } from "react-dom/client";
import { createElement, type ComponentType } from "react";

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

/** Fetch remote assets as blob URLs so capture stays CORS-clean and full-color.
 *  Returns null when the file cannot be read (avoids tainting html-to-image). */
export async function resolveImageUrl(src: string | null | undefined): Promise<string | null> {
  const url = src?.trim();
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  try {
    const res = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      cache: "force-cache",
      referrerPolicy: "no-referrer",
    });
    if (!res.ok) return copyDecodedImage(url);
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return copyDecodedImage(url);
    return URL.createObjectURL(blob);
  } catch {
    return copyDecodedImage(url);
  }
}

/** Last resort: copy an already-decoded <img> from the live page (same origin or CORS-open). */
function copyDecodedImage(url: string): string | null {
  const match = Array.from(document.images).find(
    (img) => (img.currentSrc === url || img.src === url) && img.naturalWidth > 0,
  );
  if (!match) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = match.naturalWidth;
    canvas.height = match.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(match, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
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

export async function renderOffscreenElement<P extends object>(
  marker: string,
  Component: ComponentType<P>,
  props: P,
): Promise<{ host: HTMLElement; node: HTMLElement; root: Root; cleanup: () => void }> {
  const host = document.createElement("div");
  host.setAttribute(`data-${marker}-host`, "true");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${LETTER_WIDTH_PX}px`,
    `height:${LETTER_HEIGHT_PX}px`,
    "overflow:hidden",
    "pointer-events:none",
    "opacity:0",
    "z-index:-1",
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

/** html-to-image options that skip failed remote images instead of rejecting with an Event. */
export const htmlToImageSafeOptions = {
  imagePlaceholder: TRANSPARENT_PIXEL,
  onImageErrorHandler: () => undefined,
  fetchRequestInit: {
    mode: "cors" as RequestMode,
    credentials: "omit" as RequestCredentials,
    referrerPolicy: "no-referrer" as ReferrerPolicy,
  },
};
