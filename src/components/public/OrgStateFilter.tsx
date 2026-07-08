import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

interface Props {
  states: string[];
  selected: string;
  onSelect: (state: string) => void;
  brand: string;
}

function stateLabel(code: string) {
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

export function OrgStateFilter({ states, selected, onSelect, brand }: Props) {
  if (states.length <= 1) return null;

  const tabs = ["all", ...states];

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      <div
        role="tablist"
        aria-label="Filter facilities by state"
        className="inline-flex items-center gap-1.5 min-w-max sm:flex-wrap"
      >
        {tabs.map((value) => {
          const active = selected === value;
          const label = value === "all" ? "All Locations" : stateLabel(value);
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(value)}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                active
                  ? "text-white border-transparent shadow-sm"
                  : "bg-card text-foreground/70 border-border/60 hover:text-foreground hover:border-border",
              )}
              style={active ? { backgroundColor: brand } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
