import { ReactNode } from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { ExpandableText } from "@/components/public/ExpandableText";
import { cn } from "@/lib/utils";

interface OrgHeroOrg {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  hq_city?: string | null;
  hq_state?: string | null;
  verified: boolean;
}

interface Props {
  org: OrgHeroOrg;
  brand: string;
  /** Short description under the title. */
  description?: string | null;
  /** Facility count for the meta line. */
  facilityCount?: number;
  /** Contact / claim card rendered on the right (desktop). */
  contactAside?: ReactNode;
  /**
   * Force mobile logo-hero sizing. Required for phone mockups rendered on desktop
   * viewports — otherwise sm/lg padding inflates a huge empty band inside the frame.
   */
  compact?: boolean;
}

/**
 * Professional org heading band — logo + title + short description on the left,
 * themed contact card on the right. Facilities grid sits full-width below.
 */
export function OrgHeroSection({
  org,
  brand,
  description,
  facilityCount = 0,
  contactAside,
  compact = false,
}: Props) {
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
      className={cn(
        "relative w-full",
        compact ? "py-2.5" : "py-1 sm:py-0",
      )}
      style={
        compact
          ? undefined
          : {
              background: `radial-gradient(ellipse 70% 55% at 50% 0%, ${brand}14 0%, transparent 70%)`,
            }
      }
    >
      <div
        className={cn(
          "grid items-start",
          compact
            ? "gap-3"
            : "gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6",
        )}
      >
        <div
          className={cn(
            "flex items-start min-w-0",
            compact ? "gap-3" : "gap-3.5 sm:gap-4 pt-0.5",
          )}
        >
          <div
            className={cn(
              "shrink-0 rounded-2xl border border-border/70 bg-card shadow-md overflow-hidden grid place-items-center",
              compact ? "h-[4.5rem] w-[4.5rem]" : "h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]",
            )}
          >
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

            <h1
              className={cn(
                "font-heading font-extrabold tracking-tight text-foreground leading-[1.15]",
                compact
                  ? "text-lg"
                  : "text-xl sm:text-2xl lg:text-[2rem]",
              )}
            >
              {headline}
            </h1>

            {tagline ? (
              <p
                className={cn(
                  "font-medium",
                  compact ? "text-xs" : "text-sm sm:text-[0.95rem]",
                )}
                style={{ color: brand }}
              >
                {tagline}
              </p>
            ) : null}

            {locationMeta ? (
              <p
                className={cn(
                  "text-muted-foreground font-medium",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {locationMeta}
              </p>
            ) : null}

            {description ? (
              <ExpandableText
                text={description}
                brand={brand}
                clampLines={3}
                className={cn(
                  "max-w-2xl",
                  compact ? "pt-0.5" : "pt-0.5 hidden sm:block",
                )}
              />
            ) : null}
          </div>
        </div>

        {contactAside ? (
          <div
            id="org-contact"
            className={cn("min-w-0", compact ? "hidden" : "hidden lg:block")}
          >
            <div className={cn(!compact && "lg:sticky lg:top-20")}>{contactAside}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
