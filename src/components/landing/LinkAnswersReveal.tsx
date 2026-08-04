import { useEffect, useRef, useState } from "react";
import {
  User,
  Heart,
  Users,
  MapPin,
  Shield,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const answers: {
  icon: LucideIcon;
  before: string;
  highlight: string;
  after?: string;
  body: string;
}[] = [
  {
    icon: User,
    before: "Who you",
    highlight: "are",
    body: "Share your story, mission, and what sets your program apart.",
  },
  {
    icon: Heart,
    before: "What you",
    highlight: "offer",
    body: "Highlight your levels of care, therapies, and specializations.",
  },
  {
    icon: Users,
    before: "Who you",
    highlight: "help",
    body: "Specify the populations you serve and the conditions you treat.",
  },
  {
    icon: MapPin,
    before: "Where you're",
    highlight: "located",
    body: "Provide your address, service areas, and nearby landmarks.",
  },
  {
    icon: Shield,
    before: "Who you're",
    highlight: "in-network",
    after: "with",
    body: "List your current in-network contracts.",
  },
  {
    icon: Phone,
    before: "How to",
    highlight: "contact",
    after: "you",
    body: "Include your BD contacts, phone numbers, and email addresses.",
  },
];

function AnswerCard({
  icon: Icon,
  before,
  highlight,
  after,
  body,
  index,
  inView,
}: {
  icon: LucideIcon;
  before: string;
  highlight: string;
  after?: string;
  body: string;
  index: number;
  inView: boolean;
}) {
  return (
    <li
      className={cn(
        "h-full opacity-0",
        inView && "animate-fade-up",
      )}
      style={
        inView
          ? {
              animationDelay: `${100 + index * 70}ms`,
              animationFillMode: "forwards",
            }
          : undefined
      }
    >
      <article
        className={cn(
          "flex h-full min-h-[6.75rem] flex-col rounded-xl border border-border/40 bg-card/95 backdrop-blur-[2px]",
          "px-3.5 py-3.5 sm:px-4 sm:py-4",
          "shadow-[0_10px_28px_-16px_rgba(15,23,42,0.28)]",
          "transition-[transform,box-shadow] duration-300",
          "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.32)]",
        )}
      >
        <div className="flex flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Icon className="h-[18px] w-[18px]" aria-hidden strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-display text-[15px] sm:text-base font-semibold text-foreground leading-snug tracking-tight">
              <span>{before} </span>
              <span className="text-primary">{highlight}</span>
              {after ? <span> {after}</span> : null}
            </h3>
            <p className="mt-1 text-xs sm:text-[13px] text-muted-foreground leading-snug">
              {body}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}

export function LinkAnswersReveal({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      <ul className="grid grid-cols-1 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-3.5">
        {answers.map((answer, index) => (
          <AnswerCard
            key={`${answer.before}-${answer.highlight}`}
            index={index}
            inView={inView}
            {...answer}
          />
        ))}
      </ul>
    </div>
  );
}
