import type { ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import { contrastingTextColor } from "@/lib/color-contrast";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { uniqueAccreditations } from "@/lib/accreditations";
import { categorizeFacilityTags } from "@/lib/facility-program-tags";
import { parseBrandColor } from "@/lib/public-urls";
import { photoFillStyle } from "@/lib/export-one-pager-capture";
import { WIRE } from "@/lib/one-pager-wire";
import {
  FactLine,
  LogoMark,
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

function ContactLine({
  icon: Icon,
  children,
}: {
  icon: typeof Phone;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, justifyContent: "flex-end" }}>
      <Icon style={{ width: 11, height: 11, color: WIRE.muted, flexShrink: 0 }} aria-hidden />
      <span
        style={wireBody({
          fontSize: 11,
          fontWeight: 600,
          color: WIRE.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        })}
      >
        {children}
      </span>
    </div>
  );
}

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
  const gallery = resolvedGalleryUrls.filter(Boolean).slice(0, 3);

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

  const careBlocks: ReactNode[] = [];
  if (levels.length) {
    careBlocks.push(
      <WireBlock key="levels" title="Levels of care" brand={brand}>
        <FactLine items={levels} />
      </WireBlock>,
    );
  }
  if (whoWeTreat.length) {
    careBlocks.push(
      <WireBlock key="who" title="Who we treat" brand={brand}>
        <FactLine items={whoWeTreat} />
      </WireBlock>,
    );
  }
  if (conditions.length) {
    careBlocks.push(
      <WireBlock key="conditions" title="Conditions we treat" brand={brand}>
        <FactLine items={conditions} />
      </WireBlock>,
    );
  }

  const programBlocks: ReactNode[] = [];
  if (therapies.length) {
    programBlocks.push(
      <WireBlock key="therapies" title="Therapies" brand={brand}>
        <FactLine items={therapies} />
      </WireBlock>,
    );
  }
  if (amenities.length) {
    programBlocks.push(
      <WireBlock key="amenities" title="Amenities" brand={brand}>
        <FactLine items={amenities} />
      </WireBlock>,
    );
  }

  const networkBlocks: ReactNode[] = [];
  if (payers.length) {
    const names = payerOverflow > 0 ? [...payers, `+${payerOverflow} more`] : payers;
    networkBlocks.push(
      <WireBlock key="insurance" title="In-network insurance" brand={brand}>
        <FactLine items={names} />
      </WireBlock>,
    );
  }
  if (accreditations.length) {
    networkBlocks.push(
      <WireBlock key="accreditations" title="Accreditations" brand={brand}>
        <FactLine items={accreditations} />
      </WireBlock>,
    );
  }

  const columns = [careBlocks, programBlocks, networkBlocks].filter((blocks) => blocks.length > 0);

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
          padding: `16px ${WIRE.padX}px 14px`,
          display: "flex",
          alignItems: "center",
          gap: 20,
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
          <div
            style={wireBody({
              marginTop: 4,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "4px 10px",
              fontSize: 11.5,
              color: WIRE.muted,
              fontWeight: 500,
            })}
          >
            {org?.name ? <span style={{ fontWeight: 700, color: brand }}>{org.name}</span> : null}
            {locationLine ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin style={{ width: 11, height: 11 }} aria-hidden />
                {locationLine}
              </span>
            ) : null}
          </div>
        </div>
        {hasBd ? (
          <div
            style={{
              flexShrink: 0,
              width: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              textAlign: "right",
            }}
          >
            <p style={wireHeading({ fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.02em", color: WIRE.ink })}>
              {repName?.trim() || displayName}
            </p>
            <p style={wireBody({ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: brand })}>
              {repTitle}
            </p>
            {displayPhone ? <ContactLine icon={Phone}>{displayPhone}</ContactLine> : null}
            {repEmail?.trim() ? <ContactLine icon={Mail}>{repEmail.trim()}</ContactLine> : null}
            {website ? (
              <ContactLine icon={Globe}>{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</ContactLine>
            ) : null}
          </div>
        ) : null}
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
        {heroUrl ? (
          <div aria-hidden style={photoFillStyle(heroUrl, "cover", { position: "absolute", inset: 0 })} />
        ) : null}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: heroUrl
              ? "linear-gradient(180deg, rgba(8,16,32,0.05) 40%, rgba(8,16,32,0.62) 100%)"
              : `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)`,
          }}
        />
        {tagline ? (
          <p
            style={wireHeading({
              position: "absolute",
              left: WIRE.padX,
              right: WIRE.padX,
              bottom: 18,
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
          gap: 16,
          padding: `16px ${WIRE.padX}px 12px`,
        }}
      >
        {gallery.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gallery.length}, minmax(0, 1fr))`,
              gap: 8,
              flexShrink: 0,
              height: WIRE.galleryH,
            }}
          >
            {gallery.map((src, i) => (
              <div
                key={`${i}`}
                style={photoFillStyle(src, "cover", {
                  height: WIRE.galleryH,
                })}
              />
            ))}
          </div>
        ) : null}

        {summary ? (
          <p
            style={wireBody({
              fontSize: 13,
              lineHeight: 1.55,
              color: WIRE.ink,
              maxWidth: "100%",
            })}
          >
            {summary}
          </p>
        ) : null}

        {columns.length > 0 ? (
          <section
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              gap: WIRE.gutter,
              paddingTop: 4,
            }}
          >
            {columns.map((blocks, index) => (
              <WireColumn key={index} brand={brand}>
                {blocks}
              </WireColumn>
            ))}
          </section>
        ) : null}
      </div>

      <WireFooter hidePlatformMark={hidePlatformMark} />
    </article>
  );
}
