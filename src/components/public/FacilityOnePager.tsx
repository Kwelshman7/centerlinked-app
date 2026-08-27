import { uniqueAccreditations } from "@/lib/accreditations";
import { contrastingTextColor } from "@/lib/color-contrast";
import { categorizeFacilityTags } from "@/lib/facility-program-tags";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { parseBrandColor } from "@/lib/public-urls";
import { WIRE } from "@/lib/one-pager-wire";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import {
  LogoMark,
  PhotoSlot,
  WireBlock,
  WireColumn,
  WireFooter,
  wireBody,
  wireHeading,
} from "@/components/public/one-pager/OnePagerPrimitives";

export const ONE_PAGER_WIDTH = WIRE.pageW;
export const ONE_PAGER_HEIGHT = WIRE.pageH;

export type FacilityOnePagerProps = {
  facility: FacilitySheetData;
  org: SheetOrg | null;
  contracts: SheetContract[];
  brandColor?: string;
  resolvedLogoUrl?: string | null;
  resolvedHeroUrl?: string | null;
  resolvedGalleryUrls?: string[];
  hidePlatformMark?: boolean;
  polishedDescription?: string | null;
  createdAt?: Date;
};

export function FacilityOnePager({
  facility,
  org,
  contracts,
  brandColor,
  resolvedLogoUrl,
  resolvedHeroUrl,
  resolvedGalleryUrls = [],
  hidePlatformMark = false,
  polishedDescription,
}: FacilityOnePagerProps) {
  const brand = parseBrandColor(brandColor ?? org?.brand_color);
  const onBrand = contrastingTextColor(brand);

  const logoUrl = resolvedLogoUrl ?? null;
  const heroUrl = resolvedHeroUrl ?? null;
  const gallery = [0, 1, 2].map((i) => resolvedGalleryUrls[i] ?? null);

  const cityStateZip = [[facility.city, facility.state].filter(Boolean).join(", "), facility.zip]
    .filter(Boolean)
    .join(" ");
  const locationLine = [facility.address_line1, cityStateZip].filter(Boolean).join("  ·  ");

  const tagline = facility.tagline?.trim() || org?.tagline?.trim() || null;
  const summary =
    polishedDescription?.trim() ||
    facility.short_description?.trim() ||
    facility.description?.trim() ||
    null;

  const levels = (facility.levels_of_care ?? []).filter(Boolean).slice(0, 8);
  const inNetwork = contracts.filter((c) => c.in_network);
  const payers = inNetwork.slice(0, 10).map((c) => c.payer_name).filter(Boolean);
  const payerOverflow = Math.max(0, inNetwork.length - 10);
  const payerItems = payerOverflow > 0 ? [...payers, `+${payerOverflow} more`] : payers;

  const programTags = categorizeFacilityTags(facility);
  const conditions = programTags.conditions.slice(0, 8);
  const whoWeTreat = programTags.whoWeTreat.slice(0, 8);
  const therapies = programTags.therapies.slice(0, 10);
  const amenities = programTags.amenities.slice(0, 10);
  const accreditations = uniqueAccreditations(facility.accreditations).slice(0, 6);

  const facilityHasOwnBd = !!(
    facility.bd_contact_name?.trim() &&
    (facility.bd_contact_phone?.trim() || facility.bd_contact_email?.trim())
  );
  const repName = facility.bd_contact_name || org?.bd_contact_name || null;
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email || org?.bd_contact_email || null;
  const website = facility.website?.trim() || org?.website?.trim() || null;
  const displayPhone = formatPhoneDisplay(repPhone);
  const hasPhone = !!sanitizePhone(repPhone);
  const hasBd = !!(repName?.trim() || hasPhone || repEmail?.trim() || website);
  const repTitle = facilityHasOwnBd
    ? "Business Development"
    : org?.bd_contact_name
      ? "Organization Business Development"
      : "Referral contact";

  const displayName = org?.name || facility.name;
  const webHost = website ? website.replace(/^https?:\/\//i, "").replace(/\/$/, "") : null;

  return (
    <article
      data-facility-one-pager
      style={{
        width: WIRE.pageW,
        height: WIRE.pageH,
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: WIRE.paper,
        color: WIRE.ink,
        fontFamily: WIRE.fontBody,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          height: WIRE.mastheadH,
          boxSizing: "border-box",
          padding: `14px ${WIRE.padX}px`,
          display: "flex",
          alignItems: "center",
          gap: 18,
          borderBottom: `1px solid ${WIRE.rule}`,
        }}
      >
        <LogoMark logoUrl={logoUrl} name={displayName} brand={brand} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={wireHeading({
              fontSize: facility.name.length > 36 ? 20 : 24,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: WIRE.ink,
            })}
          >
            {facility.name}
          </h1>
          <p
            style={wireBody({
              marginTop: 4,
              fontSize: 11.5,
              color: WIRE.muted,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {org?.name ? <span style={{ fontWeight: 700, color: brand }}>{org.name}</span> : null}
            {org?.name && locationLine ? "  ·  " : null}
            {locationLine || null}
          </p>
        </div>
        <div
          style={{
            flexShrink: 0,
            width: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 3,
            textAlign: "right",
          }}
        >
          {hasBd ? (
            <>
              <p style={wireHeading({ fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.02em", color: WIRE.ink })}>
                {repName?.trim() || displayName}
              </p>
              <p
                style={wireBody({
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: brand,
                })}
              >
                {repTitle}
              </p>
              {displayPhone ? (
                <p style={wireBody({ fontSize: 11, fontWeight: 600, color: WIRE.ink })}>{displayPhone}</p>
              ) : null}
              {repEmail?.trim() ? (
                <p
                  style={wireBody({
                    fontSize: 11,
                    fontWeight: 600,
                    color: WIRE.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  })}
                >
                  {repEmail.trim()}
                </p>
              ) : null}
              {webHost ? (
                <p style={wireBody({ fontSize: 11, fontWeight: 600, color: WIRE.ink })}>{webHost}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      <div
        style={{
          position: "relative",
          flexShrink: 0,
          height: WIRE.heroH,
          overflow: "hidden",
          background: brand,
        }}
      >
        <PhotoSlot src={heroUrl} brand={brand} height="100%" />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: heroUrl
              ? "linear-gradient(180deg, rgba(8,16,32,0.04) 42%, rgba(8,16,32,0.58) 100%)"
              : "transparent",
          }}
        />
        {tagline ? (
          <p
            style={wireHeading({
              position: "absolute",
              left: WIRE.padX,
              right: WIRE.padX,
              bottom: 16,
              fontSize: 16,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              color: onBrand,
            })}
          >
            {tagline}
          </p>
        ) : null}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: `14px ${WIRE.padX}px 10px`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            flexShrink: 0,
            height: WIRE.galleryH,
          }}
        >
          {gallery.map((src, i) => (
            <PhotoSlot key={i} src={src} brand={brand} height={WIRE.galleryH} />
          ))}
        </div>

        <div
          style={{
            flexShrink: 0,
            height: WIRE.copyH,
            overflow: "hidden",
          }}
        >
          <p
            style={wireBody({
              fontSize: 13,
              lineHeight: 1.5,
              color: summary ? WIRE.ink : WIRE.empty,
            })}
          >
            {summary || "—"}
          </p>
        </div>

        <section
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: WIRE.gutter,
            paddingTop: 2,
          }}
        >
          <WireColumn brand={brand}>
            <WireBlock title="Levels of care" brand={brand} items={levels} />
            <WireBlock title="Who we treat" brand={brand} items={whoWeTreat} />
            <WireBlock title="Conditions we treat" brand={brand} items={conditions} />
          </WireColumn>
          <WireColumn brand={brand}>
            <WireBlock title="Therapies" brand={brand} items={therapies} />
            <WireBlock title="Amenities" brand={brand} items={amenities} />
          </WireColumn>
          <WireColumn brand={brand}>
            <WireBlock title="In-network insurance" brand={brand} items={payerItems} />
            <WireBlock title="Accreditations" brand={brand} items={accreditations} />
          </WireColumn>
        </section>
      </div>

      <WireFooter hidePlatformMark={hidePlatformMark} />
    </article>
  );
}
