import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { SearchInteractiveDemo } from "@/components/landing/SearchInteractiveDemo";
import { PublicOrgSheetPreviewContent } from "@/components/landing/PublicOrgSheetPreview";

const STEPS = [
  {
    id: "search",
    label: "1 · Search",
    title: "Type an insurance. Pick a state.",
    caption: "Matching in-network programs show up in seconds.",
    /** Long enough for typing → state pick → results to play through (matches the landing carousel). */
    durationMs: 11000,
  },
  {
    id: "profile",
    label: "2 · What partners open",
    title: "Your profile, when your facility matches.",
    caption: "Partners see your insurance, levels of care, locations, and who to contact.",
    durationMs: 7000,
  },
] as const;

/** Signup-page preview: the landing search demo, then the partner-facing profile, on a loop. */
export function JoinShowcase({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
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
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Advance only while visible so the search demo is not skipped before anyone sees it.
  useEffect(() => {
    if (reduceMotion || !inView) return;
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % STEPS.length),
      STEPS[index].durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [index, inView, reduceMotion]);

  const step = STEPS[index];

  return (
    <div ref={rootRef} className={cn("flex flex-col items-center", className)}>
      <div className="flex w-full max-w-sm gap-2" role="tablist" aria-label="Product preview">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              i === index
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 bg-background/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative mt-6">
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] h-[110%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[70px]"
          aria-hidden
        />
        <PhoneFrame key={step.id} className="w-[220px] sm:w-[250px] animate-fade-up">
          {step.id === "search" ? <SearchInteractiveDemo /> : <PublicOrgSheetPreviewContent />}
        </PhoneFrame>
      </div>

      <div className="mt-8 max-w-md text-center" aria-live="polite">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">{step.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-[15px]">{step.caption}</p>
      </div>
    </div>
  );
}
