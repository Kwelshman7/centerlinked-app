import {
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  htmlToImageSafeOptions,
  renderOffscreenElement,
  resolveImageUrl,
  revokeIfBlob,
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
  return resolveImageUrl(endpoint);
}

export async function exportOrgOnePagerPdf(input: ExportOrgOnePagerInput): Promise<void> {
  const model = buildOrgOnePagerModel({
    org: input.org,
    facilities: input.facilities,
    facilityPayersById: input.facilityPayersById,
    brandColor: input.brandColor,
    profileUrl: input.profileUrl,
  });

  const photoIds = model.facilities.filter((f) => f.photoUrl).map((f) => f.id);
  const [resolvedLogoUrl, resolvedQrUrl, ...resolvedPhotos] = await Promise.all([
    resolveImageUrl(model.logoUrl),
    resolveQrUrl(model.profileUrl),
    ...model.facilities.map((f) => (f.photoUrl ? resolveImageUrl(f.photoUrl) : Promise.resolve(null))),
  ]);

  const resolvedPhotoUrls: Record<string, string | null> = {};
  model.facilities.forEach((facility, i) => {
    resolvedPhotoUrls[facility.id] = resolvedPhotos[i] ?? null;
  });

  const { OrgOnePager } = await import("@/components/public/OrgOnePager");
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const rendered = await renderOffscreenElement("org-one-pager", OrgOnePager, {
    model,
    resolvedLogoUrl,
    resolvedPhotoUrls,
    resolvedQrUrl,
  });

  try {
    await waitForFonts();
    await waitForImages(rendered.node);
    await sleep(80);

    const dataUrl = await Promise.race([
      toPng(rendered.node, {
        pixelRatio: 2.5,
        width: LETTER_WIDTH_PX,
        height: LETTER_HEIGHT_PX,
        cacheBust: true,
        backgroundColor: model.theme.paper,
        ...htmlToImageSafeOptions,
        style: {
          transform: "none",
          margin: "0",
          opacity: "1",
        },
      }),
      new Promise<string>((_, reject) => {
        window.setTimeout(() => reject(new Error("PDF capture timed out")), 20000);
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
    pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "MEDIUM");
    pdf.save(input.filename ?? model.filename);
  } finally {
    rendered.cleanup();
    revokeIfBlob(resolvedLogoUrl);
    revokeIfBlob(resolvedQrUrl);
    for (const id of photoIds) revokeIfBlob(resolvedPhotoUrls[id]);
  }
}
