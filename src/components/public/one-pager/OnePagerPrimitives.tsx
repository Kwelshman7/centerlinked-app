import type { CSSProperties, ReactNode } from "react";
import { photoFillStyle } from "@/lib/export-one-pager-capture";
import { WIRE, brandRgba, orgInitials } from "@/lib/one-pager-wire";

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
  const filled = items.filter(Boolean);
  return (
    <p
      style={wireBody({
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: filled.length ? 500 : 500,
        color: filled.length ? WIRE.ink : WIRE.empty,
      })}
    >
      {filled.length ? filled.join("  ·  ") : "—"}
    </p>
  );
}

/** Compact level-of-care chips for showcase / portfolio PDF templates. */
export function LevelPills({ items, brand }: { items: string[]; brand: string }) {
  const filled = items.filter(Boolean).slice(0, 6);
  if (!filled.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {filled.map((item) => (
        <span
          key={item}
          style={wireHeading({
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: 999,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: brand,
            background: brandRgba(brand, 0.1),
            border: `1px solid ${brandRgba(brand, 0.18)}`,
          })}
        >
          {item}
        </span>
      ))}
    </div>
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
          width: 52,
          height: 52,
          display: "grid",
          placeItems: "center",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: brand,
          background: brandRgba(brand, 0.08),
          border: `1px solid ${brandRgba(brand, 0.16)}`,
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
        height: 52,
        width: 168,
        padding: "6px 8px",
        boxSizing: "border-box",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
        border: `1px solid ${WIRE.rule}`,
      }}
    >
      <div style={photoFillStyle(logoUrl, "contain", { width: "100%", height: "100%" })} />
    </div>
  );
}

/** Always occupies the same rectangle. Missing photos stay a brand wash, never a broken-image tile. */
export function PhotoSlot({
  src,
  brand,
  height,
  fit = "cover",
}: {
  src: string | null;
  brand: string;
  height: number | string;
  fit?: "cover" | "contain";
}) {
  if (src) {
    return <div style={photoFillStyle(src, fit, { width: "100%", height })} />;
  }
  return (
    <div
      style={{
        width: "100%",
        height,
        background: `linear-gradient(145deg, ${brandRgba(brand, 0.2)} 0%, ${brandRgba(brand, 0.05)} 100%)`,
      }}
    />
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
        gap: 16,
        paddingLeft: 14,
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
  items,
}: {
  title: string;
  brand: string;
  items: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <SectionLabel color={brand}>{title}</SectionLabel>
      <FactLine items={items} />
    </div>
  );
}

/** Always reserve the footer band so paying vs unpaid pages share the same wire. */
export function WireFooter({ hidePlatformMark }: { hidePlatformMark: boolean }) {
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
      {hidePlatformMark ? null : (
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
      )}
    </footer>
  );
}
