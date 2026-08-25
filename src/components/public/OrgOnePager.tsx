import type { CSSProperties, ReactNode } from "react";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX, photoFillStyle } from "@/lib/export-one-pager-capture";
import {
  brandRgba,
  type OrgOnePagerFacility,
  type OrgOnePagerModel,
  type OrgOnePagerTheme,
} from "@/lib/org-one-pager-model";

export type OrgOnePagerProps = {
  model: OrgOnePagerModel;
  resolvedLogoUrl?: string | null;
  resolvedCoverUrl?: string | null;
  resolvedPhotoUrls?: Record<string, string | null>;
  resolvedQrUrl?: string | null;
  hidePlatformMark?: boolean;
};

function fontHeading(extra?: CSSProperties): CSSProperties {
  return { fontFamily: "Montserrat, Inter, system-ui, sans-serif", ...extra };
}

function fontBody(extra?: CSSProperties): CSSProperties {
  return { fontFamily: "Inter, system-ui, sans-serif", ...extra };
}

function SectionLabel({ children, color }: { children: ReactNode; color: string }) {
  return (
    <p
      style={fontHeading({
        margin: 0,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
      })}
    >
      {children}
    </p>
  );
}

function Pill({
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
      style={fontBody({
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "100%",
        padding: solid ? "3px 7px" : "2px 6px",
        borderRadius: 4,
        border: `1px solid ${brandRgba(brand, solid ? 0.28 : 0.16)}`,
        background: solid ? brandRgba(brand, 0.12) : "#ffffff",
        color: solid ? brand : "#1e293b",
        fontSize: 9.5,
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      })}
    >
      {children}
    </span>
  );
}

function PayerLine({
  payers,
  overflow,
  brand,
  compact,
}: {
  payers: string[];
  overflow: number;
  brand: string;
  compact?: boolean;
}) {
  if (payers.length === 0 && overflow === 0) return null;
  const text = [...payers, overflow > 0 ? `+${overflow} more` : null].filter(Boolean).join("  ·  ");
  return (
    <div>
      <SectionLabel color={brand}>In-network</SectionLabel>
      <p
        style={fontBody({
          margin: compact ? "3px 0 0" : "5px 0 0",
          fontSize: compact ? 9.5 : 10.5,
          lineHeight: 1.35,
          color: "#334155",
          fontWeight: 500,
        })}
      >
        {text}
      </p>
    </div>
  );
}

