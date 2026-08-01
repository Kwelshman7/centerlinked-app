/** Parse #RGB / #RRGGBB into 0–255 channels. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** White or near-black text that contrasts with a brand background. */
export function contrastingTextColor(hex: string | null | undefined): "#ffffff" | "#0f172a" {
  const rgb = hex ? parseHex(hex) : null;
  if (!rgb) return "#ffffff";
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.45 ? "#0f172a" : "#ffffff";
}

/** Soft fill for circular logo tile on the brand footer. */
export function footerLogoTileBg(textColor: "#ffffff" | "#0f172a"): string {
  return textColor === "#ffffff" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)";
}

export function footerMutedText(textColor: "#ffffff" | "#0f172a"): string {
  return textColor === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.65)";
}

export function footerRingColor(textColor: "#ffffff" | "#0f172a"): string {
  return textColor === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.35)";
}
