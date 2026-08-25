import type { CSSProperties, ReactNode } from "react";
import { photoFillStyle } from "@/lib/export-one-pager-capture";
import { WIRE, orgInitials } from "@/lib/one-pager-wire";

export function wireHeading(extra?: CSSProperties): CSSProperties {
  return { fontFamily: WIRE.fontDisplay, margin: 0, ...extra };
}

export function wireBody(extra?: CSSProperties): CSSProperties {
  return { fontFamily: WIRE.fontBody, margin: 0, ...extra };
}

export function SectionLabel({ children, color }: { children: ReactNode; color: string }) {
  return (
    <p
      style={wireHeading({
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
      })}
    >
      {children}
    </p>
  );
}

export function FactLine({ items }: { items: string[] }) {
  return (
    <p
      style={wireBody({
        fontSize: 12,
        lineHeight: 1.55,
        fontWeight: 500,
        color: WIRE.ink,
      })}
    >
      {items.join("  ·  ")}
    </p>
  );
}

export function LogoMark({
  logoUrl,
  name,
  brand,
}: {
  logoUrl: string | null;
  name: string;
  brand: string;
}) {
  if (!logoUrl) {
    const initials = orgInitials(name);
    if (!initials) return null;
    return (
      <div
        style={wireHeading({
          flexShrink: 0,
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: brand,
        })}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{
        flexShrink: 0,
        height: 44,
        width: 168,
        overflow: "hidden",
      }}
    >
      <div style={photoFillStyle(logoUrl, "contain", { width: "100%", height: "100%" })} />
    </div>
  );
}

export function WireColumn({
  brand,
  children,
}: {
  brand: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        paddingLeft: 16,
        borderLeft: `2px solid ${brand}`,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export function WireBlock({
  title,
  brand,
  children,
}: {
  title: string;
  brand: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <SectionLabel color={brand}>{title}</SectionLabel>
      {children}
    </div>
  );
}

/** Paying orgs: no platform mark. Unpaid: tiny centered attribution on white. */
export function WireFooter({
  hidePlatformMark,
}: {
  brand?: string;
  onBrand?: string;
  hidePlatformMark: boolean;
}) {
  if (hidePlatformMark) return null;

  return (
    <footer
      style={{
        flexShrink: 0,
        height: WIRE.footerH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: `1px solid ${WIRE.rule}`,
      }}
    >
      <p
        style={wireHeading({
          fontSize: 7,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8b949e",
        })}
      >
        Created on centerlinked.com
      </p>
    </footer>
  );
}
