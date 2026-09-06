import { uniqueAccreditations } from "@/lib/accreditations";
import { contrastingTextColor } from "@/lib/color-contrast";
import { categorizeFacilityTags } from "@/lib/facility-program-tags";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { DEFAULT_ACCENT, parseAccentColor, parseBrandColor } from "@/lib/public-urls";
import { WIRE } from "@/lib/one-pager-wire";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import {
  InsurancePanel,
  LogoMark,
  PhotoCaption,
  PhotoSlot,
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

function printAccent(brand: string, accentColor?: string | null): string {
  if (!accentColor?.trim()) return brand;
  const accent = parseAccentColor(accentColor);
  if (accent.toLowerCase() === DEFAULT_ACCENT.toLowerCase()) return brand;
  return accent;
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
  const accent = printAccent(brand, org?.accent_color);
  const onBrand = contrastingTextColor(brand);
  const onAccent = contrastingTextColor(accent);

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
  const payers = inNetwork.slice(0, 16).map((c) => c.payer_name).filter(Boolean);
  const payerOverflow = Math.max(0, inNetwork.length - 16);

  const programTags = categorizeFacilityTags(facility);
  const conditions = programTags.conditions.slice(0, 8);
  const whoWeTreat = programTags.whoWeTreat.slice(0, 8);
  const therapies = programTags.therapies.slice(0, 8);
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
  const webHost = website ? website.replace(/^https?:\/\//i, "").replace(/\/$/, "") : null;
  const displayName = org?.name || facility.name;
  const contactLine = [repName, displayPhone, repEmail].filter(Boolean).join("  ·  ");

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
      <header style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 36px 14px",
          }}
        >
          <LogoMark logoUrl={logoUrl} name={displayName} brand={brand} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={wireHeading({
                fontSize: facility.name.length > 36 ? 20 : 24,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: brand,
              })}
            >
              {facility.name}
            </h1>
            <p style={wireBody({ marginTop: 4, fontSize: 12, fontWeight: 600, color: WIRE.muted })}>
              {org?.name && org.name !== facility.name ? `${org.name}  ·  ` : null}
              {locationLine || null}
            </p>
          </div>
          {hasPhone || webHost ? (
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              {displayPhone ? (
                <p style={wireBody({ fontSize: 13, fontWeight: 800, color: WIRE.ink })}>{displayPhone}</p>
              ) : null}
              {webHost ? (
                <p style={wireBody({ marginTop: 3, fontSize: 11, fontWeight: 600, color: WIRE.muted })}>
                  {webHost}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div style={{ background: brand, padding: "8px 36px" }}>
          <p
            style={wireHeading({
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: onBrand,
            })}
          >
            {tagline || "Referral profile for partners"}
          </p>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "16px 36px 10px",
        }}
      >
        <PhotoCaption
          src={heroUrl}
          brand={brand}
          onBrand={onBrand}
          height={gallery.length ? 248 : 300}
          title={cityStateZip || facility.name}
          subtitle={levels.join("  ·  ") || null}
        />

        {gallery.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gallery.length}, minmax(0, 1fr))`,
              gap: 8,
              height: 92,
              flexShrink: 0,
            }}
          >
            {gallery.map((src) => (
              <div key={src} style={{ overflow: "hidden", height: 92 }}>
                <PhotoSlot src={src} brand={brand} height={92} />
              </div>
            ))}
          </div>
        ) : null}

        {summary ? (
          <p style={wireBody({ fontSize: 13, lineHeight: 1.5, color: WIRE.ink })}>{summary}</p>
        ) : null}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {levels.length ? (
              <div>
                <p
                  style={wireHeading({
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: brand,
                  })}
                >
                  Levels of care
                </p>
                <p style={wireBody({ marginTop: 5, fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, color: WIRE.ink })}>
                  {levels.join("  ·  ")}
                </p>
              </div>
            ) : null}
            {whoWeTreat.length ? (
              <div>
                <p
                  style={wireHeading({
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: brand,
                  })}
                >
                  Who we treat
                </p>
                <p style={wireBody({ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: WIRE.ink })}>
                  {whoWeTreat.join("  ·  ")}
                </p>
              </div>
            ) : null}
            {conditions.length ? (
              <div>
                <p
                  style={wireHeading({
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: brand,
                  })}
                >
                  Clinical focus
                </p>
                <p style={wireBody({ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: WIRE.ink })}>
                  {conditions.join("  ·  ")}
                </p>
              </div>
            ) : null}
            {therapies.length ? (
              <div>
                <p
                  style={wireHeading({
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: brand,
                  })}
                >
                  Therapies
                </p>
                <p style={wireBody({ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: WIRE.ink })}>
                  {therapies.join("  ·  ")}
                </p>
              </div>
            ) : null}
            {accreditations.length ? (
              <div>
                <p
                  style={wireHeading({
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: brand,
                  })}
                >
                  Accreditations
                </p>
                <p style={wireBody({ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: WIRE.ink })}>
                  {accreditations.join("  ·  ")}
                </p>
              </div>
            ) : null}
          </div>

          <InsurancePanel
            title="Insurances we accept"
            items={payers}
            overflow={payerOverflow}
            headerBg={accent !== brand ? accent : brand}
            headerFg={accent !== brand ? onAccent : onBrand}
            rule="#d8dde3"
          />
        </div>
      </div>

      <footer style={{ flexShrink: 0 }}>
        <p
          style={wireBody({
            padding: "8px 36px 10px",
            fontSize: 11,
            color: WIRE.muted,
            textAlign: "center",
          })}
        >
          {facilityHasOwnBd ? "Location business development" : "Organization business development"}
          {hidePlatformMark ? "" : "  ·  centerlinked.com"}
        </p>
        <div style={{ background: brand, padding: "12px 36px" }}>
          <p
            style={wireHeading({
              fontSize: 13,
              fontWeight: 700,
              color: accent !== brand ? accent : onBrand,
              textAlign: "center",
            })}
          >
            {contactLine || "Referral contact is on the live profile"}
          </p>
        </div>
      </footer>
    </article>
  );
}
