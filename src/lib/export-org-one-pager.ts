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
import { shortenLevelOfCare, uniquePreserve } from "@/lib/org-one-pager-layout";
import { buildOrgOnePagerModel } from "@/lib/org-one-pager-model";
import { polishOrgOnePagerCopy } from "@/lib/one-pager-copy";
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
  const visible = input.facilities.filter((f) => !f.hidden_from_org_page);
  const levels = uniquePreserve(
    visible.flatMap((f) => (f.levels_of_care ?? []).map(shortenLevelOfCare)),
  );
  const states = uniquePreserve(visible.map((f) => f.state?.trim() || "").filter(Boolean));

  const polished = await polishOrgOnePagerCopy({
    name: input.org.name,
    tagline: input.org.tagline,
    description: input.org.description,
    locationContext: [input.org.hq_city, input.org.hq_state].filter(Boolean).join(", "),
    facilityCount: visible.length,
    levels,
    states,
    facilityNames: visible.map((f) => f.name).slice(0, 20),
  });

  const model = buildOrgOnePagerModel({
    org: {
      ...input.org,
      tagline: polished?.tagline || input.org.tagline,
    },
    facilities: input.facilities,
    facilityPayersById: input.facilityPayersById,
    brandColor: input.brandColor,
    profileUrl: input.profileUrl,
    overviewOverride: polished?.description ?? null,
  });

  const photoIds = model.density === "generous" ? model.facilities : [];
  const coverSource =
    input.org.cover_image_url ??
    input.org.image_urls?.[0] ??
    visible.find((f) => f.image_urls?.[0])?.image_urls?.[0] ??
    null;
  const [resolvedLogoUrl, resolvedCoverUrl, resolvedQrUrl, hidePlatformMark, ...resolvedPhotos] =
    await Promise.all([
      resolveImageUrl(model.logoUrl, "logo").then(
        async (logo) => logo ?? resolveImageUrl(input.org.favicon_url, "logo"),
      ),
      resolveImageUrl(coverSource, "photo"),
      resolveQrUrl(model.profileUrl),
      orgHidesPlatformMark(input.org.id),
      ...photoIds.map((f) => (f.photoUrl ? resolveImageUrl(f.photoUrl, "photo") : Promise.resolve(null))),
    ]);

  const resolvedPhotoUrls: Record<string, string | null> = {};
  photoIds.forEach((facility, i) => {
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

  const pages = model.pages.length ? model.pages : [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const isFirst = page.pageNumber === 1;
    const rendered = await renderOffscreenElement("org-one-pager", OrgOnePager, {
      model,
      page,
      resolvedLogoUrl,
      resolvedCoverUrl: isFirst ? resolvedCoverUrl : null,
      resolvedPhotoUrls,
      resolvedQrUrl: isFirst ? resolvedQrUrl : null,
      hidePlatformMark,
    });
    try {
      await waitForFonts();
      await waitForImages(rendered.node);
      await sleep(isFirst ? 350 : 180);
      const dataUrl = await Promise.race([
        toPng(rendered.node, {
          pixelRatio: 2,
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
          window.setTimeout(() => reject(new Error("PDF capture timed out")), 25000);
        }),
      ]);
      if (i > 0) pdf.addPage("letter", "portrait");
      pdf.addImage(dataUrl, "PNG", 0, 0, 8.5, 11, undefined, "FAST");
    } finally {
      rendered.cleanup();
    }
  }
  pdf.save(input.filename ?? model.filename);
}
