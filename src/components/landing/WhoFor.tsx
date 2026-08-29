import { useEffect, useRef, useState } from "react";
import {
  Handshake,
  Monitor,
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
import { LinkAnswersDesktopVisual } from "./LinkAnswersDesktopVisual";
import { cn } from "@/lib/utils";
import handshakeImg from "@/assets/when-to-send-handshake.jpg";

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
    icon: Monitor,
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

function useInView<T extends HTMLElement>(threshold = 0.05) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const reveal = () => setInView(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "80px 0px 80px 0px" },
    );
    observer.observe(el);

    // Hash navigation / late layout: re-check after paint and on scroll.
    const check = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (rect.top < vh && rect.bottom > 0) reveal();
    };
    const raf = requestAnimationFrame(check);
    const t1 = window.setTimeout(check, 120);
    const t2 = window.setTimeout(check, 400);
    window.addEventListener("scroll", check, { passive: true, once: true });
    window.addEventListener("hashchange", check);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", check);
      window.removeEventListener("hashchange", check);
    };
  }, [threshold, inView]);

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

      {/* When to send + What link answers — one continuous desktop story */}
      <div className="relative bg-background">
        <section
          id="when-to-send"
          ref={momentsReveal.ref}
          className="relative overflow-hidden scroll-mt-20"
        >
          {/* Desktop photo — right half; crop bias keeps handshake near the copy */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[54%] lg:block xl:w-[52%]"
            aria-hidden
          >
            <img
              src={handshakeImg}
              alt=""
              width={1536}
              height={1024}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.72) 5%, hsl(var(--background) / 0.28) 12%, transparent 22%)",
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-24"
              style={{
                background:
                  "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
              }}
            />
            {/* Dissolve fully to white before the next photo emerges */}
            <div
              className="absolute inset-x-0 bottom-0 h-[62%]"
              style={{
                background:
                  "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 18%, hsl(var(--background) / 0.85) 40%, hsl(var(--background) / 0.35) 68%, transparent 100%)",
              }}
            />
          </div>

          <div className="relative z-10 container py-16 sm:py-20 lg:py-24">
            <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-10 xl:gap-14 lg:items-center">
              <div className="max-w-xl space-y-7 sm:space-y-8 lg:max-w-none lg:w-full">
                <div className="space-y-4">
                  <SectionBadge
                    icon={Send}
                    className="border-primary/25 bg-primary/[0.06] text-primary"
                  >
                    When to send your link
                  </SectionBadge>
                  <DisplayHeading
                    as="h2"
                    className="text-2xl sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]"
                  >
                    Never miss an opportunity to build a new relationship.
                  </DisplayHeading>
                  <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
                    One link connects your partners with everything your
                    organization has to offer.
                  </p>
                </div>

                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {moments.map((moment, i) => {
                    const Icon = moment.icon;
                    return (
                      <li
                        key={moment.title}
                        className={cn(
                          momentsReveal.inView
                            ? "animate-fade-up"
                            : "opacity-100",
                        )}
                        style={
                          momentsReveal.inView
                            ? {
                                animationDelay: `${120 + i * 80}ms`,
                                animationFillMode: "forwards",
                              }
                            : undefined
                        }
                      >
                        <article
                          className={cn(
                            "h-full rounded-xl border border-border/40 bg-card/95 backdrop-blur-[2px]",
                            "px-3.5 py-2.5 sm:px-4 sm:py-3",
                            "shadow-[0_10px_28px_-16px_rgba(15,23,42,0.28)]",
                            "transition-[transform,box-shadow] duration-300",
                            "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.32)]",
                          )}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug">
                                {moment.title}
                              </h3>
                              <p className="mt-0.5 text-xs sm:text-[13px] text-muted-foreground leading-snug">
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

              <div className="hidden lg:block min-h-[22rem]" aria-hidden />
            </div>
          </div>
        </section>

        <section
          id="what-link-answers"
          className="relative scroll-mt-20 py-16 sm:py-20 lg:py-24"
        >
          <div className="container">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              {/* Product first on desktop; copy first on mobile */}
              <div className="order-2 lg:order-1 min-w-0">
                <LinkAnswersDesktopVisual />
              </div>

              <div className="order-1 lg:order-2 mx-auto w-full max-w-xl space-y-6 sm:space-y-7 lg:mx-0 lg:max-w-none">
                <div className="space-y-3.5 sm:space-y-4">
                  <SectionBadge
                    icon={ListChecks}
                    className="border-primary/25 bg-primary/[0.06] text-primary"
                  >
                    What your link answers
                  </SectionBadge>
                  <DisplayHeading
                    as="h2"
                    className="text-2xl sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]"
                  >
                    Everything your referral partners need
                  </DisplayHeading>
                  <p className="max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Case managers refer to the centers that make their jobs
                    easier. That all starts with having access to the most up to
                    date information about your program.
                  </p>
                </div>

                <LinkAnswersReveal />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
