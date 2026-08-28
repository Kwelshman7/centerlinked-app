import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/lib/export-one-pager-capture";
import { WIRE, brandRgba } from "@/lib/one-pager-wire";
import {
  FactLine,
  LevelPills,
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
  const contactBits = [contact.name, contact.phone].filter(Boolean);
  return (
    <header
      style={{
        flexShrink: 0,
        height: 84,
        boxSizing: "border-box",
        padding: "14px 40px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: theme.paper,
        borderBottom: `1px solid ${theme.rule}`,
        boxShadow: `inset 0 -3px 0 ${theme.brand}`,
      }}
    >
      <LogoMark logoUrl={logoUrl} name={model.orgName} brand={theme.brand} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={wireHeading({
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: theme.brand,
          })}
        >
          Referral overview
        </p>
        <h1
          style={wireHeading({
            marginTop: 3,
            fontSize: model.orgName.length > 34 ? 17 : 21,
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
      <div style={{ flexShrink: 0, textAlign: "right", maxWidth: 220 }}>
        {contactBits.length ? (
          <p style={wireBody({ fontSize: 11, fontWeight: 600, color: WIRE.ink })}>
            {contactBits.join("  ·  ")}
          </p>
        ) : null}
        <p style={wireHeading({ marginTop: 4, fontSize: 10, fontWeight: 700, color: theme.brand })}>
          {page.pageNumber} / {page.pageCount}
        </p>
      </div>
    </header>
  );
}

function ContactBand({
  contact,
  theme,
  qrUrl,
  profileLabel,
}: {
  contact: OrgOnePagerContact;
  theme: OrgOnePagerTheme;
  qrUrl: string | null;
  profileLabel: string | null;
}) {
  const detail = [contact.title, contact.phone, contact.email, contact.website].filter(Boolean);
  return (
    <div
      style={{
        flexShrink: 0,
        marginTop: "auto",
        display: "grid",
        gridTemplateColumns: qrUrl ? "1fr 92px" : "1fr",
        gap: 16,
        alignItems: "center",
        padding: "14px 16px",
        borderRadius: 10,
        background: brandRgba(theme.brand, 0.06),
        border: `1px solid ${brandRgba(theme.brand, 0.14)}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <SectionLabel color={theme.brand}>Referrals</SectionLabel>
        <p style={wireHeading({ marginTop: 5, fontSize: 15, fontWeight: 800, color: WIRE.ink })}>
          {contact.name || "Business development"}
        </p>
        {detail.length ? (
          <p style={wireBody({ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: WIRE.ink })}>
            {detail.join("  ·  ")}
          </p>
        ) : null}
        {profileLabel ? (
          <p style={wireBody({ marginTop: 4, fontSize: 10.5, fontWeight: 600, color: theme.brand })}>
            Live profile · {profileLabel}
          </p>
        ) : null}
      </div>
      {qrUrl ? (
        <div
          style={{
            width: 84,
            height: 84,
            padding: 6,
            borderRadius: 8,
            background: "#fff",
            border: `1px solid ${theme.rule}`,
            boxSizing: "border-box",
          }}
        >
          <PhotoSlot src={qrUrl} brand={theme.brand} height={70} fit="contain" />
        </div>
      ) : null}
    </div>
  );
}

function ShowcaseFacilityCard({
  facility,
  theme,
  photoUrl,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
  photoUrl: string | null;
}) {
  const payers = payerLine(facility);
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "148px minmax(0, 1fr)",
        gap: 16,
        minHeight: 0,
        padding: "12px 0",
        borderBottom: `1px solid ${theme.rule}`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${theme.rule}`,
        }}
      >
        <PhotoSlot src={photoUrl} brand={theme.brand} height={118} />
      </div>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 5, justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
          <h2
            style={wireHeading({
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: WIRE.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            })}
          >
            {facility.name}
          </h2>
          <p
            style={wireBody({
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              color: WIRE.muted,
            })}
          >
            {facility.cityState || facility.address || "—"}
          </p>
        </div>
        {facility.tagline ? (
          <p style={wireBody({ fontSize: 11.5, fontStyle: "italic", color: theme.brand })}>
            {facility.tagline}
          </p>
        ) : null}
        <LevelPills items={facility.levels} brand={theme.brand} />
        {facility.summary ? (
          <p
            style={wireBody({
              fontSize: 11,
              lineHeight: 1.4,
              color: WIRE.muted,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            })}
          >
            {facility.summary}
          </p>
        ) : null}
        <div style={{ marginTop: 2 }}>
          <SectionLabel color={theme.brand}>In-network</SectionLabel>
          <FactLine items={payers} />
        </div>
      </div>
    </article>
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
  if (density === "generous") {
    return <ShowcaseFacilityCard facility={facility} theme={theme} photoUrl={photoUrl} />;
  }

  const payers = payerLine(facility);

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 6,
        minHeight: 0,
        padding: "8px 0",
        borderBottom: `1px solid ${theme.rule}`,
        boxSizing: "border-box",
      }}
    >
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
              fontSize: 13,
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
        {density === "standard" && facility.levels.length ? (
          <LevelPills items={facility.levels} brand={theme.brand} />
        ) : null}
        <div>
          <SectionLabel color={theme.brand}>In-network</SectionLabel>
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
        height: 26,
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
  const showOverview = isFirst && !!model.overview;
  const showCoverHero = isFirst && !!resolvedCoverUrl;
  const showContactBand = isFirst && (page.kind === "cover" || density === "generous");
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
          gap: density === "generous" ? 10 : 12,
          padding: "14px 40px 12px",
        }}
      >
        {page.kind === "cover" ? (
          <>
            {resolvedCoverUrl ? (
              <div
                style={{
                  flexShrink: 0,
                  height: 188,
                  overflow: "hidden",
                  borderRadius: 12,
                  border: `1px solid ${theme.rule}`,
                }}
              >
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
            <ContactBand
              contact={contact}
              theme={theme}
              qrUrl={resolvedQrUrl ?? null}
              profileLabel={model.profileLabel}
            />
            {model.facilityCount > 0 ? (
              <p style={wireBody({ marginTop: 4, fontSize: 12, fontWeight: 600, color: theme.brand })}>
                {model.facilityCount} {model.facilityCount === 1 ? "location" : "locations"} with in-network
                contracts continue on the following pages.
              </p>
            ) : (
              <p style={wireBody({ marginTop: 4, fontSize: 12, fontWeight: 600, color: theme.brand })}>
                Facility details are published on the live profile.
              </p>
            )}
          </>
        ) : (
          <>
            {showCoverHero ? (
              <div
                style={{
                  flexShrink: 0,
                  height: density === "generous" ? 132 : 160,
                  overflow: "hidden",
                  borderRadius: 12,
                  border: `1px solid ${theme.rule}`,
                }}
              >
                <PhotoSlot
                  src={resolvedCoverUrl ?? null}
                  brand={theme.brand}
                  height={density === "generous" ? 132 : 160}
                />
              </div>
            ) : null}
            {isFirst && model.tagline ? (
              <p style={wireHeading({ fontSize: 13, fontWeight: 600, fontStyle: "italic", color: theme.brand })}>
                {model.tagline}
              </p>
            ) : null}
            {showOverview ? (
              <p style={wireBody({ fontSize: 12.5, lineHeight: 1.45, color: WIRE.ink })}>{model.overview}</p>
            ) : null}
            {isFirst && model.sharedPayers?.length ? (
              <p style={wireBody({ fontSize: 11, fontWeight: 600, color: theme.brand })}>
                Same in-network panel at every location
              </p>
            ) : null}
            {density !== "directory" ? (
              <SectionLabel color={theme.brand}>
                {density === "generous" ? "Locations" : "Facilities"}
              </SectionLabel>
            ) : (
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
            )}
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
            {showContactBand ? (
              <ContactBand
                contact={contact}
                theme={theme}
                qrUrl={resolvedQrUrl ?? null}
                profileLabel={model.profileLabel}
              />
            ) : null}
          </>
        )}
      </div>

      <PageFooter model={model} hidePlatformMark={hidePlatformMark} />
    </article>
  );
}
