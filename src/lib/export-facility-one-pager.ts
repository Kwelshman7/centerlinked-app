import {
    renderOffscreenElement,
    resolveImageUrl,
    revokeIfBlob,
    sleep,
    waitForFonts,
    waitForImages,
    slugifyFilename,
    LETTER_WIDTH_PX,
    LETTER_HEIGHT_PX,
    htmlToImageSafeOptions,
} from "@/lib/export-one-pager-capture";
import {
  FacilityOnePager,
  type FacilityOnePagerProps,
} from "@/components/public/FacilityOnePager";

export type ExportFacilityOnePagerInput = Omit<
  FacilityOnePagerProps,
  "resolvedLogoUrl" | "resolvedHeroUrl" | "createdAt"
> & {
  filename?: string;
};

/**
 * Renders the branded Letter one-pager off-screen, captures at high DPI,
 * and downloads a single-page PDF.
 */
export async function exportFacilityOnePagerPdf(
  input: ExportFacilityOnePagerInput,
): Promise<void> {
  const createdAt = new Date();
  const logoSrc = input.org?.logo_url ?? null;
  const heroSrc = input.facility.image_urls?.[0] ?? input.org?.cover_image_url ?? null;

  const [resolvedLogoUrl, resolvedHeroUrl] = await Promise.all([
    resolveImageUrl(logoSrc),
    resolveImageUrl(heroSrc),
  ]);

  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const rendered = await renderOffscreenElement("facility-one-pager", FacilityOnePager, {
    facility: input.facility,
    org: input.org,
    contracts: input.contracts,
    brandColor: input.brandColor,
    resolvedLogoUrl,
    resolvedHeroUrl,
    createdAt,
  });

  try {
    await waitForFonts();
    await waitForImages(rendered.node);
    await sleep(80);

    const dataUrl = await toPng(rendered.node, {
      pixelRatio: 3,
      width: LETTER_WIDTH_PX,
      height: LETTER_HEIGHT_PX,
      cacheBust: true,
      backgroundColor: "#ffffff",
      ...htmlToImageSafeOptions,
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
    pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "MEDIUM");

    const filename =
      input.filename ?? `${slugifyFilename(input.facility.name, "facility")}-referral-one-pager.pdf`;
    pdf.save(filename);
  } finally {
    rendered.cleanup();
    revokeIfBlob(resolvedLogoUrl);
    revokeIfBlob(resolvedHeroUrl);
  }
}
