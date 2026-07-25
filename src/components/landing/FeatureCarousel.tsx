import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeatureCarouselSlide = {
  id: string;
  label: string;
  title: string;
  caption: string;
  content: ReactNode;
  /** How long to linger on this slide before auto-advance (ms). */
  durationMs?: number;
};

interface FeatureCarouselProps {
  slides: FeatureCarouselSlide[];
  className?: string;
  /** Default auto-advance interval in ms. Set 0 to disable. */
  intervalMs?: number;
}

export function FeatureCarousel({
  slides,
  className,
  intervalMs = 4500,
}: FeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(1, Math.max(0, Math.floor(slides.length / 2))),
  );
  const [paused, setPaused] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const activeDurationMs = slides[currentIndex]?.durationMs ?? intervalMs;

  useEffect(() => {
    if (activeDurationMs <= 0 || paused || slides.length < 2) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setTimeout(handleNext, activeDurationMs);
    return () => window.clearTimeout(timer);
  }, [handleNext, activeDurationMs, paused, slides.length, currentIndex]);

  const active = slides[currentIndex];

  return (
    <div
      className={cn("relative w-full flex flex-col items-center", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative w-full h-[420px] sm:h-[480px] md:h-[520px] flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center [perspective:1200px]">
          {slides.map((slide, index) => {
            const offset = index - currentIndex;
            const total = slides.length;
            let pos = (offset + total) % total;
            if (pos > Math.floor(total / 2)) pos -= total;

            const isCenter = pos === 0;
            const isAdjacent = Math.abs(pos) === 1;

            return (
              <div
                key={slide.id}
                className="absolute flex items-center justify-center transition-all duration-500 ease-in-out"
                style={{
                  transform: `
                    translateX(${pos * 42}%)
                    scale(${isCenter ? 1 : isAdjacent ? 0.86 : 0.72})
                    rotateY(${pos * -12}deg)
                  `,
                  zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                  opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
                  filter: isCenter ? "blur(0px)" : "blur(3px)",
                  visibility: Math.abs(pos) > 1 ? "hidden" : "visible",
                  pointerEvents: isCenter ? "auto" : "none",
                }}
                aria-hidden={!isCenter}
              >
                <div
                  className={cn(
                    "relative",
                    isCenter && "drop-shadow-[0_28px_48px_-18px_rgba(0,48,72,0.45)]",
                  )}
                >
                  <div
                    className="pointer-events-none absolute left-1/2 top-[78%] h-6 w-[70%] -translate-x-1/2 rounded-[100%] bg-black/15 blur-xl"
                    aria-hidden
                  />
                  {slide.content}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous mockup"
          className="absolute left-1 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 z-20 border-primary/35 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next mockup"
          className="absolute right-1 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 z-20 border-primary/35 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {active ? (
        <div className="mt-8 sm:mt-10 max-w-lg mx-auto text-center space-y-2.5 px-2 transition-opacity duration-300">
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-primary">
            {active.label}
          </p>
          <h3 className="font-display text-xl sm:text-2xl lg:text-3xl text-foreground leading-tight">
            {active.title}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {active.caption}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Mockup slides">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={slide.label}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-6 bg-primary"
                : "w-2 bg-primary/25 hover:bg-primary/40",
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
