import { useEffect, useRef, useState } from "react";
import {
  Handshake,
  Presentation,
  Hospital,
  MessageSquare,
  Users,
  Send,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { WhoForNetwork } from "./WhoForNetwork";
import { LinkAnswersReveal } from "./LinkAnswersReveal";
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

          <ul className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            {moments.map((moment, i) => {
              const Icon = moment.icon;
              return (
                <li
                  key={moment.title}
                  className={cn(
                    "opacity-0 h-[84px] sm:h-[88px]",
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
                  <article
                    className={cn(
                      "h-full rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-secondary/40",
                      "px-4 py-3 sm:px-4 sm:py-3",
                      "shadow-[0_12px_24px_-14px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.85)]",
                      "ring-1 ring-black/[0.03]",
                      "transition-[transform,box-shadow] duration-300",
                      "hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-16px_rgba(15,23,42,0.32),inset_0_1px_0_rgba(255,255,255,0.9)]",
                    )}
                  >
                    <div className="flex h-full items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug shrink-0">
                          {moment.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">
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

        <div className="container relative z-10 space-y-8 sm:space-y-10">
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

          <LinkAnswersReveal />
        </div>
      </section>
    </>
  );
}
