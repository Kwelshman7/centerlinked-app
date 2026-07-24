import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { VerifyContractsPreview } from "./VerifyContractsPreview";
import { cn } from "@/lib/utils";

export type VerifyDemoStep = 0 | 1 | 2;

type Phase = "review" | "moving" | "click" | "success" | "pause";

const MOVE_MS = 1600;

/** Readable pacing — no fake notification beats. */
const HOLD = {
  review: 3800,
  click: 550,
  success: 4200,
  pause: 1600,
} as const;

function stepForPhase(phase: Phase): VerifyDemoStep {
  if (phase === "review") return 0;
  if (phase === "moving" || phase === "click") return 1;
  return 2;
}

interface Props {
  onStepChange?: (step: VerifyDemoStep) => void;
}

export function VerificationInteractiveDemo({ onStepChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>("review");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cursor, setCursor] = useState({ x: 50, y: 62 });

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

  const measureTarget = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 50, y: 68 };

    const stageRect = stage.getBoundingClientRect();
    const btn = stage.querySelector("[data-demo-confirm]") as HTMLElement | null;
    if (!btn || stageRect.width < 8) return { x: 50, y: 68 };

    const br = btn.getBoundingClientRect();
    return {
      x: ((br.left + br.width * 0.5 - stageRect.left) / stageRect.width) * 100,
      y: ((br.top + br.height * 0.5 - stageRect.top) / stageRect.height) * 100,
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => {
      if (phase === "review") setCursor({ x: 50, y: 42 });
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [phase]);

  useEffect(() => {
    onStepChange?.(stepForPhase(phase));
  }, [phase, onStepChange]);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setPhase("review");
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
        setPhase("review");
        setCursor({ x: 50, y: 42 });
        await wait(HOLD.review);
        if (cancelled) break;

        setPhase("moving");
        // Measure after layout paints the review UI
        await wait(80);
        if (cancelled) break;
        setCursor(measureTarget());
        await wait(MOVE_MS);
        if (cancelled) break;

        setPhase("click");
        await wait(HOLD.click);
        if (cancelled) break;

        setPhase("success");
        await wait(HOLD.success);
        if (cancelled) break;

        setPhase("pause");
        await wait(HOLD.pause);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduceMotion, measureTarget]);

  const previewPhase = phase === "success" || phase === "pause" ? "success" : "review";
  const showCursor = !reduceMotion && (phase === "moving" || phase === "click");
  const highlightConfirm = phase === "click" || phase === "moving";

  return (
    <div ref={rootRef} className="relative flex flex-col items-center w-full">
      <PhoneFrame className="w-[min(100%,280px)] sm:w-[290px]">
        <div ref={stageRef} className="relative h-full w-full">
          <VerifyContractsPreview phase={previewPhase} highlightConfirm={highlightConfirm} />

          {showCursor && (
            <div
              className={cn(
                "absolute z-30 pointer-events-none will-change-[left,top,transform]",
                phase === "moving" && "transition-[left,top] ease-in-out",
                phase === "click" && "scale-90",
              )}
              style={{
                left: `${cursor.x}%`,
                top: `${cursor.y}%`,
                transitionDuration: phase === "moving" ? `${MOVE_MS}ms` : "160ms",
                transform: "translate(-15%, -10%)",
              }}
            >
              <MousePointer2
                className="h-6 w-6 text-foreground drop-shadow-md fill-white"
                strokeWidth={1.75}
              />
              {phase === "click" && (
                <span className="absolute left-0 top-0 h-4 w-4 -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/40 animate-ping" />
              )}
            </div>
          )}
        </div>
      </PhoneFrame>
    </div>
  );
}
