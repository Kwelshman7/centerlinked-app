import { useEffect, useId, useRef, useState } from "react";
import {
  Brain,
  BriefcaseBusiness,
  Building2,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/centerlinked-logo-full.png";

const PARTNERS: {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path end X in viewBox 0 0 1000 280 — centers of 5 equal columns. */
  x: number;
}[] = [
  { id: "hospitals", label: "Hospitals", icon: Building2, x: 100 },
  { id: "therapists", label: "Therapists", icon: Brain, x: 300 },
  { id: "case-managers", label: "Case Managers", icon: BriefcaseBusiness, x: 500 },
  { id: "other-bd", label: "Other BD Reps", icon: Users, x: 700 },
  { id: "probation", label: "Probation Officers", icon: Shield, x: 900 },
];

/** Spokes leave from the hub ball center. */
function sharePath(toX: number) {
  return `M500 44 C500 100 ${toX} 160 ${toX} 268`;
}

export function WhoForNetwork({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.18 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      role="img"
      aria-label="Mind map: BD Teams share one live profile with therapists, case managers, hospitals, probation officers, and other BD reps"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        {/* BD Teams — product-style team chip */}
        <div
          className={cn(
            "relative z-[4] opacity-0",
            active && "animate-fade-up",
          )}
          style={active ? { animationFillMode: "forwards" } : undefined}
        >
          <div className="inline-flex items-center justify-center rounded-2xl border border-[#2088b8]/20 bg-gradient-to-br from-white via-[#f7fbfd] to-[#eef7fa] px-4 sm:px-5 py-2.5 sm:py-3 shadow-[0_14px_32px_-14px_rgba(0,48,72,0.4),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.02]">
            <div className="min-w-0 text-center">
              <p className="font-display text-[15px] sm:text-base font-bold tracking-tight text-[#003048] leading-none">
                BD Teams
              </p>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-[#003048]/55 leading-none">
                Business development
              </p>
            </div>
          </div>
        </div>

        {/* Ball sits on the spoke origin; lines fan to partner cards */}
        <div className="relative z-[1] w-full mt-3 sm:mt-4">
          <div
            className="pointer-events-none absolute left-1/2 top-[8%] h-[42%] w-[85%] -translate-x-1/2 rounded-[100%] bg-[#003048]/[0.06] blur-3xl"
            aria-hidden
          />

          {/* Hub ball — centered in flow so spokes meet the mark */}
          <div
            className={cn(
              "relative z-[3] mx-auto flex justify-center opacity-0",
              active && "animate-fade-up",
            )}
            style={active ? { animationDelay: "60ms", animationFillMode: "forwards" } : undefined}
          >
            <div className="relative h-12 w-12 sm:h-14 sm:w-14">
              <div
                className="pointer-events-none absolute -inset-2.5 rounded-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary-glow)/0.35),transparent_68%)] blur-md"
                aria-hidden
              />
              <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-[0_12px_28px_-8px_rgba(0,48,72,0.45),inset_0_1px_0_rgba(255,255,255,0.95)] ring-2 ring-[#2088b8]/35">
                <img
                  src={logoFull}
                  alt="CenterLinked"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-auto max-w-none -translate-x-[13%] -translate-y-1/2 select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Fan paths — desktop; origin aligns with ball center */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-[11rem] w-full overflow-visible lg:block"
            viewBox="0 0 1000 280"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${uid}-fan`} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#2088b8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#54a89c" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {PARTNERS.map((p, i) => {
              const d = sharePath(p.x);
              return (
                <g key={p.id}>
                  <path
                    d={d}
                    stroke={`url(#${uid}-fan)`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                  <path
                    d={d}
                    className={cn(active && "animate-who-for-spoke")}
                    stroke="#54a89c"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeDasharray="5 8"
                    opacity="0.85"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Compact trunk into the grid below lg */}
          <div className="lg:hidden flex justify-center pt-3 pb-3" aria-hidden>
            <div className="h-8 w-0.5 rounded-full bg-gradient-to-b from-[#2088b8]/70 to-[#54a89c]/40" />
          </div>

          <ul className="relative flex flex-wrap justify-center gap-3 sm:gap-3.5 pt-1 lg:pt-[7.75rem]">
            {PARTNERS.map((p, i) => {
              const Icon = p.icon;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "w-[calc(50%-0.375rem)] max-w-[11.5rem] sm:w-[calc(33.333%-0.625rem)] sm:max-w-[12.5rem] lg:w-[calc(20%-0.7rem)] lg:max-w-none opacity-0",
                    active && "animate-fade-up",
                  )}
                  style={
                    active
                      ? {
                          animationDelay: `${140 + i * 65}ms`,
                          animationFillMode: "forwards",
                        }
                      : undefined
                  }
                >
                  <div className="h-full flex flex-col items-center gap-2.5 sm:gap-3 rounded-2xl border border-[#2088b8]/20 bg-background px-3 py-4 sm:px-3 sm:py-5 text-center shadow-[0_18px_36px_-14px_rgba(0,48,72,0.42),0_8px_16px_-10px_rgba(0,48,72,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.03] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_48px_-16px_rgba(0,48,72,0.48),0_12px_22px_-12px_rgba(0,48,72,0.32)]">
                    <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003048]/[0.08] to-[#2088b8]/10 text-[#003048] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-[13px] sm:text-sm font-bold tracking-tight text-[#003048] leading-snug">
                      {p.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
