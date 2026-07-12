import { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { LaptopFrame } from "./LaptopFrame";
import { OrgDashboardDesktopPreview } from "./OrgDashboardDesktopPreview";
import { FacilityManageDesktopPreview } from "./FacilityManageDesktopPreview";
import { cn } from "@/lib/utils";

type Phase = "dashboard" | "moving" | "click" | "facility" | "returning";

const LOOP_MS = 9000;

export function OrgDashboardInteractiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>("dashboard");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setPhase("dashboard");
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const run = async () => {
      while (!cancelled) {
        setPhase("dashboard");
        await wait(900);
        if (cancelled) break;

        setPhase("moving");
        await wait(1400);
        if (cancelled) break;

        setPhase("click");
        await wait(450);
        if (cancelled) break;

        setPhase("facility");
        await wait(3800);
        if (cancelled) break;

        setPhase("returning");
        await wait(700);
        if (cancelled) break;

        await wait(LOOP_MS - 900 - 1400 - 450 - 3800 - 700);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduceMotion]);

  const showFacility = phase === "facility" || phase === "returning";
  const highlight = phase === "click" || phase === "moving" ? 0 : null;
  const showCursor = !reduceMotion && (phase === "dashboard" || phase === "moving" || phase === "click");
  const cursorAtTarget = phase === "moving" || phase === "click";

  return (
    <div ref={rootRef} className="relative w-full max-w-5xl mx-auto">
      <LaptopFrame
        url={
          showFacility
            ? "app.centerlinked.com/facilities/northbend-detox"
            : "app.centerlinked.com/dashboard"
        }
      >
        <div className="relative h-full w-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-out",
              showFacility ? "opacity-0 -translate-x-6 scale-[0.98]" : "opacity-100 translate-x-0 scale-100",
            )}
            aria-hidden={showFacility}
          >
            <OrgDashboardDesktopPreview highlightFacilityIndex={highlight} />
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-out",
              showFacility
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-6 scale-[0.98] pointer-events-none",
            )}
            aria-hidden={!showFacility}
          >
            <FacilityManageDesktopPreview />
          </div>

          {showCursor && (
            <div
              className={cn(
                "absolute z-20 transition-[left,top,transform] duration-[1400ms] ease-in-out pointer-events-none",
                phase === "click" && "scale-90",
              )}
              style={{
                left: cursorAtTarget ? "38%" : "78%",
                top: cursorAtTarget ? "72%" : "88%",
              }}
            >
              <div className="relative">
                <MousePointer2
                  className="h-5 w-5 sm:h-6 sm:w-6 text-foreground drop-shadow-md fill-white"
                  strokeWidth={1.75}
                />
                {phase === "click" && (
                  <span className="absolute -left-1 -top-1 h-4 w-4 rounded-full bg-primary/35 animate-ping" />
                )}
              </div>
            </div>
          )}
        </div>
      </LaptopFrame>
    </div>
  );
}
