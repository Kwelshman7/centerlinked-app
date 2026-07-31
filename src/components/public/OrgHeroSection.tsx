import { ReactNode } from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { ExpandableText } from "@/components/public/ExpandableText";
import { orgHeroImage, orgHeroIsLogoFallback } from "@/lib/org-hero";
import { cn } from "@/lib/utils";

interface OrgHeroOrg {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  hq_city?: string | null;
  hq_state?: string | null;
  cover_image_url?: string | null;
  image_urls?: string[] | null;
  verified: boolean;
}

interface Props {
  org: OrgHeroOrg;
  brand: string;
  /** Short description under the title (desktop heading). */
  description?: string | null;
  /** Facility count for the meta line (desktop heading). */
  facilityCount?: number;
  /** Contact / claim card rendered on the right (desktop only). */
  contactAside?: ReactNode;
  /**
   * Force the compact logo-on-top hero (phone mockups / mobile media strip).
   */
  compact?: boolean;
  /**
   * Logo mark size for the mobile/compact hero.
   * `mock` is intentionally larger — PhoneFrame scales the UI down on the landing page.
   */
  logoSize?: "default" | "mock";
  /**
   * `overlay` — cover image behind heading with dim overlay (shared org page).
   * `media` — cover/logo strip only.
   * `heading` — desktop title + contact band only (no-cover pages).
   * `all` — default/preview behavior.
   */
  parts?: "all" | "media" | "heading" | "overlay";
}

/**
 * Org hero:
 * - Cover overlay: full-bleed image behind the heading, dimmed, bright type.
 * - No cover / compact: logo mark on top.
 * - Desktop without cover: logo tile + title + contact card.
 */
export function OrgHeroSection({
  org,
  brand,
  description,
  facilityCount = 0,
  contactAside,
  compact = false,
  logoSize = "default",
  parts = "all",
}: Props) {
  const coverUrl = org.cover_image_url?.trim() || null;

  if (parts === "overlay" && coverUrl) {
    return (
      <OverlayHero
        org={org}
        brand={brand}
        coverUrl={coverUrl}
        description={description}
        facilityCount={facilityCount}
        contactAside={contactAside}
      />
    );
  }

  // Default: if a cover exists and we're rendering the full hero, use overlay.
  if (parts === "all" && coverUrl && !compact) {
    return (
      <OverlayHero
        org={org}
        brand={brand}
        coverUrl={coverUrl}
        description={description}
        facilityCount={facilityCount}
        contactAside={contactAside}
      />
    );
  }

  const showMedia = parts === "all" || parts === "media";
  const showHeading = !compact && (parts === "all" || parts === "heading");

  return (
    <>
      {showMedia &&
        (coverUrl ? (
          <CoverBanner src={coverUrl} orgName={org.name} compact={compact} />
        ) : (
          <div className={cn(compact || parts === "media" ? "block" : "lg:hidden")}>
            <MobileLogoHero org={org} brand={brand} compact={compact} logoSize={logoSize} />
          </div>
        ))}

      {showHeading && (
        <div className={parts === "heading" ? "block" : "hidden lg:block"}>
          <DesktopHeadingBand
            org={org}
            brand={brand}
            description={description}
            facilityCount={facilityCount}
            contactAside={contactAside}
          />
        </div>
      )}
    </>
  );
}

/** Full-bleed cover with dim overlay and bright heading content on top. */
function OverlayHero({
  org,
  brand,
  coverUrl,
  description,
  facilityCount,
  contactAside,
}: {
  org: OrgHeroOrg;
  brand: string;
  coverUrl: string;
  description?: string | null;
  facilityCount: number;
  contactAside?: ReactNode;
}) {
  const headline = org.name;
  const tagline = org.tagline && org.tagline !== org.name ? org.tagline : null;
  const hq = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const locationMeta = [
    hq || null,
    facilityCount > 0
      ? `${facilityCount} ${facilityCount === 1 ? "location" : "locations"}${hq ? " nationwide" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className="relative w-full overflow-hidden min-h-[260px] sm:min-h-[300px] lg:min-h-[380px]"
      aria-label={`${org.name} profile header`}
    >
      <img
        src={coverUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center scale-[1.02]"
      />
      {/* Dim the photo so bright type reads clearly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/45"
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div
          className={cn(
            "grid items-center gap-6",
            contactAside && "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-x-10",
          )}
        >
          <div className="flex items-start min-w-0 gap-3.5 sm:gap-4">
            <div className="shrink-0 rounded-2xl bg-white shadow-xl overflow-hidden grid place-items-center h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem] ring-1 ring-white/50">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  className="h-[78%] w-[78%] object-contain"
                />
              ) : (
                <div
                  className="h-full w-full grid place-items-center"
                  style={{
                    background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)`,
                  }}
                >
                  <Building2 className="h-7 w-7 text-white/90" aria-hidden />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {org.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}

              <h1 className="font-heading font-extrabold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] leading-[1.12] text-2xl sm:text-3xl lg:text-[2.35rem]">
                {headline}
              </h1>

              {tagline ? (
                <p className="font-semibold text-sm sm:text-base text-white drop-shadow-sm">
                  {tagline}
                </p>
              ) : null}

              {locationMeta ? (
                <p className="text-white/85 font-medium text-sm drop-shadow-sm">{locationMeta}</p>
              ) : null}

              {description ? (
                <ExpandableText
                  text={description}
                  brand="#FFFFFF"
                  clampLines={3}
                  className="max-w-2xl pt-0.5 [&_p]:text-white/90 [&_p]:text-sm sm:[&_p]:text-[0.95rem] [&_p]:drop-shadow-sm"
                />
              ) : null}
            </div>
          </div>

          {contactAside ? (
            <div id="org-contact" className="hidden lg:block min-w-0 self-center">
              {contactAside}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CoverBanner({
  src,
  orgName,
  compact,
}: {
  src: string;
  orgName: string;
  compact: boolean;
}) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        compact ? "h-[168px] min-h-[168px] sm:h-[200px]" : "h-[168px] sm:h-[200px] lg:h-[260px]",
      )}
      aria-label={`${orgName} cover photo`}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-black/25"
      />
    </section>
  );
}