function Header({
  model,
  logoUrl,
  coverUrl,
}: {
  model: OrgOnePagerModel;
  logoUrl: string | null;
  coverUrl: string | null;
}) {
  const { theme } = model;
  if (coverUrl) {
    return (
      <header
        style={{
          position: "relative",
          flexShrink: 0,
          height: 168,
          overflow: "hidden",
          background: theme.brand,
          color: theme.onBrand,
        }}
      >
        <div
          aria-hidden
          style={photoFillStyle(coverUrl, "cover", {
            position: "absolute",
            inset: 0,
          })}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(100deg, ${theme.brand}f0 0%, ${theme.brand}99 55%, ${theme.brand}55 100%)`,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "22px 32px",
            height: "100%",
          }}
        >
          {logoUrl ? (
            <div
              style={{
                flexShrink: 0,
                height: 64,
                maxWidth: 180,
                background: "#ffffff",
                borderRadius: 12,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={photoFillStyle(logoUrl, "contain", {
                  height: 48,
                  width: 160,
                  maxWidth: 160,
                })}
              />
            </div>
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={fontHeading({
                margin: 0,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: theme.mutedOnBrand,
              })}
            >
              Referral overview
            </p>
            <h1
              style={fontHeading({
                margin: "4px 0 0",
                fontSize: model.orgName.length > 32 ? 20 : 26,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: theme.onBrand,
              })}
            >
              {model.orgName}
            </h1>
            {model.tagline ? (
              <p
                style={fontBody({
                  margin: "4px 0 0",
                  fontSize: 12,
                  fontWeight: 500,
                  color: theme.mutedOnBrand,
                })}
              >
                {model.tagline}
              </p>
            ) : null}
            {model.locationContext ? (
              <p
                style={fontBody({
                  margin: "5px 0 0",
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.mutedOnBrand,
                })}
              >
                {model.locationContext}
              </p>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "22px 32px 18px",
        background: "#ffffff",
        borderBottom: `3px solid ${theme.brand}`,
      }}
    >
      {logoUrl ? (
        <div
          style={{
            flexShrink: 0,
            height: 58,
            maxWidth: 200,
            display: "flex",
            alignItems: "center",
          }}
        >
              <div
                style={photoFillStyle(logoUrl, "contain", {
                  height: 58,
                  width: 200,
                  maxWidth: 200,
                })}
              />
        </div>
      ) : null}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={fontHeading({
            margin: 0,
            fontSize: model.orgName.length > 32 ? 20 : 24,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: theme.ink,
          })}
        >
          {model.orgName}
        </h1>
        {model.tagline ? (
          <p
            style={fontBody({
              margin: "4px 0 0",
              fontSize: 12,
              fontWeight: 500,
              color: theme.muted,
            })}
          >
            {model.tagline}
          </p>
        ) : null}
        {model.locationContext ? (
          <p
            style={fontBody({
              margin: "5px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: theme.brand,
              fontWeight: 600,
            })}
          >
            <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} aria-hidden />
            {model.locationContext}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function FacilityCard({
  facility,
  theme,
  photoUrl,
  layout,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
  photoUrl: string | null;
  layout: OrgOnePagerModel["layout"];
}) {
  const compact = layout === "grid" || layout === "trio";
  const dense = layout === "rows";
  const photoH = layout === "feature" ? 210 : layout === "split" ? 150 : 118;

  if (dense) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.9fr 1.2fr",
          gap: 12,
          alignItems: "center",
          padding: "8px 0",
          borderBottom: `1px solid ${theme.rule}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={fontHeading({
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: theme.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {facility.name}
          </p>
          <p style={fontBody({ margin: "2px 0 0", fontSize: 10, color: theme.muted })}>
            {[facility.cityState, facility.address].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {facility.levels.map((level) => (
            <Pill key={level} brand={theme.brand} solid>
              {level}
            </Pill>
          ))}
        </div>
        <p
          style={fontBody({
            margin: 0,
            fontSize: 10,
            color: "#334155",
            lineHeight: 1.3,
          })}
        >
          {facility.payers.length
            ? [...facility.payers, facility.payerOverflow > 0 ? `+${facility.payerOverflow}` : null]
                .filter(Boolean)
                .join(" · ")
            : facility.whoWeTreat.join(" · ")}
        </p>
      </div>
    );
  }

  return (
    <article
      style={{
        minWidth: 0,
        display: "flex",
        flexDirection: layout === "feature" && photoUrl ? "row" : "column",
        gap: layout === "feature" ? 18 : 10,
        height: "100%",
        background: "#ffffff",
        border: `1px solid ${theme.rule}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(26,35,50,0.04)",
      }}
    >
      {photoUrl ? (
          <div
            style={photoFillStyle(photoUrl, "cover", {
              flexShrink: 0,
              width: layout === "feature" ? 300 : "100%",
              height: layout === "feature" ? "100%" : photoH,
              minHeight: layout === "feature" ? 240 : photoH,
            })}
          />
      ) : null}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: compact ? 8 : 10,
          padding: layout === "feature" ? "16px 18px 16px 4px" : compact ? "12px 12px 14px" : "14px 16px 16px",
        }}
      >
        <div>
          <h2
            style={fontHeading({
              margin: 0,
              fontSize: layout === "feature" ? 20 : compact ? 13 : 16,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: theme.ink,
            })}
          >
            {facility.name}
          </h2>
          {facility.cityState || facility.address ? (
            <p
              style={fontBody({
                margin: "4px 0 0",
                fontSize: 10.5,
                color: theme.muted,
                lineHeight: 1.35,
              })}
            >
              {[facility.cityState, facility.address].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {facility.tagline ? (
            <p
              style={fontBody({
                margin: "5px 0 0",
                fontSize: 11,
                fontStyle: "italic",
                color: theme.ink,
                opacity: 0.78,
              })}
            >
              {facility.tagline}
            </p>
          ) : null}
        </div>

        {facility.summary && layout === "feature" ? (
          <p style={fontBody({ margin: 0, fontSize: 12, lineHeight: 1.45, color: "#334155" })}>
            {facility.summary}
          </p>
        ) : null}

        {facility.levels.length > 0 ? (
          <div>
            <SectionLabel color={theme.brand}>Levels of care</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {facility.levels.map((level) => (
                <Pill key={level} brand={theme.brand} solid>
                  {level}
                </Pill>
              ))}
            </div>
          </div>
        ) : null}

        {facility.whoWeTreat.length > 0 ? (
          <div>
            <SectionLabel color={theme.brand}>Who we treat</SectionLabel>
            <p
              style={fontBody({
                margin: "4px 0 0",
                fontSize: 10.5,
                color: "#334155",
                lineHeight: 1.35,
              })}
            >
              {facility.whoWeTreat.join("  ·  ")}
            </p>
          </div>
        ) : null}

        {facility.specialties.length > 0 ? (
          <div>
            <SectionLabel color={theme.brand}>Programs</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {facility.specialties.map((item) => (
                <Pill key={item} brand={theme.brand}>
                  {item}
                </Pill>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: "auto" }}>
          <PayerLine
            payers={facility.payers}
            overflow={facility.payerOverflow}
            brand={theme.brand}
            compact={compact}
          />
        </div>
      </div>
    </article>
  );
}

function Footer({
  model,
  qrUrl,
  hidePlatformMark = false,
}: {
  model: OrgOnePagerModel;
  qrUrl: string | null;
  hidePlatformMark?: boolean;
}) {
  const { theme, contact } = model;
  const hasContact = !!(contact.name || contact.phone || contact.email || contact.website);
  return (
    <footer
      style={{
        position: "relative",
        flexShrink: 0,
        display: "flex",
        alignItems: "stretch",
        gap: 16,
        padding: hidePlatformMark ? "14px 32px 16px" : "14px 32px 22px",
        background: theme.brand,
        color: theme.onBrand,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p
          style={fontHeading({
            margin: 0,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: theme.mutedOnBrand,
          })}
        >
          Referrals
        </p>
        {hasContact ? (
          <>
            {contact.name ? (
              <p
                style={fontHeading({
                  margin: "4px 0 0",
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: theme.onBrand,
                })}
              >
                {contact.name}
              </p>
            ) : null}
            {contact.title ? (
              <p style={fontBody({ margin: "1px 0 0", fontSize: 10.5, color: theme.mutedOnBrand })}>
                {contact.title}
              </p>
            ) : null}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 14px",
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {contact.phone ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Phone style={{ width: 12, height: 12, opacity: 0.85 }} aria-hidden />
                  {contact.phone}
                </span>
              ) : null}
              {contact.email ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Mail style={{ width: 12, height: 12, opacity: 0.85 }} aria-hidden />
                  {contact.email}
                </span>
              ) : null}
              {contact.website ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Globe style={{ width: 12, height: 12, opacity: 0.85 }} aria-hidden />
                  {contact.website}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <p style={fontBody({ margin: "6px 0 0", fontSize: 12, color: theme.mutedOnBrand })}>
            Use the live profile to reach this organization.
          </p>
        )}
      </div>

      {qrUrl && model.profileUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 8,
              background: "#ffffff",
              padding: 5,
              boxSizing: "border-box",
            }}
          >
            <div
              style={photoFillStyle(qrUrl, "contain", {
                width: "100%",
                height: "100%",
              })}
            />
          </div>
          <div style={{ maxWidth: 110 }}>
            <p
              style={fontBody({
                margin: 0,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1.3,
                color: theme.onBrand,
              })}
            >
              View live facility & insurance information
            </p>
          </div>
        </div>
      ) : null}
      {!hidePlatformMark ? (
        <p
          style={fontHeading({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 5,
            margin: 0,
            textAlign: "center",
            fontSize: 7.5,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.7,
            color: theme.onBrand,
          })}
        >
          Created on centerlinked.com
        </p>
      ) : null}
    </footer>
  );
}

export function OrgOnePager({
  model,
  resolvedLogoUrl,
  resolvedCoverUrl,
  resolvedPhotoUrls = {},
  resolvedQrUrl,
  hidePlatformMark = false,
}: OrgOnePagerProps) {
  const { theme, layout, facilities } = model;
  const logoUrl = resolvedLogoUrl ?? null;
  const photoFor = (facility: OrgOnePagerFacility) => resolvedPhotoUrls[facility.id] ?? null;

  const columns =
    layout === "split" ? 2 : layout === "trio" ? 3 : layout === "grid" ? 2 : 1;

  return (
    <article
      data-org-one-pager
      style={{
        width: LETTER_WIDTH_PX,
        height: LETTER_HEIGHT_PX,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: theme.paper,
        color: theme.ink,
        ...fontBody(),
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Header model={model} logoUrl={logoUrl} coverUrl={resolvedCoverUrl ?? null} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "16px 32px 12px",
          overflow: "hidden",
        }}
      >
        {model.overview ? (
          <p
            style={fontBody({
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#334155",
              maxWidth: 720,
            })}
          >
            {model.overview}
          </p>
        ) : null}

        {model.sharedPayers && model.sharedPayers.length > 0 ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "#ffffff",
              border: `1px solid ${theme.rule}`,
            }}
          >
            <PayerLine
              payers={model.sharedPayers}
              overflow={model.sharedPayerOverflow}
              brand={theme.brand}
            />
            <p
              style={fontBody({
                margin: "4px 0 0",
                fontSize: 9.5,
                color: theme.muted,
              })}
            >
              Listed for every location on this sheet
            </p>
          </div>
        ) : null}

        {facilities.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              color: theme.muted,
              fontSize: 13,
            }}
          >
            Facility details are published on the live profile.
          </div>
        ) : layout === "rows" ? (
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 0.9fr 1.2fr",
                gap: 12,
                paddingBottom: 6,
                borderBottom: `1.5px solid ${theme.brand}`,
              }}
            >
              <SectionLabel color={theme.brand}>Facility</SectionLabel>
              <SectionLabel color={theme.brand}>Levels of care</SectionLabel>
              <SectionLabel color={theme.brand}>
                {facilities.some((f) => f.payers.length) ? "In-network" : "Who we treat"}
              </SectionLabel>
            </div>
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                theme={theme}
                photoUrl={null}
                layout="rows"
              />
            ))}
            {model.facilityOverflow > 0 ? (
              <p style={fontBody({ margin: "10px 0 0", fontSize: 11, color: theme.muted })}>
                +{model.facilityOverflow} additional{" "}
                {model.facilityOverflow === 1 ? "location" : "locations"} on the live profile
              </p>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows:
                layout === "grid"
                  ? `repeat(${Math.max(1, Math.ceil(facilities.length / 2))}, minmax(0, 1fr))`
                  : "minmax(0, 1fr)",
              gap: layout === "feature" ? 0 : 12,
              overflow: "hidden",
            }}
          >
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                theme={theme}
                photoUrl={photoFor(facility)}
                layout={layout}
              />
            ))}
          </div>
        )}
      </div>

      <Footer model={model} qrUrl={resolvedQrUrl ?? null} hidePlatformMark={hidePlatformMark} />
    </article>
  );
}
