import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/lib/export-one-pager-capture";
import { WIRE } from "@/lib/one-pager-wire";
import {
  FactLine,
  LogoMark,
  PhotoSlot,
  SectionLabel,
  wireBody,
  wireHeading,
} from "@/components/public/one-pager/OnePagerPrimitives";
import type {
  OrgOnePagerContact,
  OrgOnePagerFacility,
  OrgOnePagerModel,
  OrgOnePagerPage,
  OrgOnePagerTheme,
} from "@/lib/org-one-pager-model";

export type OrgOnePagerProps = {
  model: OrgOnePagerModel;
  page: OrgOnePagerPage;
  resolvedLogoUrl?: string | null;
  resolvedCoverUrl?: string | null;
  resolvedPhotoUrls?: Record<string, string | null>;
  resolvedQrUrl?: string | null;
  hidePlatformMark?: boolean;
};

function payerLine(facility: OrgOnePagerFacility): string[] {
  if (facility.payerOverflow > 0) {
    return [...facility.payers, `+${facility.payerOverflow} more`];
  }
  return facility.payers;
}

function Letterhead({
  model,
  page,
  logoUrl,
}: {
  model: OrgOnePagerModel;
  page: OrgOnePagerPage;
  logoUrl: string | null;
}) {
  const { theme, contact } = model;
  const contactBits = [contact.name, contact.phone, contact.email].filter(Boolean);
  return (
    <header
      style={{
        flexShrink: 0,
        height: 76,
        boxSizing: "border-box",
        padding: "12px 36px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: `3px solid ${theme.brand}`,
      }}
    >
      <LogoMark logoUrl={logoUrl} name={model.orgName} brand={theme.brand} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={wireHeading({
            fontSize: model.orgName.length > 34 ? 18 : 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: WIRE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {model.orgName}
        </h1>
        <p style={wireBody({ marginTop: 3, fontSize: 11, fontWeight: 500, color: WIRE.muted })}>
          {model.locationContext || `${model.facilityCount} locations`}
          {"  ·  "}
          In-network by location
        </p>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", maxWidth: 240 }}>
        {contactBits.length ? (
          <p style={wireBody({ fontSize: 11, fontWeight: 600, color: WIRE.ink })}>
            {contactBits.join("  ·  ")}
          </p>
        ) : null}
        <p style={wireHeading({ marginTop: 3, fontSize: 10, fontWeight: 700, color: theme.brand })}>
          {page.pageNumber} / {page.pageCount}
        </p>
      </div>
    </header>
  );
}

function ContactBlock({ contact, theme }: { contact: OrgOnePagerContact; theme: OrgOnePagerTheme }) {
  const lines = [contact.name, contact.title, contact.phone, contact.email, contact.website].filter(Boolean);
  if (!lines.length) return null;
  return (
    <div>
      <SectionLabel color={theme.brand}>Referrals</SectionLabel>
      <p style={wireHeading({ marginTop: 6, fontSize: 16, fontWeight: 800, color: WIRE.ink })}>
        {contact.name || "Business development"}
      </p>
      <p style={wireBody({ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: WIRE.ink })}>
        {lines.filter((line) => line !== contact.name).join("  ·  ")}
      </p>
    </div>
  );
}

function FacilityRow({
  facility,
  theme,
  density,
  photoUrl,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
  density: OrgOnePagerModel["density"];
  photoUrl: string | null;
}) {
  const payers = payerLine(facility);
  const generous = density === "generous";
  const photoH = generous ? 112 : 0;

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: generous ? "112px minmax(0, 1fr)" : "minmax(0, 1fr)",
        gap: generous ? 14 : 6,
        minHeight: 0,
        padding: generous ? "10px 0" : "8px 0",
        borderBottom: `1px solid ${theme.rule}`,
        boxSizing: "border-box",
      }}
    >
      {generous ? (
        <PhotoSlot src={photoUrl} brand={theme.brand} height={photoH} />
      ) : null}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: density === "directory" ? "1.4fr 0.9fr 0.9fr" : "minmax(0, 1fr) auto",
            gap: 8,
            alignItems: "baseline",
          }}
        >
          <h2
            style={wireHeading({
              fontSize: generous ? 16 : 13,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: WIRE.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {facility.name}
          </h2>
          <p
            style={wireBody({
              fontSize: 11,
              fontWeight: 500,
              color: WIRE.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {facility.cityState || facility.address || "—"}
          </p>
          {density === "directory" ? (
            <p
              style={wireBody({
                fontSize: 11,
                fontWeight: 600,
                color: theme.brand,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
              })}
            >
              {facility.levels.join(" · ") || "—"}
            </p>
          ) : null}
        </div>
        {generous && facility.levels.length ? (
          <p style={wireBody({ fontSize: 11, fontWeight: 600, color: theme.brand })}>
            {facility.levels.join("  ·  ")}
          </p>
        ) : null}
        {density === "standard" && facility.levels.length ? (
          <p style={wireBody({ fontSize: 11, fontWeight: 600, color: theme.brand })}>
            {facility.levels.join("  ·  ")}
          </p>
        ) : null}
        <div>
          <p
            style={wireHeading({
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: theme.brand,
            })}
          >
            In-network
          </p>
          <FactLine items={payers} />
        </div>
      </div>
    </article>
  );
}

function PageFooter({
  model,
  hidePlatformMark,
}: {
  model: OrgOnePagerModel;
  hidePlatformMark: boolean;
}) {
  return (
    <footer
      style={{
        flexShrink: 0,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: `1px solid ${model.theme.rule}`,
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

export function OrgOnePager({
  model,
  page,
  resolvedLogoUrl,
  resolvedCoverUrl,
  resolvedPhotoUrls = {},
  resolvedQrUrl,
  hidePlatformMark = false,
}: OrgOnePagerProps) {
  const { theme, density, contact } = model;
  const logoUrl = resolvedLogoUrl ?? null;
  const isFirst = page.pageNumber === 1;
  const showOverview = isFirst && page.kind !== "cover" && !!model.overview;
  const photoFor = (facility: OrgOnePagerFacility) => resolvedPhotoUrls[facility.id] ?? null;

  return (
    <article
      data-org-one-pager
      style={{
        width: LETTER_WIDTH_PX,
        height: LETTER_HEIGHT_PX,
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: theme.paper,
        color: WIRE.ink,
        fontFamily: WIRE.fontBody,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Letterhead model={model} page={page} logoUrl={logoUrl} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "14px 36px 10px",
        }}
      >
        {page.kind === "cover" ? (
          <>
            {resolvedCoverUrl ? (
              <div style={{ flexShrink: 0, height: 188, overflow: "hidden" }}>
                <PhotoSlot src={resolvedCoverUrl} brand={theme.brand} height={188} />
              </div>
            ) : null}
            {model.tagline ? (
              <p style={wireHeading({ fontSize: 15, fontWeight: 600, fontStyle: "italic", color: theme.brand })}>
                {model.tagline}
              </p>
            ) : null}
            <p
              style={wireBody({
                fontSize: 13,
                lineHeight: 1.5,
                color: model.overview ? WIRE.ink : WIRE.empty,
              })}
            >
              {model.overview || "—"}
            </p>
            {model.sharedPayers?.length ? (
              <div>
                <SectionLabel color={theme.brand}>Same in-network panel at every location</SectionLabel>
                <FactLine
                  items={
                    model.sharedPayerOverflow > 0
                      ? [...model.sharedPayers, `+${model.sharedPayerOverflow} more`]
                      : model.sharedPayers
                  }
                />
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: resolvedQrUrl ? "1fr 88px" : "1fr", gap: 16 }}>
              <ContactBlock contact={contact} theme={theme} />
              {resolvedQrUrl ? (
                <div style={{ width: 72, height: 72 }}>
                  <PhotoSlot src={resolvedQrUrl} brand={theme.brand} height={72} fit="contain" />
                </div>
              ) : null}
            </div>
            {page.facilities.length === 0 && page.kind === "cover" && model.facilityCount === 0 ? (
              <p style={wireBody({ marginTop: "auto", fontSize: 12, fontWeight: 600, color: theme.brand })}>
                Facility details are published on the live profile.
              </p>
            ) : model.facilityCount > 0 ? (
              <p style={wireBody({ marginTop: "auto", fontSize: 12, fontWeight: 600, color: theme.brand })}>
                {model.facilityCount} {model.facilityCount === 1 ? "location" : "locations"} with in-network
                contracts continue on the following pages.
              </p>
            ) : null}
          </>
        ) : (
          <>
            {isFirst && model.tagline ? (
              <p style={wireHeading({ fontSize: 13, fontWeight: 600, fontStyle: "italic", color: theme.brand })}>
                {model.tagline}
              </p>
            ) : null}
            {isFirst && showOverview && model.overview ? (
              <p style={wireBody({ fontSize: 12.5, lineHeight: 1.45, color: WIRE.ink })}>{model.overview}</p>
            ) : null}
            {isFirst && model.sharedPayers?.length ? (
              <p style={wireBody({ fontSize: 11, fontWeight: 600, color: theme.brand })}>
                Same in-network panel at every location
              </p>
            ) : null}
            {density === "directory" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.9fr 0.9fr",
                  gap: 8,
                  paddingBottom: 6,
                  borderBottom: `2px solid ${theme.brand}`,
                }}
              >
                <SectionLabel color={theme.brand}>Facility</SectionLabel>
                <SectionLabel color={theme.brand}>Location</SectionLabel>
                <SectionLabel color={theme.brand}>Levels of care</SectionLabel>
              </div>
            ) : null}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {page.facilities.map((facility) => (
                <div key={facility.id} style={{ flex: density === "directory" ? "0 0 auto" : 1 }}>
                  <FacilityRow
                    facility={facility}
                    theme={theme}
                    density={density}
                    photoUrl={photoFor(facility)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <PageFooter model={model} hidePlatformMark={hidePlatformMark} />
    </article>
  );
}
