import { cn } from "@/lib/utils";

interface Props {
  levels: string[];
  selected: string;
  onSelect: (level: string) => void;
  /** Optional brand color for the active tab. Falls back to primary. */
  brand?: string;
  className?: string;
}

/** Pill tabs to filter facilities by level of care. Hidden when ≤1 unique level. */
export function OrgLocFilter({ levels, selected, onSelect, brand, className }: Props) {
  if (levels.length <= 1) return null;

  const tabs = ["all", ...levels];

  return (
    <div className={cn("overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1", className)}>
      <div
        role="tablist"
        aria-label="Filter facilities by level of care"
        className="inline-flex items-center gap-1.5 min-w-max sm:flex-wrap"
      >
        {tabs.map((value) => {
          const active = selected === value;
          const label = value === "all" ? "All Levels of Care" : value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(value)}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium tracking-normal transition-colors",
                "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                active
                  ? brand
                    ? "text-white border-transparent shadow-sm"
                    : "bg-primary text-primary-foreground border-transparent shadow-sm"
                  : "bg-card text-foreground/70 border-border/60 hover:text-foreground hover:border-border",
              )}
              style={active && brand ? { backgroundColor: brand } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
