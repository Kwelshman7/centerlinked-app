import type { ReactNode } from "react";
import { Award, Building2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import { contrastingTextColor } from "@/lib/color-contrast";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { DEFAULT_ACCENT, parseAccentColor, parseBrandColor } from "@/lib/public-urls";

/** Letter at 96dpi — captures cleanly into an 8.5×11 PDF. */
export const ONE_PAGER_WIDTH = 816;
export const ONE_PAGER_HEIGHT = 1056;

export type FacilityOnePagerProps = {
  facility: FacilitySheetData;
  org: SheetOrg | null;
  contracts: SheetContract[];
  brandColor?: string;
  /** Pre-resolved image URLs (blob:/data:) for CORS-safe capture. */
  resolvedLogoUrl?: string | null;
  resolvedHeroUrl?: string | null;
  createdAt?: Date;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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

function rgba(hex: string, alpha: number, fallback = "rgba(26,115,232,0.12)"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function formatCreatedOn(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function SectionLabel({ children, color }: { children: ReactNode; color: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: "Montserrat, Inter, system-ui, sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </p>
  );
}

function Chip({
  children,
  brand,
  solid = false,
}: {
  children: ReactNode;
  brand: string;
  solid?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        maxWidth: "100%",
        padding: solid ? "5px 9px" : "4px 8px",
        borderRadius: 5,
        border: `1px solid ${rgba(brand, solid ? 0.28 : 0.18)}`,
        background: solid ? rgba(brand, 0.12) : "#ffffff",
        color: solid ? brand : "#1e293b",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Fixed Letter-size referral one-pager. Designed for high-DPI capture into PDF —
 * not for on-screen browsing. Keep layout strictly within ONE_PAGER_* bounds.
 */
export function FacilityOnePager({
  facility,
  org,
  contracts,
  brandColor,
  resolvedLogoUrl,
  resolvedHeroUrl,
  createdAt = new Date(),
}: FacilityOnePagerProps) {
  const brand = parseBrandColor(brandColor ?? org?.brand_color);
  const accent = parseAccentColor(org?.accent_color) || DEFAULT_ACCENT;
  const onBrand = contrastingTextColor(brand);
  const mutedOnBrand = onBrand === "#ffffff" ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.7)";

  const logoUrl = resolvedLogoUrl ?? org?.logo_url ?? null;
  const heroUrl =
    resolvedHeroUrl ??
    facility.image_urls?.[0] ??
    org?.cover_image_url ??
    null;

  const cityStateZip = [[facility.city, facility.state].filter(Boolean).join(", "), facility.zip]
    .filter(Boolean)
    .join(" ");
  const locationLine = [facility.address_line1, cityStateZip].filter(Boolean).join(" · ");

  const summary =
    facility.short_description?.trim() ||
    facility.tagline?.trim() ||
    facility.description?.trim() ||
    null;
  const summaryTrimmed = summary
    ? summary.length > 280
      ? `${summary.slice(0, 277).trimEnd()}…`
      : summary
    : null;

  const facilityType = facility.treatment_focus || facility.levels_of_care?.[0] || null;
  const levels = (facility.levels_of_care ?? []).filter(Boolean).slice(0, 10);
  const inNetwork = contracts.filter((c) => c.in_network);
  // Dense grid — keep to a single Letter page with room for BD + highlights.
  const payers = inNetwork.slice(0, 24);
  const payerOverflow = Math.max(0, inNetwork.length - payers.length);

  const features = [
    ...(facility.quick_highlights ?? []),
    ...(facility.highlights ?? []),
    ...(facility.specializations ?? []),
  ]
    .filter((item, i, arr) => item?.trim() && arr.indexOf(item) === i)
    .slice(0, 8);

  const population = (facility.population_served ?? []).filter(Boolean).slice(0, 6);
  const accreditations = (facility.accreditations ?? [])
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 5);

  const facilityHasOwnBd = !!(
    facility.bd_contact_name?.trim() &&
    (facility.bd_contact_phone?.trim() || facility.bd_contact_email?.trim())
  );
  const repName = facility.bd_contact_name || org?.bd_contact_name || null;
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email || org?.bd_contact_email || null;
  const displayPhone = formatPhoneDisplay(repPhone);
  const hasPhone = !!sanitizePhone(repPhone);
  const hasBd = !!(repName?.trim() || hasPhone || repEmail?.trim());
  const repTitle = facilityHasOwnBd
    ? "Business Development Representative"
    : org?.bd_contact_name
      ? "Organization Business Development Contact"
      : "Business Development Representative";

  const createdLabel = formatCreatedOn(createdAt);

  return (
    <article
      data-facility-one-pager
      style={{
        width: ONE_PAGER_WIDTH,
        height: ONE_PAGER_HEIGHT,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(165deg, #ffffff 0%, ${accent} 42%, #ffffff 100%)`,
        color: "#0f172a",
        fontFamily: "Inter, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Brand header */}
      <header
        style={{
          position: "relative",
          flexShrink: 0,
          padding: "22px 28px 20px",
          background: `linear-gradient(120deg, ${brand} 0%, ${brand}ee 55%, ${brand}cc 100%)`,
          color: onBrand,
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 120% at 100% 0%, rgba(255,255,255,0.18), transparent 55%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 72,
              height: 72,
              borderRadius: 14,
              background: "#ffffff",
              padding: 8,
              boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  // Keep full-color logos (never greyscale in export)
                  filter: "none",
                }}
              />
            ) : (
              <Building2 style={{ width: 36, height: 36, color: brand }} aria-hidden />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: mutedOnBrand,
                fontFamily: "Montserrat, Inter, system-ui, sans-serif",
              }}
            >
              Referral one-pager
            </p>
            <h1
              style={{
                margin: "4px 0 0",
                fontFamily: "Montserrat, Inter, system-ui, sans-serif",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: onBrand,
              }}
            >
              {facility.name}
            </h1>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "6px 14px",
                fontSize: 12,
                color: mutedOnBrand,
              }}
            >
              {org?.name ? (
                <span style={{ fontWeight: 600, color: onBrand }}>{org.name}</span>
              ) : null}
              {locationLine ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 12, height: 12, opacity: 0.9 }} aria-hidden />
                  {locationLine}
                </span>
              ) : null}
              {facilityType ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Building2 style={{ width: 12, height: 12, opacity: 0.9 }} aria-hidden />
                  {facilityType}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Body — clipped so the attribution footer always remains on page 1 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "18px 28px 10px",
          overflow: "hidden",
        }}
      >
        {/* Hero + BD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: heroUrl ? "300px 1fr" : "1fr",
            gap: 16,
            alignItems: "stretch",
            flexShrink: 0,
          }}
        >
          {heroUrl ? (
            <div
              style={{
                position: "relative",
                height: 210,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: `0 14px 36px ${rgba(brand, 0.22)}, 0 0 0 1px ${rgba(brand, 0.12)}`,
                background: "#e2e8f0",
              }}
            >
              <img
                src={heroUrl}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, transparent 55%, ${rgba(brand, 0.35)} 100%)`,
                }}
              />
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minWidth: 0,
            }}
          >
            {summaryTrimmed ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: "#334155",
                }}
              >
                {summaryTrimmed}
              </p>
            ) : null}

            {hasBd ? (
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  border: `1.5px solid ${rgba(brand, 0.35)}`,
                  background: `linear-gradient(145deg, ${rgba(brand, 0.14)} 0%, #ffffff 55%)`,
                  boxShadow: `0 10px 28px ${rgba(brand, 0.12)}`,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px",
                    background: brand,
                    color: onBrand,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "Montserrat, Inter, system-ui, sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    Business Development Contact
                  </p>
                </div>
                <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "Montserrat, Inter, system-ui, sans-serif",
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                        color: "#0f172a",
                      }}
                    >
                      {repName?.trim() || "Referral Contact"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                      {repTitle}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {displayPhone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: rgba(brand, 0.12),
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Phone style={{ width: 13, height: 13, color: brand }} aria-hidden />
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {displayPhone}
                        </span>
                      </div>
                    ) : null}
                    {repEmail?.trim() ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: rgba(brand, 0.12),
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Mail style={{ width: 13, height: 13, color: brand }} aria-hidden />
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {repEmail.trim()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  border: `1px dashed ${rgba(brand, 0.28)}`,
                  background: rgba(brand, 0.05),
                  display: "grid",
                  placeItems: "center",
                  padding: 16,
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Contact your CenterLinked representative for referrals.
              </div>
            )}
          </div>
        </div>

        {/* Levels of care */}
        {levels.length > 0 ? (
          <section style={{ flexShrink: 0 }}>
            <SectionLabel color={brand}>Levels of care</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {levels.map((level) => (
                <Chip key={level} brand={brand} solid>
                  {level}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        {/* Insurance — primary facts block */}
        <section style={{ flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <SectionLabel color={brand}>In-network insurance</SectionLabel>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b" }}>
              {inNetwork.length > 0
                ? `${inNetwork.length} contract${inNetwork.length === 1 ? "" : "s"}`
                : "None listed"}
            </span>
          </div>
          {payers.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 6,
                padding: 10,
                borderRadius: 12,
                background: "#ffffff",
                border: `1px solid ${rgba(brand, 0.14)}`,
                boxShadow: "0 1px 0 rgba(15,23,42,0.03)",
              }}
            >
              {payers.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    minWidth: 0,
                    padding: "5px 7px",
                    borderRadius: 6,
                    background: rgba(brand, 0.05),
                    border: `1px solid ${rgba(brand, 0.1)}`,
                  }}
                >
                  <ShieldCheck
                    style={{ width: 12, height: 12, color: brand, flexShrink: 0 }}
                    aria-hidden
                  />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#1e293b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.payer_name}
                  </span>
                </div>
              ))}
              {payerOverflow > 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 7px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: brand,
                  }}
                >
                  +{payerOverflow} more
                </div>
              ) : null}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              In-network contracts are not listed for this facility yet.
            </p>
          )}
        </section>

        {/* Features / population / accreditations */}
        {(features.length > 0 || population.length > 0 || accreditations.length > 0) && (
          <section
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns:
                features.length > 0 && (population.length > 0 || accreditations.length > 0)
                  ? "1.15fr 1fr"
                  : "1fr",
              gap: 12,
            }}
          >
            {features.length > 0 ? (
              <div
                style={{
                  borderRadius: 12,
                  border: `1px solid ${rgba(brand, 0.14)}`,
                  background: "#ffffff",
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <SectionLabel color={brand}>Program highlights</SectionLabel>
                <ul
                  style={{
                    margin: "8px 0 0",
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  {features.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 7,
                        fontSize: 11.5,
                        lineHeight: 1.35,
                        color: "#1e293b",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 5,
                          height: 5,
                          marginTop: 5,
                          borderRadius: 999,
                          background: brand,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(population.length > 0 || accreditations.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                {population.length > 0 ? (
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${rgba(brand, 0.14)}`,
                      background: "#ffffff",
                      padding: "12px 14px",
                    }}
                  >
                    <SectionLabel color={brand}>Population served</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {population.map((p) => (
                        <Chip key={p} brand={brand}>
                          {p}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : null}
                {accreditations.length > 0 ? (
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${rgba(brand, 0.14)}`,
                      background: "#ffffff",
                      padding: "12px 14px",
                    }}
                  >
                    <SectionLabel color={brand}>Accreditations</SectionLabel>
                    <ul
                      style={{
                        margin: "8px 0 0",
                        padding: 0,
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {accreditations.map((item) => (
                        <li
                          key={item}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          <Award style={{ width: 13, height: 13, color: brand, flexShrink: 0 }} aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Required attribution footer */}
      <footer
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 28px 14px",
          borderTop: `1px solid ${rgba(brand, 0.16)}`,
          background: `linear-gradient(180deg, ${rgba(brand, 0.04)} 0%, ${rgba(brand, 0.1)} 100%)`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "#475569",
          }}
        >
          Created on {createdLabel} using centerlinked.com
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "Montserrat, Inter, system-ui, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: brand,
          }}
        >
          CenterLinked
        </p>
      </footer>
    </article>
  );
}
