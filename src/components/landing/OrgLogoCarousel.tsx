import { useMemo } from "react";
import { cn } from "@/lib/utils";
import logoPalmHarbor from "@/assets/logo-palm-harbor.png";
import logoCoastalBridge from "@/assets/logo-coastal-bridge.png";
import logoEverglade from "@/assets/logo-everglade.png";
import logoAtlanticSands from "@/assets/logo-atlantic-sands.png";
import logoRidgeview from "@/assets/logo-ridgeview.png";
import logoNorthbend from "@/assets/logo-northbend.png";

type OrgLogo = {
  id: string;
  name: string;
  logo_url: string;
};

/** Fictional example program marks — never live customer logos. */
const EXAMPLE_LOGOS: OrgLogo[] = [
  { id: "northbend", name: "Northbend Recovery", logo_url: logoNorthbend },
  { id: "palm-harbor", name: "Palm Harbor Health Group", logo_url: logoPalmHarbor },
  { id: "coastal-bridge", name: "Coastal Bridge Partners", logo_url: logoCoastalBridge },
  { id: "everglade", name: "Everglade Health Network", logo_url: logoEverglade },
  { id: "atlantic-sands", name: "Atlantic Sands Group", logo_url: logoAtlanticSands },
  { id: "ridgeview", name: "Ridgeview Recovery", logo_url: logoRidgeview },
];

interface OrgLogoCarouselProps {
  className?: string;
}

/** Set to true to show the trademark disclaimer under the logo strip. */
const SHOW_LOGO_DISCLAIMER = false;

export function OrgLogoCarousel({ className }: OrgLogoCarouselProps) {
  const logos = EXAMPLE_LOGOS;

  // Repeat enough times for a seamless strip even with few logos
  const track = useMemo(() => {
    if (logos.length === 0) return [];
    const minItems = 12;
    const repeats = Math.max(2, Math.ceil(minItems / logos.length));
    return Array.from({ length: repeats }, () => logos).flat();
  }, [logos]);

  if (logos.length === 0) return null;

  // Two identical tracks for seamless infinite scroll
  const loop = [...track, ...track];

  return (
    <div
      className={cn(
        "w-full border-t border-border/50 bg-background/60 backdrop-blur-sm",
        className,
      )}
      aria-label="Example organization logos"
    >
      <div className="relative overflow-hidden py-4 sm:py-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max animate-logo-marquee hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:w-full motion-reduce:justify-center motion-reduce:gap-8">
          {loop.map((org, i) => (
            <div
              key={`${org.id}-${i}`}
              className="mx-5 sm:mx-7 flex h-10 w-[7.5rem] sm:h-11 sm:w-36 shrink-0 items-center justify-center"
            >
              <img
                src={org.logo_url}
                alt={org.name}
                title={org.name}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="max-h-full max-w-full object-contain opacity-70 grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>

      {SHOW_LOGO_DISCLAIMER ? (
        <p className="px-4 pb-3 text-center text-[10px] sm:text-[11px] italic leading-snug text-muted-foreground/80 max-w-3xl mx-auto">
          Example marks are for demonstration only and do not represent real partner organizations.
        </p>
      ) : null}
    </div>
  );
}
