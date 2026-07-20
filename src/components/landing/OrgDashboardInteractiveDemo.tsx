import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { OrgDashboardDesktopPreview } from "./OrgDashboardDesktopPreview";
import { FacilityManageDesktopPreview } from "./FacilityManageDesktopPreview";
import { DashboardPreviewContent } from "./DashboardPreview";
import { FacilityManageMobilePreview } from "./FacilityManageMobilePreview";
import { BANYAN_DEMO, FEATURED_FACILITY, FEATURED_FACILITY_INDEX } from "./banyanDemoData";
import { cn } from "@/lib/utils";

type Phase = "dashboard" | "moving" | "click" | "facility" | "returning";

const TARGET_FACILITY = FEATURED_FACILITY_INDEX;
const MOVE_MS = 1200;
const MD_BREAKPOINT = 768;

function useIsDesktopDemo() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= MD_BREAKPOINT,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function DemoStage({
  isDesktop,
  showFacility,
  highlight,
  showCursor,
  phase,
  cursor,
  stageRef,
}: {
  isDesktop: boolean;
  showFacility: boolean;
  highlight: number | null;
  showCursor: boolean;
  phase: Phase;
  cursor: { x: number; y: number };
  stageRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div ref={stageRef} data-demo-stage className="relative h-full w-full overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500 ease-out",
          showFacility
            ? "opacity-0 -translate-x-6 scale-[0.98]"
            : "opacity-100 translate-x-0 scale-100",
        )}
        aria-hidden={showFacility}
      >
        {isDesktop ? (
          <OrgDashboardDesktopPreview highlightFacilityIndex={highlight} />
        ) : (
          <DashboardPreviewContent demo highlightFacilityIndex={highlight} />
        )}
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
        {isDesktop ? <FacilityManageDesktopPreview /> : <FacilityManageMobilePreview />}
      </div>

      {showCursor && (
        <div
          className={cn(
            "absolute z-20 pointer-events-none will-change-[left,top,transform]",
            phase === "moving" && "transition-[left,top] ease-in-out",
            phase === "click" && "scale-90",
          )}
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transitionDuration: phase === "moving" ? `${MOVE_MS}ms` : "120ms",
            transform: "translate(-15%, -10%)",
          }}
        >
          <div className="relative">
            <MousePointer2
              className={cn(
                "text-foreground drop-shadow-md fill-white",
                isDesktop ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6",
              )}
              strokeWidth={1.75}
            />
            {phase === "click" && (
              <span className="absolute left-0 top-0 h-4 w-4 -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/40 animate-ping" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgDashboardInteractiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktopDemo();
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>("dashboard");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cursor, setCursor] = useState({ x: 82, y: 86 });
  const [home, setHome] = useState({ x: 82, y: 86 });
  const [target, setTarget] = useState({ x: 42, y: 72 });

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

  const scrollTargetIntoView = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const facility = stage.querySelector(
      `[data-demo-facility="${TARGET_FACILITY}"]`,
    ) as HTMLElement | null;
    const scrollRoot = stage.querySelector("[data-demo-scroll]") as HTMLElement | null;

    if (!facility) return;

    if (scrollRoot) {
      const rootRect = scrollRoot.getBoundingClientRect();
      const facilityRect = facility.getBoundingClientRect();
      const offset =
        facilityRect.top - rootRect.top - rootRect.height / 2 + facilityRect.height / 2;
      scrollRoot.scrollTop += offset;
      return;
    }

    facility.scrollIntoView({ block: "center", inline: "nearest" });
  }, []);

  const measurePositions = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    scrollTargetIntoView();

    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width < 8 || stageRect.height < 8) return;

    const facility = stage.querySelector(
      `[data-demo-facility="${TARGET_FACILITY}"]`,
    ) as HTMLElement | null;

    const nextHome = isDesktop ? { x: 88, y: 90 } : { x: 78, y: 88 };

    if (facility) {
      const fr = facility.getBoundingClientRect();
      const nextTarget = {
        x: ((fr.left + fr.width * 0.55 - stageRect.left) / stageRect.width) * 100,
        y: ((fr.top + fr.height * 0.32 - stageRect.top) / stageRect.height) * 100,
      };
      setHome(nextHome);
      setTarget(nextTarget);
      setCursor((prev) => {
        if (phase === "dashboard" || phase === "returning") return nextHome;
        if (phase === "moving" || phase === "click") return nextTarget;
        return prev;
      });
    } else {
      setHome(nextHome);
      setTarget({ x: 36, y: 68 });
    }
  }, [phase, isDesktop, scrollTargetIntoView]);

  useLayoutEffect(() => {
    measurePositions();
    const stage = stageRef.current;
    if (!stage) return;

    const ro = new ResizeObserver(() => measurePositions());
    ro.observe(stage);
    window.addEventListener("resize", measurePositions);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measurePositions);
    };
  }, [measurePositions, inView, isDesktop]);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setPhase("dashboard");
      setCursor(home);
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
        setCursor(home);
        measurePositions();
        await wait(1100);
        if (cancelled) break;

        measurePositions();
        setPhase("moving");
        const stage = stageRef.current;
        const facility = stage?.querySelector(
          `[data-demo-facility="${TARGET_FACILITY}"]`,
        ) as HTMLElement | null;
        if (stage && facility) {
          const stageRect = stage.getBoundingClientRect();
          const fr = facility.getBoundingClientRect();
          setCursor({
            x: ((fr.left + fr.width * 0.55 - stageRect.left) / stageRect.width) * 100,
            y: ((fr.top + fr.height * 0.32 - stageRect.top) / stageRect.height) * 100,
          });
        } else {
          setCursor(target);
        }
        await wait(MOVE_MS);
        if (cancelled) break;

        setPhase("click");
        await wait(420);
        if (cancelled) break;

        setPhase("facility");
        await wait(4000);
        if (cancelled) break;

        setPhase("returning");
        await wait(650);
        if (cancelled) break;
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // home/target intentionally omitted — loop uses live DOM measure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, isDesktop]);

  const showFacility = phase === "facility" || phase === "returning";
  const highlight = phase === "click" || phase === "moving" ? TARGET_FACILITY : null;
  const showCursor =
    !reduceMotion && (phase === "dashboard" || phase === "moving" || phase === "click");

  const stageProps = {
    isDesktop,
    showFacility,
    highlight,
    showCursor,
    phase,
    cursor,
    stageRef,
  };

  return (
    <div ref={rootRef} className="relative w-full mx-auto">
      {isDesktop ? (
        <div className="max-w-5xl mx-auto">
          <LaptopFrame
            url={
              showFacility
                ? `app.centerlinked.com/facilities/${FEATURED_FACILITY.slug}`
                : "app.centerlinked.com/dashboard"
            }
          >
            <DemoStage {...stageProps} />
          </LaptopFrame>
        </div>
      ) : (
        <div className="flex justify-center py-2">
          <PhoneFrame>
            <DemoStage {...stageProps} />
          </PhoneFrame>
        </div>
      )}
    </div>
  );
}