/** Full-bleed logo mark — used on mobile/phone mockups when no cover photo is set. */
function MobileLogoHero({
  org,
  brand,
  compact,
  logoSize,
}: {
  org: OrgHeroOrg;
  brand: string;
  compact: boolean;
  logoSize: "default" | "mock";
}) {
  const heroImage = orgHeroImage(org);
  const logoAsHero = orgHeroIsLogoFallback(org);
  const mock = logoSize === "mock";

  if (logoAsHero && heroImage) {
    return (
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${brand}12 0%, hsl(var(--background)) 55%, ${brand}08 100%)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            mock ? "px-3 py-1" : "px-5 py-1.5",
          )}
        >
          {mock ? (
            <div className="relative h-[7.25rem] w-[90%] overflow-hidden">
              <img
                src={heroImage}
                alt={org.name}
                className="absolute inset-0 h-full w-full object-contain origin-center scale-[1.75] translate-y-[2%]"
              />
            </div>
          ) : (
            <img
              src={heroImage}
              alt={org.name}
              className="h-[4.75rem] w-auto max-w-[90%] object-contain"
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-muted/40">
      <div
        className={cn(
          "relative w-full",
          compact ? "h-[148px] min-h-[148px]" : "min-h-[160px]",
        )}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 45%, hsl(var(--muted)) 100%)`,
            }}
          >
            <Building2 className="h-14 w-14 text-white/80" aria-hidden />
          </div>
        )}
      </div>
    </section>
  );
}

/** Desktop-only professional heading + contact card (no cover photo). */
function DesktopHeadingBand({
  org,
  brand,
  description,
  facilityCount,
  contactAside,
}: {
  org: OrgHeroOrg;
  brand: string;
  description?: string | null;
  facilityCount: number;
  contactAside?: ReactNode;
}) {
  const headline = org.name;
  const tagline = org.tagline && org.tagline !== org.name ? org.tagline : null;
  const hq = [org.hq_city, org.hq_state].filter(Boolean).join(", ");
  const locationMeta = [
    hq || null,
    facilityCount > 0
      ? `${facilityCount} ${facilityCount === 1 ? "location" : "locations"}${hq ? " nationwide" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className="relative w-full pt-6 pb-1"
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 0%, ${brand}14 0%, transparent 70%)`,
      }}
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-x-8">
        <div className="flex items-start min-w-0 gap-4">
          <div className="shrink-0 rounded-2xl border border-border/70 bg-card shadow-md overflow-hidden grid place-items-center h-[5.5rem] w-[5.5rem]">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={`${org.name} logo`}
                className="h-[78%] w-[78%] object-contain"
              />
            ) : (
              <div
                className="h-full w-full grid place-items-center"
                style={{
                  background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)`,
                }}
              >
                <Building2 className="h-7 w-7 text-white/90" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {org.verified && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: brand,
                  backgroundColor: `${brand}12`,
                  borderColor: `${brand}28`,
                }}
              >
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}

            <h1 className="font-heading font-extrabold tracking-tight text-foreground leading-[1.15] text-2xl lg:text-[2rem]">
              {headline}
            </h1>

            {tagline ? (
              <p className="font-medium text-[0.95rem]" style={{ color: brand }}>
                {tagline}
              </p>
            ) : null}

            {locationMeta ? (
              <p className="text-muted-foreground font-medium text-sm">{locationMeta}</p>
            ) : null}

            {description ? (
              <ExpandableText
                text={description}
                brand={brand}
                clampLines={3}
                className="max-w-2xl pt-0.5"
              />
            ) : null}
          </div>
        </div>

        {contactAside ? (
          <div id="org-contact" className="min-w-0 self-start">
            <div className="lg:sticky lg:top-20">{contactAside}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
