import { useEffect, useState } from "react";
import { extractLogoColor } from "@/lib/extract-logo-color";
import { DEFAULT_BRAND, parseBrandColor } from "@/lib/public-urls";

function isHexColor(value: string | null | undefined): boolean {
  const v = value?.trim();
  return !!v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

export function useOrgBrandColor(
  org: { brand_color?: string | null; logo_url?: string | null } | null | undefined,
  override?: string,
): string {
  const explicit = override ?? org?.brand_color;
  const hasExplicit = isHexColor(explicit);
  const [extracted, setExtracted] = useState<string | null>(null);

  useEffect(() => {
    if (hasExplicit) return;
    if (!org?.logo_url) return;

    let cancelled = false;
    extractLogoColor(org.logo_url).then((color) => {
      if (!cancelled && color) setExtracted(color);
    });
    return () => {
      cancelled = true;
    };
  }, [hasExplicit, org?.logo_url]);

  if (hasExplicit) return parseBrandColor(explicit);
  if (extracted) return extracted;
  return DEFAULT_BRAND;
}
