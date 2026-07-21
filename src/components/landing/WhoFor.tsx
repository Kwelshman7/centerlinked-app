import { useEffect, useRef, useState } from "react";
import {
  Handshake,
  Presentation,
  Hospital,
  MessageSquare,
  Users,
  Check,
  Building2,
  MapPin,
  ShieldCheck,
  Phone,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { cn } from "@/lib/utils";
import whoForNetwork from "@/assets/who-for-network.png";

const moments: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: Handshake,
    title: "After a meeting",
    body: "Follow up with one live link — not another PDF that goes stale overnight.",
  },
  {
    icon: Presentation,
    title: "At a conference",
    body: "Share from the booth, a badge scan, or a quick text.",
  },
  {
    icon: Hospital,
    title: "With hospital partners",
    body: "Give discharge planners and case managers a profile they can reopen.",
  },
  {
    icon: MessageSquare,
    title: "Anytime someone asks",
    body: "When a partner texts “send me your info,” reply with the same link in seconds.",
  },
];

const answers: {
  icon: LucideIcon;
  label: string;
}[] = [
  { icon: Building2, label: "Who you are" },
  { icon: Sparkles, label: "What you offer" },
  { icon: Users, label: "Who you help" },
  { icon: MapPin, label: "Where you're located" },
  { icon: ShieldCheck, label: "Which insurance you accept" },
  { icon: Phone, label: "How to contact you" },
];

const orgTypes = [
  "Detox",
  "Residential",
  "PHP",
  "IOP",
  "Mental Health",
  "MAT",
  "Eating Disorder",
  "Psychiatric Hospital",
];

export function WhoFor() {
  const detailRef = useRef<HTMLDivElement>(null);
  const [detailInView, setDetailInView] = useState(false);

  useEffect(() => {
    const el = detailRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setDetailInView(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="who-for" className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background scroll-mt-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 45% at 50% 35%, hsl(var(--primary-glow) / 0.1), transparent 70%)",
        }}
      />

      <div className="container relative z-10 space-y-12 sm:space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge icon={Users}>Who it&apos;s for</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Because referral partners shouldn&apos;t have to{" "}
            <DisplayAccent>wonder.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your BD team builds the relationships. CenterLinked gives every partner one live link
            with the answers they need — therapists, case managers, hospitals, and more.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div
            className="pointer-events-none absolute -inset-6 sm:-inset-10 bg-primary/8 blur-3xl rounded-full opacity-80"
            aria-hidden
          />
          <figure className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 bg-card shadow-[0_24px_64px_-28px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.04]">
            <img
              src={whoForNetwork}
              alt="Hub diagram: BD reps at the center connected to therapists, case managers, other BD reps, probation officers, hospitals, and community partners"
              className="w-full h-auto object-contain"
              draggable={false}
            />
          </figure>
          <figcaption className="sr-only">
            BD reps building connections with therapists, case managers, other BD reps, probation
            officers, hospitals, and community partners.
          </figcaption>
        </div>

        {/* Moments + answers — clinical clarity, no nested cards */}
        <div
          ref={detailRef}
          className="relative max-w-5xl mx-auto rounded-3xl border border-border/50 bg-secondary/35 overflow-hidden"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 70% at 0% 50%, hsl(var(--primary) / 0.06), transparent 60%), radial-gradient(ellipse 45% 60% at 100% 30%, hsl(var(--primary-glow) / 0.08), transparent 55%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--border) / 0.55) 1px, transparent 1px)",
              backgroundSize: "100% 2.75rem",
              maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
            }}
          />

          <div className="relative grid lg:grid-cols-[1.15fr_0.85fr]">
            {/* When to send */}
            <div className="p-6 sm:p-8 lg:p-10 lg:pr-8 border-b lg:border-b-0 lg:border-r border-border/50">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-primary mb-1.5">
                When to send your link
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
                The same profile works across BD, admissions, and marketing.
              </p>

              <ol className="relative space-y-0">
                <div
                  className="pointer-events-none absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/35 via-primary/20 to-transparent"
                  aria-hidden
                />
                {moments.map((moment, i) => {
                  const Icon = moment.icon;
                  return (
                    <li
                      key={moment.title}
                      className={cn(
                        "relative flex gap-4 sm:gap-5 py-4 first:pt-0 last:pb-0 opacity-0",
                        detailInView && "animate-fade-up",
                      )}
                      style={
                        detailInView
                          ? { animationDelay: `${i * 90}ms`, animationFillMode: "forwards" }
                          : undefined
                      }
                    >
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border border-primary/25 text-primary shadow-sm">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-baseline gap-2.5 mb-1">
                          <span className="font-display text-[10px] font-bold tracking-[0.14em] text-primary/55 tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p className="text-[15px] font-semibold text-foreground leading-snug">
                            {moment.title}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {moment.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* What it answers */}
            <div className="p-6 sm:p-8 lg:p-10 lg:pl-8 flex flex-col">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-primary mb-1.5">
                What your link answers
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Immediately — without digging through emails or outdated brochures.
              </p>

              <ul className="flex-1 flex flex-col justify-center gap-1">
                {answers.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 -mx-1 transition-colors duration-200 hover:bg-background/70 opacity-0",
                        detailInView && "animate-fade-up",
                      )}
                      style={
                        detailInView
                          ? {
                              animationDelay: `${180 + i * 70}ms`,
                              animationFillMode: "forwards",
                            }
                          : undefined
                      }
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/12 text-success ring-1 ring-success/20">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground tracking-tight">
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Care continuum — not a pill cluster */}
        <div
          className={cn(
            "max-w-5xl mx-auto text-center opacity-0",
            detailInView && "animate-fade-up",
          )}
          style={
            detailInView
              ? { animationDelay: "620ms", animationFillMode: "forwards" }
              : undefined
          }
        >
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-5">
            Built for behavioral healthcare organizations
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-0">
            {orgTypes.map((type, i) => (
              <li key={type} className="inline-flex items-center text-sm sm:text-[15px]">
                {i > 0 && (
                  <span
                    className="mx-2.5 sm:mx-3.5 h-1 w-1 rounded-full bg-primary/35"
                    aria-hidden
                  />
                )}
                <span className="font-medium text-foreground/85 tracking-tight">{type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
