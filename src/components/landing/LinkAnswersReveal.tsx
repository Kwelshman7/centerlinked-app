import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** One highlighted word per statement; revealed on scroll. */
const phrases: { before: string; highlight: string; after?: string }[] = [
  { before: "Who you", highlight: "are" },
  { before: "What you", highlight: "offer" },
  { before: "Who you", highlight: "help" },
  { before: "Where you're", highlight: "located" },
  { before: "Who you're", highlight: "in-network", after: "with" },
  { before: "How to", highlight: "contact", after: "you" },
];

function Statement({
  before,
  highlight,
  after,
  index,
}: {
  before: string;
  highlight: string;
  after?: string;
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={cn(
        "flex flex-col items-center text-center transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
      style={{ transitionDelay: visible ? `${(index % 2) * 80}ms` : "0ms" }}
    >
      <span
        className={cn(
          "mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-500 ease-out",
          visible ? "scale-100" : "scale-75",
        )}
        aria-hidden
      >
        <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.75]" />
      </span>

      <p
        className={cn(
          "font-display text-2xl sm:text-3xl lg:text-[2.05rem] tracking-tight leading-snug",
          "text-foreground text-balance",
        )}
      >
        <span>{before} </span>
        <span className="text-primary font-semibold">{highlight}</span>
        {after ? <span> {after}</span> : null}
      </p>
    </li>
  );
}

export function LinkAnswersReveal({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-10 sm:gap-y-12 md:gap-y-14",
        "justify-items-center",
        className,
      )}
    >
      {phrases.map((phrase, index) => (
        <Statement key={`${phrase.before}-${phrase.highlight}`} index={index} {...phrase} />
      ))}
    </ul>
  );
}
