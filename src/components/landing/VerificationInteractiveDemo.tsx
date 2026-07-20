import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MousePointer2, Timer } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { VerifyContractsPreview } from "./VerifyContractsPreview";
import { cn } from "@/lib/utils";

type Phase = "reminder" | "verify" | "moving" | "click" | "success" | "pause";

const MOVE_MS = 900;

export function VerificationInteractiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>("reminder");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cursor, setCursor] = useState({ x: 72, y: 78 });
  const [elapsed, setElapsed] = useState(0);

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
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const measureTarget = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 50, y: 72 };

    const stageRect = stage.getBoundingClientRect();
    const btn = stage.querySelector("[data-demo-confirm]") as HTMLElement | null;
    if (!btn || stageRect.width < 8) return { x: 50, y: 72 };

    const br = btn.getBoundingClientRect();
    return {
      x: ((br.left + br.width * 0.5 - stageRect.left) / stageRect.width) * 100,
      y: ((br.top + br.height * 0.5 - stageRect.top) / stageRect.height) * 100,
    };
  }, []);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      if (phase === "verify" || phase === "reminder") {
        setCursor({ x: 72, y: 78 });
      }
    });
    const stage = stageRef.current;
    if (stage) ro.observe(stage);
    return () => ro.disconnect();
  }, [phase]);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setPhase("verify");
      setElapsed(8);
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
        setPhase("reminder");
        setElapsed(0);
        setCursor({ x: 72, y: 78 });
        await wait(1400);
        if (cancelled) break;

        setPhase("verify");
        await wait(900);
        if (cancelled) break;

        setPhase("moving");
        setCursor(measureTarget());
        await wait(MOVE_MS);
        if (cancelled) break;

        setPhase("click");
        await wait(350);
        if (cancelled) break;

        setPhase("success");
        setElapsed(8);
        await wait(2800);
        if (cancelled) break;

        setPhase("pause");
        await wait(600);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduceMotion, measureTarget]);

  useEffect(() => {
    if (phase !== "reminder" && phase !== "verify" && phase !== "moving") return;
    if (phase === "reminder") {
      setElapsed(0);
      return;
    }

    const start = Date.now();
    const tick = window.setInterval(() => {
      const sec = Math.min(8, Math.floor((Date.now() - start) / 1000) + 1);
      setElapsed(sec);
    }, 200);

    return () => clearInterval(tick);
  }, [phase]);

  const previewPhase =
    phase === "success" || phase === "pause" ? "success" : phase === "reminder" ? "reminder" : "verify";

  const showCursor = !reduceMotion && (phase === "moving" || phase === "click");
  const highlightConfirm = phase === "click" || phase === "moving";

  return (
    <div ref={rootRef} className="relative flex flex-col items-center">
      <div className="relative">
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
                  transitionDuration: phase === "moving" ? `${MOVE_MS}ms` : "120ms",
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

        <div
          className={cn(
            "absolute -top-3 -right-2 sm:-right-6 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-md transition-opacity duration-300",
            phase === "success" ? "opacity-100" : "opacity-90",
          )}
        >
          <Timer className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span className="text-[11px] font-bold tabular-nums text-foreground">
            {phase === "success" || phase === "pause" ? `${elapsed}s` : `0:0${elapsed}`}
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {phase === "success" ? "done" : "elapsed"}
          </span>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
        {phase === "success" || phase === "pause"
          ? "One tap — profile verified and live for partners."
          : "Monthly reminder → review → confirm. No forms, no re-uploads."}
      </p>
    </div>
  );
}
