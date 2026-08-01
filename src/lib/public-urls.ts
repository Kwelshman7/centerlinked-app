export const DEFAULT_BRAND = "#1A73E8";
export const DEFAULT_ACCENT = "#E0EDFF";

function parseHexColor(value: string | null | undefined, fallback: string): string {
  const v = value?.trim();
  if (!v || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return fallback;

  // Normalize shorthand before colors are extended with alpha values in inline styles.
  if (v.length === 4) {
    return `#${v.slice(1).split("").map((channel) => channel + channel).join("")}`;
  }
  return v;
}

export function parseBrandColor(value: string | null | undefined): string {
  return parseHexColor(value, DEFAULT_BRAND);
}

export function parseAccentColor(value: string | null | undefined): string {
  return parseHexColor(value, DEFAULT_ACCENT);
}

/** Canonical public path for an organization mini-homepage. */
export function orgPublicPath(orgSlug: string): string {
  return `/o/${orgSlug}`;
}

/** Branded program sheet path — prefers org-scoped URL when org slug is known. */
export function programPublicPath(facilitySlug: string, orgSlug?: string | null): string {
  if (orgSlug) return `/o/${orgSlug}/p/${facilitySlug}`;
  return `/p/${facilitySlug}`;
}

export function orgPublicUrl(origin: string, orgSlug: string): string {
  return `${origin}${orgPublicPath(orgSlug)}`;
}

export function programPublicUrl(
  origin: string,
  facilitySlug: string,
  orgSlug?: string | null,
): string {
  return `${origin}${programPublicPath(facilitySlug, orgSlug)}`;
}

/** Human-readable URL for copy UI (no protocol). */
export function programDisplayPath(facilitySlug: string, orgSlug?: string | null): string {
  if (orgSlug) return `centerlinked.com/o/${orgSlug}/p/${facilitySlug}`;
  return `centerlinked.com/p/${facilitySlug}`;
}

export function orgDisplayPath(orgSlug: string): string {
  return `centerlinked.com/o/${orgSlug}`;
}
