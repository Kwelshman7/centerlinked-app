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
  /** Short description under the title. */
  description?: string | null;
  /** Facility count for the meta line. */
  facilityCount?: number;
  /** Contact / claim card rendered beside the identity block. */
  contactAside?: ReactNode;
  /**
   * Force the compact logo-on-top strip (live mobile + landing phone mockups).
   */
  compact?: boolean;
  /**
   * Logo mark size for the compact strip.
   * `mock` is intentionally larger — PhoneFrame scales the UI down on the landing page.
   */
  logoSize?: "default" | "mock";
  /**
   * `media` — compact logo strip only (mobile / landing preview).
   * `heading` / `all` — desktop identity band with contact card.
   */
  parts?: "all" | "media" | "heading";
}

/**
 * Org profile hero:
 * - Mobile / compact: full-bleed logo mark (matches landing mock).
 * - Desktop: identity band + contact card.
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
  if (compact || parts === "media") {
    return <MobileLogoHero org={org} brand={brand} compact={compact} logoSize={logoSize} />;
  }

  return (
    <IdentityHero
      org={org}
      brand={brand}
      description={description}
      facilityCount={facilityCount}
      contactAside={contactAside}
    />
  );
}

/** Desktop identity + contact — large logo, title, polished referral card. */
function IdentityHero({
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
      className="relative w-full"
      style={{
        background: `radial-gradient(ellipse 85% 70% at 12% 0%, ${brand}12 0%, transparent 58%),
          linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.28) 100%)`,
      }}
      aria-label={`${org.name} profile header`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 lg:pt-10 lg:pb-8">
        <div
          className={cn(
            "grid items-center gap-7",
            contactAside && "lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-x-12",
          )}
        >
          <div className="flex items-center min-w-0 gap-5 lg:gap-6">
            <div
              className={cn(
                "shrink-0 rounded-2xl border border-border/70 bg-white shadow-md overflow-hidden grid place-items-center",
                "h-[9rem] w-[9rem] lg:h-[11rem] lg:w-[11rem]",
              )}
            >
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={`${org.name} logo`}
                  className="h-[88%] w-[88%] object-contain"
                />
              ) : (
                <div
                  className="h-full w-full grid place-items-center"
                  style={{
                    background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)`,
                  }}
                >
                  <Building2 className="h-10 w-10 text-white/90" aria-hidden />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              {org.verified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
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

              <h1 className="font-heading font-extrabold tracking-tight text-foreground leading-[1.12] text-3xl lg:text-[2.5rem]">
                {headline}
              </h1>

              {tagline ? (
                <p className="font-semibold text-base" style={{ color: brand }}>
                  {tagline}
                </p>
              ) : null}

              {locationMeta ? (
                <p className="text-muted-foreground font-medium text-[0.95rem]">{locationMeta}</p>
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
            <div id="org-contact" className="min-w-0 w-full">
              {contactAside}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Full-bleed logo mark — live mobile + landing phone mockups. */
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
  const heroImage = orgHeroImage({ ...org, cover_image_url: null });
  const logoAsHero = orgHeroIsLogoFallback({ ...org, cover_image_url: null }) || !!org.logo_url;
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
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 45%, hsl(var(--muted)) 100%)`,
          }}
        >
          <Building2 className="h-14 w-14 text-white/80" aria-hidden />
        </div>
      </div>
    </section>
  );
}
