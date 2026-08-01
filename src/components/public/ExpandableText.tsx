import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  brand: string;
  /** Collapsed line count before Read more. */
  clampLines?: 3 | 4;
  className?: string;
  /** Static preview — always shows collapsed + Read more, not interactive. */
  preview?: boolean;
}

/** Truncated body copy with a brand-colored Read more / Show less control. */
export function ExpandableText({
  text,
  brand,
  clampLines = 4,
  className,
  preview = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = preview || text.length > 180 || text.split("\n").length > clampLines;
  const clamped = !expanded && needsToggle;

  return (
    <div className={className}>
      <p
        className={cn(
          "text-sm leading-relaxed whitespace-pre-line text-foreground/80 break-words",
          clamped && (clampLines === 3 ? "line-clamp-3 print:line-clamp-none" : "line-clamp-4 print:line-clamp-none"),
        )}
      >
        {text}
      </p>
      {needsToggle && (
        <button
          type="button"
          tabIndex={preview ? -1 : undefined}
          onClick={preview ? undefined : () => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold hover:underline print:hidden"
          style={{ color: brand }}
          aria-hidden={preview || undefined}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
