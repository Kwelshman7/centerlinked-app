/** Shared Letter one-pager wire. Print measures, not UI-card measures. */

export const WIRE = {
  pageW: 816,
  pageH: 1056,
  padX: 40,
  padY: 22,
  gutter: 22,
  radius: 4,
  mastheadH: 78,
  heroH: 248,
  galleryH: 112,
  footerH: 22,
  ink: "#152033",
  muted: "#5a6573",
  rule: "#d8dde3",
  paper: "#ffffff",
  fontDisplay: "Montserrat, Inter, system-ui, sans-serif",
  fontBody: "Inter, system-ui, sans-serif",
} as const;

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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

export function brandRgba(hex: string, alpha: number, fallback = "rgba(26,115,232,0.12)"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

export function formatCreatedOn(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

export function orgInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
