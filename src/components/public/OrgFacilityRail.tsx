import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrgFacilityShowcaseCard, ShowcaseFacility } from "./OrgFacilityShowcaseCard";
import { ContractRow } from "@/lib/derive-insurance";
import { cn } from "@/lib/utils";

interface Props {
  facilities: ShowcaseFacility[];
  contracts: ContractRow[];
  orgSlug?: string | null;
}

export function OrgFacilityRail({ facilities, contracts, orgSlug }: Props) {
  const autoScrollRef = useRef(
    AutoScroll({
      speed: 0.6,
      startDelay: 1000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: true,
    }),
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: false, dragFree: true },
    [autoScrollRef.current],
  );
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    setCanScroll(emblaApi.scrollSnapList().length > 1);
  }, [emblaApi, facilities.length]);

  const pauseAuto = useCallback(() => {
    const plugin = autoScrollRef.current as { stop?: () => void };
    plugin.stop?.();
  }, []);

  const scrollPrev = useCallback(() => {
    pauseAuto();
    emblaApi?.scrollPrev();
  }, [emblaApi, pauseAuto]);

  const scrollNext = useCallback(() => {
    pauseAuto();
    emblaApi?.scrollNext();
  }, [emblaApi, pauseAuto]);

  if (facilities.length <= 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {facilities.map((f) => (
          <OrgFacilityShowcaseCard
            key={f.id}
            facility={f}
            contracts={contracts}
            orgSlug={orgSlug}
            onExpandChange={(o) => o && pauseAuto()}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative -mx-4 sm:mx-0 group">
      <div className="overflow-hidden px-4 sm:px-0" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-5">
          {facilities.map((f) => (
            <div
              key={f.id}
              className="shrink-0 basis-[85%] sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]"
            >
              <OrgFacilityShowcaseCard
                facility={f}
                contracts={contracts}
                orgSlug={orgSlug}
                onExpandChange={(o) => o && pauseAuto()}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edge fade hints */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent hidden sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent hidden sm:block" />

      {/* Manual arrows */}
      {canScroll && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={scrollPrev}
            className={cn(
              "absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10",
              "h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white shadow-lg ring-1 ring-border/60",
              "grid place-items-center text-foreground hover:bg-white hover:scale-105",
              "transition-all sm:opacity-0 group-hover:opacity-100 focus:opacity-100",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={scrollNext}
            className={cn(
              "absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10",
              "h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white shadow-lg ring-1 ring-border/60",
              "grid place-items-center text-foreground hover:bg-white hover:scale-105",
              "transition-all sm:opacity-0 group-hover:opacity-100 focus:opacity-100",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

