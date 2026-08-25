import {
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  htmlToImageSafeOptions,
  orgHidesPlatformMark,
  preloadDataUrls,
  renderOffscreenElement,
  resolveImageUrl,
  sleep,
  waitForFonts,
  waitForImages,
} from "@/lib/export-one-pager-capture";
import { buildOrgOnePagerModel } from "@/lib/org-one-pager-model";
import type { OrgSheetData } from "@/components/public/OrganizationSheetView";
import type { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";

export type ExportOrgOnePagerInput = {
  org: OrgSheetData;
  facilities: ShowcaseFacility[];
  facilityPayersById: Map<string, string[]> | Record<string, string[]>;
  brandColor?: string;
  profileUrl?: string | null;
  filename?: string;
};

async function resolveQrUrl(profileUrl: string | null | undefined): Promise<string | null> {
  const data = profileUrl?.trim();
  if (!data) return null;
  const endpoint =
    "https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&margin=0&color=1a2332&bgcolor=ffffff&data=" +
    encodeURIComponent(data);
  return resolveImageUrl(endpoint, "icon");
}

export async function exportOrgOnePagerPdf(input: ExportOrgOnePagerInput): Promise<void> {
  const model = buildOrgOnePagerModel({
    org: input.org,
    facilities: input.facilities,
    facilityPayersById: input.facilityPayersById,
    brandColor: input.brandColor,
    profileUrl: input.profileUrl,
  });

  const [resolvedLogoUrl, resolvedCoverUrl, resolvedQrUrl, hidePlatformMark, ...resolvedPhotos] =
    await Promise.all([
      resolveImageUrl(model.logoUrl, "logo").then(
        async (logo) => logo ?? resolveImageUrl(input.org.favicon_url, "logo"),
      ),
      resolveImageUrl(input.org.cover_image_url ?? input.org.image_urls?.[0] ?? null, "photo"),
      resolveQrUrl(model.profileUrl),
      orgHidesPlatformMark(input.org.id),
      ...model.facilities.map((f) =>
        f.photoUrl ? resolveImageUrl(f.photoUrl, "photo") : Promise.resolve(null),
      ),
    ]);

  const resolvedPhotoUrls: Record<string, string | null> = {};
  model.facilities.forEach((facility, i) => {
    resolvedPhotoUrls[facility.id] = resolvedPhotos[i] ?? null;
  });

  await preloadDataUrls([
    resolvedLogoUrl,
    resolvedCoverUrl,
    resolvedQrUrl,
    ...Object.values(resolvedPhotoUrls),
  ]);

  const { OrgOnePager } = await import("@/components/public/OrgOnePager");
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const rendered = await renderOffscreenElement("org-one-pager", OrgOnePager, {
    model,
    resolvedLogoUrl,
    resolvedCoverUrl,
    resolvedPhotoUrls,
    resolvedQrUrl,
    hidePlatformMark,
  });

  try {
    await waitForFonts();
    await waitForImages(rendered.node);
    await sleep(400);

    const dataUrl = await Promise.race([
      toPng(rendered.node, {
        pixelRatio: 2.5,
        width: LETTER_WIDTH_PX,
        height: LETTER_HEIGHT_PX,
        backgroundColor: model.theme.paper,
        ...htmlToImageSafeOptions,
        style: {
          transform: "none",
          margin: "0",
          opacity: "1",
        },
      }),
      new Promise<string>((_, reject) => {
        window.setTimeout(() => reject(new Error("PDF capture timed out")), 40000);
      }),
    ]);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
      compress: true,
    });
    pdf.setProperties({
      title: `${model.orgName} — Referral Overview`,
      subject: `Facilities, levels of care, and in-network insurance for ${model.orgName}`,
      author: model.orgName,
      creator: "CenterLinked",
      keywords: "referral, behavioral health, facilities, insurance",
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "FAST");
    pdf.save(input.filename ?? model.filename);
  } finally {
    rendered.cleanup();
  }
}
