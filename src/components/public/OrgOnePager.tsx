import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/lib/export-one-pager-capture";
import { WIRE } from "@/lib/one-pager-wire";
import {
  InsurancePanel,
  LogoMark,
  PhotoCaption,
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

function payerItems(facility: OrgOnePagerFacility): string[] {
  return facility.payerOverflow > 0
    ? [...facility.payers, `+${facility.payerOverflow} more`]
    : facility.payers;
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
  return (
    <header style={{ flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 36px 14px",
          boxSizing: "border-box",
        }}
      >
        <LogoMark logoUrl={logoUrl} name={model.orgName} brand={theme.brand} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={wireHeading({
              fontSize: model.orgName.length > 32 ? 20 : 24,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: theme.brand,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {model.orgName}
          </h1>
          <p style={wireBody({ marginTop: 3, fontSize: 12, fontWeight: 600, color: WIRE.muted })}>
            {model.locationContext || `${model.facilityCount} locations`}
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right", maxWidth: 230 }}>
          <p
            style={wireHeading({
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: theme.accent === theme.brand ? theme.brand : theme.accent,
            })}
          >
            In-network by location
          </p>
          {contact.phone ? (
            <p style={wireBody({ marginTop: 4, fontSize: 12, fontWeight: 700, color: WIRE.ink })}>
              {contact.phone}
            </p>
          ) : null}
          {page.pageCount > 1 ? (
            <p style={wireBody({ marginTop: 4, fontSize: 10, fontWeight: 600, color: WIRE.muted })}>
              {page.pageNumber} / {page.pageCount}
            </p>
          ) : null}
        </div>
      </div>
      <div style={{ background: theme.brand, padding: "9px 36px" }}>
        <p
          style={wireHeading({
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: (model.tagline?.length ?? 0) > 48 ? "-0.01em" : "0.08em",
            textTransform: (model.tagline?.length ?? 0) > 48 ? "none" : "uppercase",
            color: theme.onBrand,
            lineHeight: 1.35,
          })}
        >
          {model.tagline || "A trusted partner in behavioral health"}
        </p>
      </div>
    </header>
  );
}

function ContactBar({
  contact,
  theme,
  profileLabel,
  hidePlatformMark,
}: {
  contact: OrgOnePagerContact;
  theme: OrgOnePagerTheme;
  profileLabel: string | null;
  hidePlatformMark: boolean;
}) {
  const line = [contact.name, contact.phone, contact.email].filter(Boolean).join("  ·  ");
  return (
    <footer style={{ flexShrink: 0 }}>
      <p
        style={wireBody({
          padding: "8px 36px 10px",
          fontSize: 11,
          lineHeight: 1.45,
          color: WIRE.muted,
          textAlign: "center",
        })}
      >
        Not seeing a plan listed? Benefits can be verified with the referral contact below.
        {profileLabel ? ` Live profile · ${profileLabel}` : ""}
        {hidePlatformMark ? "" : "  ·  centerlinked.com"}
      </p>
      <div style={{ background: theme.brand, padding: "12px 36px" }}>
        <p
          style={wireHeading({
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: theme.accent !== theme.brand ? theme.accent : theme.onBrand,
            textAlign: "center",
          })}
        >
          {line || "Referral contact is on the live organization profile"}
        </p>
      </div>
    </footer>
  );
}

function ShowcaseRow({
  facility,
  theme,
  photoUrl,
  photoHeight,
  altHeader,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
  photoUrl: string | null;
  photoHeight: number;
  altHeader: boolean;
}) {
  const headerBg = altHeader && theme.accent !== theme.brand ? theme.accent : theme.brand;
  const headerFg = altHeader && theme.accent !== theme.brand ? theme.onAccent : theme.onBrand;
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        gap: 14,
        minHeight: 0,
      }}
    >
      <PhotoCaption
        src={photoUrl}
        brand={theme.brand}
        onBrand={theme.onBrand}
        height={photoHeight}
        title={facility.cityState || facility.name}
        subtitle={facility.levels.join("  ·  ") || null}
      />
      <InsurancePanel
        title="Insurances we accept"
        items={payerItems(facility)}
        overflow={facility.payerOverflow}
        headerBg={headerBg}
        headerFg={headerFg}
        rule={theme.rule}
      />
    </article>
  );
}

function CompactRow({
  facility,
  theme,
  photoUrl,
  altHeader,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
  photoUrl: string | null;
  altHeader: boolean;
}) {
  const headerBg = altHeader && theme.accent !== theme.brand ? theme.accent : theme.brand;
  const headerFg = altHeader && theme.accent !== theme.brand ? theme.onAccent : theme.onBrand;
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: 12,
        minHeight: 0,
      }}
    >
      <div>
        <PhotoCaption
          src={photoUrl}
          brand={theme.brand}
          onBrand={theme.onBrand}
          height={118}
          title={facility.cityState || facility.name}
          subtitle={facility.levels.join("  ·  ") || null}
        />
        <p
          style={wireHeading({
            marginTop: 6,
            fontSize: 12,
            fontWeight: 800,
            color: WIRE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {facility.name}
        </p>
      </div>
      <InsurancePanel
        title="Insurances we accept"
        items={payerItems(facility)}
        overflow={facility.payerOverflow}
        headerBg={headerBg}
        headerFg={headerFg}
        rule={theme.rule}
      />
    </article>
  );
}

function DirectoryRow({
  facility,
  theme,
}: {
  facility: OrgOnePagerFacility;
  theme: OrgOnePagerTheme;
}) {
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "1.3fr 0.9fr 1.6fr",
        gap: 12,
        padding: "9px 0",
        borderBottom: `1px solid ${theme.rule}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={wireHeading({
            fontSize: 12.5,
            fontWeight: 800,
            color: WIRE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {facility.name}
        </p>
        <p style={wireBody({ marginTop: 2, fontSize: 11, color: WIRE.muted })}>
          {facility.cityState || facility.address || "—"}
        </p>
      </div>
      <p style={wireBody({ fontSize: 11.5, fontWeight: 600, color: theme.brand })}>
        {facility.levels.join(" · ") || "—"}
      </p>
      <p
        style={wireBody({
          fontSize: 11,
          lineHeight: 1.4,
          color: WIRE.ink,
          overflow: "hidden",
        })}
      >
        {payerItems(facility).join("  ·  ") || "See live profile"}
      </p>
    </article>
  );
}

export function OrgOnePager({
  model,
  page,
  resolvedLogoUrl,
  resolvedCoverUrl,
  resolvedPhotoUrls = {},
  hidePlatformMark = false,
}: OrgOnePagerProps) {
  const { theme, density, contact } = model;
  const logoUrl = resolvedLogoUrl ?? null;
  const photoFor = (facility: OrgOnePagerFacility) => resolvedPhotoUrls[facility.id] ?? null;
  const showcaseHeight = page.facilities.length <= 1 ? 320 : page.facilities.length === 2 ? 248 : 198;

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
          gap: density === "generous" ? 14 : 10,
          padding: "16px 36px 8px",
        }}
      >
        {page.kind === "cover" ? (
          <>
            {resolvedCoverUrl ? (
              <PhotoCaption
                src={resolvedCoverUrl}
                brand={theme.brand}
                onBrand={theme.onBrand}
                height={220}
                title={model.orgName}
                subtitle={model.locationContext}
              />
            ) : null}
            {model.overview ? (
              <p style={wireBody({ fontSize: 13, lineHeight: 1.5, color: WIRE.ink })}>{model.overview}</p>
            ) : null}
            {model.sharedPayers?.length ? (
              <InsurancePanel
                title="Insurances we accept"
                items={
                  model.sharedPayerOverflow > 0
                    ? [...model.sharedPayers, `+${model.sharedPayerOverflow} more`]
                    : model.sharedPayers
                }
                overflow={model.sharedPayerOverflow}
                headerBg={theme.brand}
                headerFg={theme.onBrand}
                rule={theme.rule}
              />
            ) : null}
          </>
        ) : density === "generous" ? (
          page.facilities.map((facility, index) => (
            <ShowcaseRow
              key={facility.id}
              facility={facility}
              theme={theme}
              photoUrl={photoFor(facility)}
              photoHeight={showcaseHeight}
              altHeader={index % 2 === 1}
            />
          ))
        ) : density === "standard" ? (
          page.facilities.map((facility, index) => (
            <CompactRow
              key={facility.id}
              facility={facility}
              theme={theme}
              photoUrl={photoFor(facility)}
              altHeader={index % 2 === 1}
            />
          ))
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 0.9fr 1.6fr",
                gap: 12,
                padding: "8px 10px",
                background: theme.brand,
              }}
            >
              {["Facility", "Levels of care", "In-network insurance"].map((label) => (
                <p
                  key={label}
                  style={wireHeading({
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: theme.onBrand,
                  })}
                >
                  {label}
                </p>
              ))}
            </div>
            {page.facilities.map((facility) => (
              <DirectoryRow key={facility.id} facility={facility} theme={theme} />
            ))}
          </>
        )}
      </div>

      <ContactBar
        contact={contact}
        theme={theme}
        profileLabel={model.profileLabel}
        hidePlatformMark={hidePlatformMark}
      />
    </article>
  );
}
