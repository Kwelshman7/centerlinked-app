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

      {/* Shared handshake band — one image spanning both story sections */}
      <div
        ref={momentsReveal.ref}
        className="relative overflow-hidden bg-background"
      >
        {/* Full-height photo: behind content on mobile, right half on desktop */}
        <div
          className="pointer-events-none absolute inset-0 lg:left-[38%] xl:left-[36%]"
          aria-hidden
        >
          <img
            src={handshakeImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[68%_center] scale-[1.02]"
          />
          {/* Mobile: soft wash so cards stay readable */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--background) / 0.82) 0%, hsl(var(--background) / 0.64) 40%, hsl(var(--background) / 0.72) 70%, hsl(var(--background) / 0.88) 100%)",
            }}
          />
          {/* Desktop: blend photo into left content column */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.72) 10%, hsl(var(--background) / 0.28) 26%, transparent 46%)",
            }}
          />
          {/* Soft top / bottom edge blends into neighboring sections */}
          <div
            className="absolute inset-x-0 top-0 h-20 sm:h-28"
            style={{
              background:
                "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 sm:h-32"
            style={{
              background:
                "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Left content column spanning both sections */}
        <div className="relative z-10 mx-auto w-full max-w-xl px-4 sm:px-6 lg:mx-0 lg:ml-[max(1.5rem,calc((100%-1120px)/2))] lg:w-[min(100%,540px)] lg:max-w-none xl:ml-[max(2rem,calc((100%-1200px)/2))] xl:w-[560px]">
          {/* When to send */}
          <section
            id="when-to-send"
            className="scroll-mt-20 py-14 sm:py-16 lg:py-20"
          >
            <div className="space-y-8 sm:space-y-10">
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

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
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
                              animationDelay: `${120 + i * 80}ms`,
                              animationFillMode: "forwards",
                            }
                          : undefined
                      }
                    >
                      <article
                        className={cn(
                          "h-full rounded-xl border border-border/40 bg-card/95 backdrop-blur-[2px]",
                          "px-4 py-3.5 sm:px-4 sm:py-4",
                          "shadow-[0_10px_28px_-16px_rgba(15,23,42,0.28)]",
                          "transition-[transform,box-shadow] duration-300",
                          "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.32)]",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug">
                              {moment.title}
                            </h3>
                            <p className="mt-1 text-xs sm:text-[13px] text-muted-foreground leading-snug">
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

          {/* Soft mid-band blend between the two stories */}
          <div
            className="relative h-10 sm:h-12 lg:h-14"
            aria-hidden
          >
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, hsl(var(--border) / 0.7) 20%, hsl(var(--border) / 0.7) 80%, transparent 100%)",
              }}
            />
          </div>

          {/* What your link answers */}
          <section
            id="what-link-answers"
            className="scroll-mt-20 pb-16 pt-2 sm:pb-20 sm:pt-3 lg:pb-24 lg:pt-4"
          >
            <div className="space-y-7 sm:space-y-8">
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
          </section>
        </div>
      </div>
    </>
  );
}
