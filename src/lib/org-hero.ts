/** Resolve the hero banner URL from org branding fields. */
export function orgHeroImage(org: {
  cover_image_url?: string | null;
  image_urls?: string[] | null;
}): string | null {
  if (org.cover_image_url?.trim()) return org.cover_image_url.trim();
  const first = org.image_urls?.find((u) => u?.trim());
  return first?.trim() ?? null;
}

/** Merge stored gallery + hero into one ordered list (hero first). */
export function mergeOrgImages(
  imageUrls: string[] | null | undefined,
  coverUrl: string | null | undefined,
): string[] {
  const gallery = (imageUrls ?? []).filter(Boolean);
  const cover = coverUrl?.trim();
  if (!cover) return gallery;
  return [cover, ...gallery.filter((u) => u !== cover)];
}
