import { Building2 } from "lucide-react";
import { orgHeroImage, orgHeroIsLogoFallback } from "@/lib/org-hero";
import { cn } from "@/lib/utils";

interface OrgHeroOrg {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  cover_image_url: string | null;
  image_urls?: string[] | null;
  verified: boolean;
}

interface Props {
  org: OrgHeroOrg;
  brand: string;
  /**
   * Force mobile logo-hero sizing. Required for phone mockups rendered on desktop
   * viewports — otherwise sm/lg padding inflates a huge empty band inside the frame.
   */
  compact?: boolean;
}

/**
 * Full-bleed org hero — cover photo or compact logo mark.
 * Logo-as-hero uses an in-flow logo (not a tall empty band) so mobile keeps room for the facility grid.
 */
export function OrgHeroSection({ org, brand, compact = false }: Props) {
  const heroImage = orgHeroImage(org);
  const logoAsHero = orgHeroIsLogoFallback(org);

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
            compact ? "px-5 py-2.5" : "py-1.5 sm:py-10 lg:py-14",
          )}
        >
          <img
            src={heroImage}
            alt={org.name}
            className={cn(
              "w-auto object-contain",
              compact
                ? "h-24 max-w-[90%]"
                : "h-[4.75rem] max-w-[88%] sm:h-28 sm:max-w-[55%] lg:h-36",
            )}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-muted/40">
      <div
        className={cn(
          "relative w-full",
          compact ? "h-[148px] min-h-[148px]" : "min-h-[160px] sm:min-h-[280px] lg:min-h-[400px]",
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
