import { useCallback, useState } from "react";
import { BadgeCheck, ClipboardCheck, MousePointerClick } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import {
  VerificationInteractiveDemo,
  type VerifyDemoStep,
} from "./VerificationInteractiveDemo";
import { cn } from "@/lib/utils";

const steps: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: ClipboardCheck,
    title: "Open verify when due",
    body: "When verification is due, open the facility verify screen and review your in-network insurance list.",
  },
  {
    icon: MousePointerClick,
    title: "Confirm or edit",
    body: "If nothing changed, tap “All contracts are accurate.” Need updates? Edit the list, then save & verify.",
  },
  {
    icon: BadgeCheck,
    title: "Stay live for partners",
    body: "Verification resets the 30-day freshness clock so referral partners always see current information.",
  },
];

export function VerifiedMonthly() {
  const [activeStep, setActiveStep] = useState<VerifyDemoStep>(0);
  const onStepChange = useCallback((step: VerifyDemoStep) => {
    setActiveStep(step);
  }, []);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-70" aria-hidden />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={BadgeCheck}>Monthly verification</SectionBadge>
          <DisplayHeading as="h2" align="center">
            One of the biggest problems in healthcare directories is{" "}
            <DisplayAccent>outdated information.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            CenterLinked solves this differently. Monthly verification keeps your shared profile
            accurate — so referral partners can trust what they open.
          </p>
        </div>

        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch max-w-5xl mx-auto">
          <div className="flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-full max-w-[320px]">
              <div
                className="pointer-events-none absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-70"
                aria-hidden
              />
              <VerificationInteractiveDemo onStepChange={onStepChange} />
            </div>
          </div>

          <div className="order-1 lg:order-2 min-w-0 flex flex-col gap-3 sm:gap-4 h-full">
            {steps.map((step, i) => {
              const active = activeStep === i;
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={cn(
                    "flex-1 min-h-[7.5rem] rounded-2xl border p-5 sm:p-6 text-left flex gap-4 transition-all duration-500",
                    active
                      ? "border-primary/50 bg-primary/[0.07] shadow-[0_12px_36px_-18px_hsl(var(--primary)/0.45)] ring-1 ring-primary/25"
                      : "border-border bg-card shadow-sm opacity-75",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[11px] font-bold tabular-nums transition-colors duration-500",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        0{i + 1}
                      </span>
                      <h3 className="font-display text-base sm:text-lg text-foreground leading-snug">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
