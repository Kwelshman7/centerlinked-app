import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  FacilityOnePager,
  ONE_PAGER_HEIGHT,
  ONE_PAGER_WIDTH,
  type FacilityOnePagerProps,
} from "@/components/public/FacilityOnePager";

export type ExportFacilityOnePagerInput = Omit<
  FacilityOnePagerProps,
  "resolvedLogoUrl" | "resolvedHeroUrl" | "createdAt"
> & {
  filename?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFonts(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
}

/** Fetch remote assets as blob URLs so capture stays CORS-clean and full-color. */
async function resolveImageUrl(src: string | null | undefined): Promise<string | null> {
  const url = src?.trim();
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
    if (!res.ok) return url;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return url;
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

async function waitForImages(node: HTMLElement): Promise<void> {
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
        }),
    ),
  );
}

function slugifyFilename(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "facility"
  );
}

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Renders the branded Letter one-pager off-screen, captures at high DPI,
 * and downloads a single-page PDF.
 */
export async function exportFacilityOnePagerPdf(
  input: ExportFacilityOnePagerInput,
): Promise<void> {
  const createdAt = new Date();
  const logoSrc = input.org?.logo_url ?? null;
  const heroSrc =
    input.facility.image_urls?.[0] ?? input.org?.cover_image_url ?? null;

  const [resolvedLogoUrl, resolvedHeroUrl] = await Promise.all([
    resolveImageUrl(logoSrc),
    resolveImageUrl(heroSrc),
  ]);

  const host = document.createElement("div");
  host.setAttribute("data-facility-one-pager-host", "true");
  // Keep in-viewport (opacity 0) so images/fonts paint reliably before capture.
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${ONE_PAGER_WIDTH}px`,
    `height:${ONE_PAGER_HEIGHT}px`,
    "overflow:hidden",
    "pointer-events:none",
    "opacity:0",
    "z-index:-1",
  ].join(";");
  document.body.appendChild(host);

  let root: Root | null = null;
  try {
    root = createRoot(host);
    await new Promise<void>((resolve) => {
      root!.render(
        createElement(FacilityOnePager, {
          facility: input.facility,
          org: input.org,
          contracts: input.contracts,
          brandColor: input.brandColor,
          resolvedLogoUrl,
          resolvedHeroUrl,
          createdAt,
        }),
      );
      // Allow layout + paint before measuring images.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const node = host.querySelector<HTMLElement>("[data-facility-one-pager]");
    if (!node) throw new Error("One-pager failed to render");

    await waitForFonts();
    await waitForImages(node);
    // Extra beat for webfont/glyph settling after image decode.
    await sleep(80);

    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      width: ONE_PAGER_WIDTH,
      height: ONE_PAGER_HEIGHT,
      cacheBust: true,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        margin: "0",
        opacity: "1",
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
      compress: true,
    });
    // PNG + MEDIUM keeps logo color edges and photo detail sharp on a single page.
    pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "MEDIUM");

    const filename =
      input.filename ??
      `${slugifyFilename(input.facility.name)}-referral-one-pager.pdf`;
    pdf.save(filename);
  } finally {
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
    revokeIfBlob(resolvedLogoUrl);
    revokeIfBlob(resolvedHeroUrl);
  }
}
