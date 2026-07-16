import { useEffect, useRef, useState } from "react";
import { Building2, Share2, UserPlus, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { cn } from "@/lib/utils";

const stages: {
  num: string;
  icon: LucideIcon;
  title: string;
  body: string;
  details: string[];
}[] = [
  {
    num: "01",
    icon: UserPlus,
    title: "Claim Your Organization",
    body: "Request access, create your account, and claim your treatment organization so your whole team has a home base on CenterLinked.",
    details: ["Request access", "Create account", "Claim your org"],
  },
  {
    num: "02",
    icon: Building2,
    title: "Build Your Profile",
    body: "Add the facts referral partners need — locations, insurance, levels of care, contacts, photos, and how to refer — in one place.",
    details: ["Locations & programs", "Insurance contracts", "Contacts & photos"],
  },
  {
    num: "03",
    icon: Share2,
    title: "Share Your Link",
    body: "Get one live profile link your BD, admissions, and marketing teams can share with every referral partner — always current.",
    details: ["BD & admissions", "Marketing teams", "Referral partners"],
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % stages.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [inView]);

  const railProgress = inView ? (active / (stages.length - 1)) * 100 : 0;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background"
    >
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-80" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge>How it works</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Three steps to a live{" "}
            <DisplayAccent>referral profile.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            From claim to share — a clear path to one link your partners can trust.
          </p>
        </div>

        {/* Desktop / tablet process rail */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto hidden md:block">
          <div className="relative mb-10">
            <div className="absolute left-[16.67%] right-[16.67%] top-1/2 -translate-y-1/2 h-[2px] bg-border" aria-hidden>
              <div
                className="h-full bg-gradient-to-r from-primary via-[hsl(var(--primary-glow))] to-primary transition-[width] duration-700 ease-out"
                style={{ width: `${railProgress}%` }}
              />
            </div>
            <ol className="relative grid grid-cols-3 gap-6">
              {stages.map((step, i) => {
                const isActive = inView && active === i;
                const isDone = inView && i < active;
                return (
                  <li key={step.num} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full border-2 bg-background transition-all duration-500",
                        isActive || isDone
                          ? "border-primary shadow-glow scale-105"
                          : "border-border text-muted-foreground",
                      )}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${step.num}: ${step.title}`}
                    >
                      <span
                        className={cn(
                          "font-display text-xl font-bold tabular-nums tracking-tight transition-colors duration-500",
                          isActive || isDone ? "text-primary" : "text-muted-foreground",
                          isActive && "step-number-shine",
                        )}
                      >
                        {step.num}
                      </span>
                      {isActive && (
                        <span
                          className="pointer-events-none absolute inset-[-6px] rounded-full border border-primary/30 animate-pulse-soft"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid grid-cols-3 gap-6 lg:gap-8">
            {stages.map((step, i) => (
              <StepPanel
                key={step.title}
                step={step}
                index={i}
                active={inView && active === i}
                onSelect={() => setActive(i)}
              />
            ))}
          </div>
        </div>

        {/* Mobile vertical process */}
        <ol className="mt-12 max-w-md mx-auto md:hidden space-y-0">
          {stages.map((step, i) => {
            const isActive = inView && active === i;
            const isDone = inView && i < active;
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-background transition-all duration-500 z-10",
                      isActive || isDone
                        ? "border-primary shadow-md"
                        : "border-border",
                    )}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${step.num}: ${step.title}`}
                  >
                    <span
                      className={cn(
                        "font-display text-lg font-bold tabular-nums",
                        isActive || isDone ? "text-primary" : "text-muted-foreground",
                        isActive && "step-number-shine",
                      )}
                    >
                      {step.num}
                    </span>
                  </button>
                  {i < stages.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 flex-1 min-h-[2.5rem] my-1 transition-colors duration-500",
                        isDone || isActive ? "bg-primary/50" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "flex-1 min-w-0 text-left pb-8 transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="font-display text-lg text-foreground leading-snug">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  <ul className="mt-3 space-y-1.5">
                    {step.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2 text-sm font-medium text-foreground/90"
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function StepPanel({
  step,
  index,
  active,
  onSelect,
}: {
  step: (typeof stages)[number];
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = step.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col text-left rounded-2xl border p-6 transition-all duration-500 min-h-[280px]",
        active
          ? "border-primary/40 bg-card shadow-lg shadow-primary/10 -translate-y-1"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card",
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-current={active ? "step" : undefined}
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
          aria-hidden
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500",
            active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span
          className={cn(
            "font-display text-2xl font-bold tabular-nums tracking-tight transition-colors duration-500",
            active ? "text-primary step-number-shine" : "text-muted-foreground/40",
          )}
        >
          {step.num}
        </span>
      </div>

      <h3 className="font-display text-xl text-foreground leading-snug">{step.title}</h3>
      <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed flex-1">{step.body}</p>

      <ul className="mt-5 space-y-2 border-t border-border/60 pt-4">
        {step.details.map((d) => (
          <li key={d} className="flex items-center gap-2 text-sm font-medium text-foreground/90">
            <Check
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors duration-500",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            {d}
          </li>
        ))}
      </ul>
    </button>
  );
}
