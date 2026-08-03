import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Flag, Mail, PencilLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { cn } from "@/lib/utils";
import { DEMO_ORG } from "./demoOrgData";

const steps: {
  num: string;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    num: "01",
    icon: Mail,
    title: "Monthly reminder",
    body: "Your team gets one email when it’s time to verify — no scavenger hunt across PDFs and inboxes.",
  },
  {
    num: "02",
    icon: BadgeCheck,
    title: "Review your profile",
    body: "Sign in and scan each facility page. Confirm insurance, contacts, and programs still match reality.",
  },
  {
    num: "03",
    icon: PencilLine,
    title: "Update what’s changed",
    body: "Save only what moved. Partners keep the same link — with information they can trust this month.",
  },
];

type TrustState = "verified" | "past_due" | "flagged";

const trustStates: {
  id: TrustState;
  detail: string;
  badge: string;
  badgeClass: string;
  ringClass: string;
}[] = [
  {
    id: "verified",
    detail: "This profile was verified this month.",
    badge: "Verified",
    badgeClass: "bg-primary text-primary-foreground",
    ringClass: "ring-primary/35",
  },
  {
    id: "past_due",
    detail: "This profile is due for its monthly verification.",
    badge: "Past due",
    badgeClass: "bg-amber-500 text-white",
    ringClass: "ring-amber-400/40",
  },
  {
    id: "flagged",
    detail: "This profile is overdue for verification.",
    badge: "Overdue",
    badgeClass: "bg-red-600 text-white",
    ringClass: "ring-red-500/35",
  },
];

function TrustSignalCard({ state }: { state: (typeof trustStates)[number] }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_48px_-28px_rgba(0,48,72,0.35)] ring-2 transition-all duration-500",
        state.ringClass,
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={DEMO_ORG.cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" aria-hidden />
        <span
          className={cn(
            "absolute right-4 top-4 z-10 inline-flex w-24 items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md transition-colors duration-500",
            state.badgeClass,
          )}
        >
          {state.id === "verified" ? (
            <BadgeCheck className="h-3 w-3" aria-hidden />
          ) : (
            <Flag className="h-3 w-3" aria-hidden />
          )}
          {state.badge}
        </span>
      </div>

      <div className="space-y-3.5 px-5 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
            <img src={DEMO_ORG.logo} alt="" className="h-full w-full object-contain p-1.5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate font-display text-base font-semibold leading-snug text-foreground">
              {DEMO_ORG.orgName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {DEMO_ORG.hqLabel} · Behavioral health
            </p>
          </div>
        </div>

        <p className="min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground">{state.detail}</p>
      </div>
    </div>
  );
}

export function VerifiedMonthly() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [trustIndex, setTrustIndex] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.28 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const stepTimer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    const trustTimer = window.setInterval(() => {
      setTrustIndex((prev) => (prev + 1) % trustStates.length);
    }, 3200);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(trustTimer);
    };
  }, [inView]);

  const activeTrust = trustStates[trustIndex];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-muted/35"
      aria-labelledby="verified-monthly-heading"
    >
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsl(var(--primary-glow)/0.18),transparent_70%)] blur-2xl"
        aria-hidden
      />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge icon={BadgeCheck}>Monthly verification</SectionBadge>
          <DisplayHeading as="h2" align="center" className="text-balance">
            <span id="verified-monthly-heading">
              Profiles stay honest with a <DisplayAccent>monthly check</DisplayAccent> — not a
              one-time upload.
            </span>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Directory information goes stale fast. CenterLinked asks for a short verification each
            month so referral partners always know how fresh your page is.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20 grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:items-center">
          {/* Process — editorial list, not a card grid */}
          <ol className="relative space-y-0 max-w-xl mx-auto lg:mx-0 lg:max-w-none">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = inView && activeStep === i;
              const isDone = inView && i < activeStep;
              return (
                <li key={step.num} className="relative flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={cn(
                        "relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 bg-background transition-all duration-500",
                        isActive || isDone
                          ? "border-primary text-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.12)]"
                          : "border-border text-muted-foreground",
                      )}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${step.num}: ${step.title}`}
                    >
                      <span
                        className={cn(
                          "font-display text-base sm:text-lg font-bold tabular-nums",
                          isActive && "step-number-shine",
                        )}
                      >
                        {step.num}
                      </span>
                    </button>
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-[2.75rem] my-1 transition-colors duration-500",
                          isDone || isActive ? "bg-primary/45" : "bg-border",
                        )}
                        aria-hidden
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      "flex-1 min-w-0 text-left pb-8 sm:pb-10 transition-opacity duration-500",
                      isActive ? "opacity-100" : "opacity-65 hover:opacity-90",
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500",
                          isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <h3 className="font-display text-lg sm:text-xl text-foreground leading-snug">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed pl-[2.625rem]">
                      {step.body}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Trust signal — the product consequence made visible */}
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3 text-center lg:text-left">
              What partners see
            </p>

            <div
              className={cn(
                "transition-all duration-700 ease-out",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <TrustSignalCard state={activeTrust} />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
