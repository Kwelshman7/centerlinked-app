import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type OrgLogo = {
  id: string;
  name: string;
  logo_url: string;
};

interface OrgLogoCarouselProps {
  className?: string;
}

export function OrgLogoCarousel({ className }: OrgLogoCarouselProps) {
  const [logos, setLogos] = useState<OrgLogo[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .not("logo_url", "is", null)
        .order("name");

      if (cancelled || error || !data) return;

      const withLogos = data
        .filter((o): o is { id: string; name: string; logo_url: string } =>
          Boolean(o.logo_url && o.logo_url.trim()),
        )
        .map((o) => ({ id: o.id, name: o.name, logo_url: o.logo_url.trim() }));

      setLogos(withLogos);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        "w-full border-t border-border/60 bg-background/70 backdrop-blur-sm",
        className,
      )}
      aria-label="Organization logos"
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

      <p className="px-4 pb-3 text-center text-[10px] sm:text-[11px] italic leading-snug text-muted-foreground/80 max-w-3xl mx-auto">
        Logos are trademarks of their respective owners and are displayed for identification
        purposes only. Their appearance does not constitute or imply endorsement of CenterLinked.
      </p>
    </div>
  );
}
