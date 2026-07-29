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
   * Force the compact logo-on-top hero (phone mockups).
   * On real pages, mobile uses logo-on-top and lg+ uses the heading band.
   */
  compact?: boolean;
  /**
   * Logo mark size for the mobile/compact hero.
   * `mock` is intentionally larger — PhoneFrame scales the UI down on the landing page.
   */
  logoSize?: "default" | "mock";
}

/**
 * Org hero:
 * - Mobile / compact: logo sits cleanly on top of the screen (or cover photo).
 * - Desktop (lg+): professional heading — logo tile + title + contact card.
 */
export function OrgHeroSection({
  org,
  brand,
  description,
  facilityCount = 0,
  contactAside,
  compact = false,
  logoSize = "default",
}: Props) {
  return (
    <>
      <div className={cn(compact ? "block" : "lg:hidden")}>
        <MobileLogoHero org={org} brand={brand} compact={compact} logoSize={logoSize} />
      </div>

      {!compact && (
        <div className="hidden lg:block">
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

/** Full-bleed logo mark or cover — used on mobile and phone mockups. */
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
            /*
              Many org logos (incl. the Banyan demo asset) ship as a square with large
              internal padding. PhoneFrame already scales the whole UI down — if we
              only bump height, we grow empty black margins. Instead: fixed tight
              band + scale the artwork up so the mark fills the band without
              enlarging the phone chrome.
            */
            <div className="relative h-[6.75rem] w-[90%] overflow-hidden">
              <img
                src={heroImage}
                alt={org.name}
                className="absolute inset-0 h-full w-full object-contain origin-center scale-[1.85]"
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

/** Desktop-only professional heading + contact card. */
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
      className="relative w-full py-0"
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 0%, ${brand}14 0%, transparent 70%)`,
      }}
    >
      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6">
        <div className="flex items-start min-w-0 gap-3.5 sm:gap-4 pt-0.5">
          <div className="shrink-0 rounded-2xl border border-border/70 bg-card shadow-md overflow-hidden grid place-items-center h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]">
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

          <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
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

            <h1 className="font-heading font-extrabold tracking-tight text-foreground leading-[1.15] text-xl sm:text-2xl lg:text-[2rem]">
              {headline}
            </h1>

            {tagline ? (
              <p className="font-medium text-sm sm:text-[0.95rem]" style={{ color: brand }}>
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
          <div id="org-contact" className="min-w-0">
            <div className="lg:sticky lg:top-20">{contactAside}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
