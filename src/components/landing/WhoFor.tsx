import { useEffect, useRef, useState } from "react";
import {
  Handshake,
  Presentation,
  Hospital,
  MessageSquare,
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  Phone,
  Sparkles,
  Send,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { WhoForNetwork } from "./WhoForNetwork";
import { cn } from "@/lib/utils";

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

function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function WhoFor() {
  const momentsReveal = useInView<HTMLElement>();
  const answersReveal = useInView<HTMLElement>();

  return (
    <>
      {/* Intro + mind map */}
      <section
        id="who-for"
        className="relative overflow-x-hidden py-16 sm:py-20 lg:py-24 bg-background scroll-mt-20"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 45% at 50% 35%, hsl(var(--primary-glow) / 0.1), transparent 70%)",
          }}
        />

        <div className="container relative z-10 space-y-10 sm:space-y-12">
          <div className="mx-auto max-w-2xl text-center space-y-5">
            <SectionBadge icon={Users}>Who it&apos;s for</SectionBadge>
            <DisplayHeading as="h2" align="center">
              Provide your BD Team with{" "}
              <DisplayAccent>ONE</DisplayAccent> link to share with{" "}
              <DisplayAccent>ALL</DisplayAccent> their relationships.
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              CenterLinked makes it easy to keep referral relationships updated.
            </p>
          </div>

          <WhoForNetwork className="-mt-1 sm:-mt-2" />
        </div>
      </section>

      {/* When to send — 2×2 cards */}
      <section
        id="when-to-send"
        ref={momentsReveal.ref}
        className="relative py-16 sm:py-20 lg:py-24 bg-secondary/25 scroll-mt-20"
      >
        <div className="container relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-10 sm:mb-12">
            <SectionBadge icon={Send}>When to send your link</SectionBadge>
            <DisplayHeading as="h2" align="center" className="text-2xl sm:text-3xl lg:text-[2.15rem]">
              Never miss an opportunity to build a new relationship.
            </DisplayHeading>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              One link connects your partners with everything your organization has
              to offer.
            </p>
          </div>

          <ul className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {moments.map((moment, i) => {
              const Icon = moment.icon;
              return (
                <li
                  key={moment.title}
                  className={cn(
                    "opacity-0",
                    momentsReveal.inView && "animate-fade-up",
                  )}
                  style={
                    momentsReveal.inView
                      ? {
                          animationDelay: `${i * 80}ms`,
                          animationFillMode: "forwards",
                        }
                      : undefined
                  }
                >
                  <article className="h-full rounded-2xl border border-border/60 bg-card p-5 sm:p-6 lg:p-7 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="text-[15px] sm:text-base font-semibold text-foreground leading-snug mb-2">
                          {moment.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {moment.body}
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* What your link answers */}
      <section
        id="what-link-answers"
        ref={answersReveal.ref}
        className="relative py-16 sm:py-20 lg:py-24 bg-background scroll-mt-20"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 45% 50% at 50% 0%, hsl(var(--primary-glow) / 0.08), transparent 65%)",
          }}
        />

        <div className="container relative z-10 space-y-10 sm:space-y-12">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <SectionBadge icon={ListChecks}>What your link answers</SectionBadge>
            <DisplayHeading as="h2" align="center" className="text-2xl sm:text-3xl lg:text-[2.15rem]">
              Everything your referral partners need
            </DisplayHeading>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Case managers refer to the centers that make their jobs easier. That
              all starts with having access to the most up to date information about
              your program.
            </p>
          </div>

          <ul className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {answers.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={cn(
                    "opacity-0",
                    answersReveal.inView && "animate-fade-up",
                  )}
                  style={
                    answersReveal.inView
                      ? {
                          animationDelay: `${i * 60}ms`,
                          animationFillMode: "forwards",
                        }
                      : undefined
                  }
                >
                  <div className="h-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all hover:border-primary/25 hover:-translate-y-0.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-foreground tracking-tight">
                      {item.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
