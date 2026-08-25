import {
  renderOffscreenElement,
  resolveImageUrl,
  resolveUniqueImages,
  preloadDataUrls,
  sleep,
  waitForFonts,
  waitForImages,
  slugifyFilename,
  orgHidesPlatformMark,
  LETTER_WIDTH_PX,
  LETTER_HEIGHT_PX,
  htmlToImageSafeOptions,
} from "@/lib/export-one-pager-capture";
import { categorizeFacilityTags } from "@/lib/facility-program-tags";
import { uniqueAccreditations } from "@/lib/accreditations";
import { polishOnePagerCopy } from "@/lib/one-pager-copy";
import {
  FacilityOnePager,
  type FacilityOnePagerProps,
} from "@/components/public/FacilityOnePager";

export type ExportFacilityOnePagerInput = Omit<
  FacilityOnePagerProps,
  "resolvedLogoUrl" | "resolvedHeroUrl" | "resolvedGalleryUrls" | "createdAt" | "hidePlatformMark" | "polishedDescription"
> & {
  filename?: string;
};

async function firstResolved(
  urls: Array<string | null | undefined>,
  kind: "logo" | "photo",
): Promise<string | null> {
  for (const url of urls) {
    const resolved = await resolveImageUrl(url, kind);
    if (resolved) return resolved;
  }
  return null;
}

/**
 * Collects the live sheet's brand, copy, logo, and photos, then renders a
 * Letter one-pager off-screen and downloads a single-page PDF.
 */
export async function exportFacilityOnePagerPdf(
  input: ExportFacilityOnePagerInput,
): Promise<void> {
  const createdAt = new Date();
  const photoCandidates = [
    ...(input.facility.image_urls ?? []),
    input.org?.cover_image_url,
  ];

  const tags = categorizeFacilityTags(input.facility);
  const [resolvedLogoUrl, resolvedPhotos, hidePlatformMark, polished] = await Promise.all([
    firstResolved([input.org?.logo_url, input.org?.favicon_url], "logo"),
    resolveUniqueImages(photoCandidates, 4, "photo"),
    orgHidesPlatformMark(input.org?.id),
    polishOnePagerCopy({
      name: input.facility.name,
      orgName: input.org?.name,
      city: input.facility.city,
      state: input.facility.state,
      tagline: input.facility.tagline || input.org?.tagline,
      description: input.facility.short_description || input.facility.description,
      levels: (input.facility.levels_of_care ?? []).filter(Boolean),
      conditions: tags.conditions,
      therapies: tags.therapies,
      whoWeTreat: tags.whoWeTreat,
      amenities: tags.amenities,
      accreditations: uniqueAccreditations(input.facility.accreditations),
    }),
  ]);

  const resolvedHeroUrl = resolvedPhotos[0] ?? null;
  const resolvedGalleryUrls = resolvedPhotos.slice(1, 4);
  await preloadDataUrls([resolvedLogoUrl, resolvedHeroUrl, ...resolvedGalleryUrls]);

  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const rendered = await renderOffscreenElement("facility-one-pager", FacilityOnePager, {
    facility: input.facility,
    org: input.org,
    contracts: input.contracts,
    brandColor: input.brandColor,
    resolvedLogoUrl,
    resolvedHeroUrl,
    resolvedGalleryUrls,
    hidePlatformMark,
    polishedDescription: polished?.description ?? null,
    createdAt,
  });

  try {
    await waitForFonts();
    await waitForImages(rendered.node);
    await sleep(400);

    const dataUrl = await toPng(rendered.node, {
      pixelRatio: 2.5,
      width: LETTER_WIDTH_PX,
      height: LETTER_HEIGHT_PX,
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
    pdf.setProperties({
      title: `${input.facility.name} — Referral one-pager`,
      subject: `Referral profile for ${input.facility.name}`,
      author: input.org?.name ?? input.facility.name,
      creator: "CenterLinked",
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "FAST");

    const filename =
      input.filename ?? `${slugifyFilename(input.facility.name, "facility")}-referral-one-pager.pdf`;
    pdf.save(filename);
  } finally {
    rendered.cleanup();
  }
}
