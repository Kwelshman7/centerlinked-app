/** Resolve the hero banner URL from org branding fields.
 * Prefers a dedicated cover, then logo (orgs can use their logo as the hero), then gallery.
 */
export function orgHeroImage(org: {
  cover_image_url?: string | null;
  logo_url?: string | null;
  image_urls?: string[] | null;
}): string | null {
  if (org.cover_image_url?.trim()) return org.cover_image_url.trim();
  if (org.logo_url?.trim()) return org.logo_url.trim();
  const first = org.image_urls?.find((u) => u?.trim());
  return first?.trim() ?? null;
}

/** True when the hero is the org logo because no cover photo was set. */
export function orgHeroIsLogoFallback(org: {
  cover_image_url?: string | null;
  logo_url?: string | null;
}): boolean {
  return !org.cover_image_url?.trim() && !!org.logo_url?.trim();
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
