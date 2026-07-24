import { useEffect, useId, useRef, useState } from "react";
import {
  Brain,
  BriefcaseBusiness,
  Building2,
  Link2,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/centerlinked-logo-full.png";

const PARTNERS: {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path end X in viewBox 0 0 1000 320 — centers of 6 equal columns. */
  x: number;
}[] = [
  { id: "community", label: "Community Partners", icon: UsersRound, x: 83 },
  { id: "hospitals", label: "Hospitals", icon: Building2, x: 250 },
  { id: "therapists", label: "Therapists", icon: Brain, x: 417 },
  { id: "case-managers", label: "Case Managers", icon: BriefcaseBusiness, x: 583 },
  { id: "other-bd", label: "Other BD Reps", icon: Users, x: 750 },
  { id: "probation", label: "Probation Officers", icon: Shield, x: 917 },
];

function sharePath(toX: number) {
  return `M500 4 C500 70 ${toX} 130 ${toX} 250`;
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
      aria-label="Mind map: BD Teams share one live profile with therapists, case managers, hospitals, probation officers, community partners, and other BD reps"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        {/* CenterLinked hub — logo only */}
        <div
          className={cn("relative z-[3] opacity-0", active && "animate-fade-up")}
          style={active ? { animationFillMode: "forwards" } : undefined}
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-5 rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary-glow)/0.3),transparent_68%)] blur-md"
              aria-hidden
            />
            <div className="relative rounded-2xl sm:rounded-3xl border border-[#2088b8]/35 bg-gradient-to-br from-white via-[#f4fbfd] to-[#e8f5f9] px-6 py-4 sm:px-8 sm:py-5 shadow-[0_22px_50px_-20px_rgba(0,48,72,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#3ca8b4]/20">
              <p className="font-display text-lg sm:text-xl font-extrabold tracking-[0.04em] text-[#003048] uppercase leading-none text-center">
                BD Teams
              </p>
            </div>
          </div>
        </div>

        {/* Shares-with chip */}
        <div className="relative z-[2] mt-3 mb-1 flex justify-center" aria-hidden>
          <span className="rounded-full bg-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#54a89c] border border-[#54a89c]/30 shadow-sm inline-flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            shares with
          </span>
        </div>

        {/* 3 — Fan + partners */}
        <div className="relative z-[1] w-full">
          <div
            className="pointer-events-none absolute left-1/2 top-[8%] h-[40%] w-[85%] -translate-x-1/2 rounded-[100%] bg-[#003048]/[0.06] blur-3xl"
            aria-hidden
          />

          {/* Fan paths — only when partners sit in one 6-col row */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-[9.5rem] w-full overflow-visible lg:block"
            viewBox="0 0 1000 260"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${uid}-fan`} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#2088b8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#54a89c" stopOpacity="0.4" />
              </linearGradient>
              <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#003048" floodOpacity="0.22" />
              </filter>
              <clipPath id={`${uid}-mark-clip`}>
                <circle cx="0" cy="0" r="15" />
              </clipPath>
            </defs>

            {PARTNERS.map((p, i) => {
              const d = sharePath(p.x);
              const pathId = `${uid}-path-${p.id}`;
              return (
                <g key={p.id}>
                  <path
                    id={pathId}
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

                  <g opacity={active ? 1 : 0} filter={`url(#${uid}-soft)`}>
                    <circle
                      r="16"
                      fill="#fff"
                      stroke="#2088b8"
                      strokeWidth="1.3"
                      strokeOpacity="0.35"
                    />
                    <image
                      href={logoFull}
                      x="-15"
                      y="-15"
                      width="50"
                      height="30"
                      preserveAspectRatio="xMinYMid slice"
                      clipPath={`url(#${uid}-mark-clip)`}
                    />
                    {active ? (
                      <>
                        <animate
                          attributeName="opacity"
                          values="0;1;1;0"
                          keyTimes="0;0.1;0.78;1"
                          dur="3.6s"
                          repeatCount="indefinite"
                          begin={`${0.2 + i * 0.35}s`}
                        />
                        <animateMotion
                          dur="3.6s"
                          repeatCount="indefinite"
                          begin={`${0.2 + i * 0.35}s`}
                          rotate="0"
                          calcMode="spline"
                          keyTimes="0;1"
                          keySplines="0.4 0 0.2 1"
                        >
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </>
                    ) : null}
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Compact trunk into the grid below lg */}
          <div className="lg:hidden flex justify-center pb-3 pt-1" aria-hidden>
            <div className="h-8 w-0.5 rounded-full bg-gradient-to-b from-[#2088b8]/70 to-[#54a89c]/40" />
          </div>

          <ul className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-0 lg:pt-[9.5rem]">
            {PARTNERS.map((p, i) => {
              const Icon = p.icon;
              return (
                <li
                  key={p.id}
                  className={cn("opacity-0", active && "animate-fade-up")}
                  style={
                    active
                      ? {
                          animationDelay: `${120 + i * 65}ms`,
                          animationFillMode: "forwards",
                        }
                      : undefined
                  }
                >
                  <div className="h-full flex sm:flex-col items-center sm:items-center gap-2.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-[#2088b8]/22 bg-background/95 backdrop-blur-sm px-3 py-2.5 sm:px-2.5 sm:py-3.5 sm:text-center shadow-[0_12px_28px_-14px_rgba(0,48,72,0.4),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/[0.02] transition-transform duration-300 hover:-translate-y-0.5">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-[#003048]/[0.07] text-[#003048]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-display text-[12px] sm:text-[13px] font-bold tracking-tight text-[#003048] leading-snug">
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
