import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OrgStateFilter } from "@/components/public/OrgStateFilter";
import { OrgLocFilter } from "@/components/public/OrgLocFilter";
import { stateDisplayName } from "@/lib/us-states";
import { cn } from "@/lib/utils";

interface Props {
  states: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
  levels: string[];
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  brand?: string;
  className?: string;
  /**
   * `button` — compact filter icon (mobile).
   * `pills` — horizontal location / LOC tabs (desktop).
   */
  mode: "button" | "pills";
  /** Static preview — button is non-interactive. */
  preview?: boolean;
}

/**
 * Facility filters for org public profiles.
 * Use `mode="button"` on mobile and `mode="pills"` from sm+.
 */
export function OrgFacilityFilters({
  states,
  selectedState,
  onStateChange,
  levels,
  selectedLevel,
  onLevelChange,
  brand,
  className,
  mode,
  preview = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasState = states.length > 1;
  const hasLoc = levels.length > 1;
  if (!hasState && !hasLoc) return null;

  const activeCount =
    (hasState && selectedState !== "all" ? 1 : 0) +
    (hasLoc && selectedLevel !== "all" ? 1 : 0);

  const clearAll = () => {
    onStateChange("all");
    onLevelChange("all");
  };

  if (mode === "pills") {
    return (
      <div className={cn("space-y-2", className)}>
        <OrgStateFilter
          states={states}
          selected={selectedState}
          onSelect={onStateChange}
          brand={brand}
        />
        <OrgLocFilter
          levels={levels}
          selected={selectedLevel}
          onSelect={onLevelChange}
          brand={brand}
        />
      </div>
    );
  }

  const button = (
    <button
      type="button"
      aria-label={activeCount > 0 ? `Filters (${activeCount} active)` : "Filter facilities"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground shadow-sm transition-colors",
        "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      )}
    </button>
  );

  if (preview) {
    return <div className={className}>{button}</div>;
  }

  return (
    <div className={className}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{button}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="font-heading text-lg">Filter facilities</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            {hasState && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </Label>
                <Select value={selectedState} onValueChange={onStateChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {states.map((code) => (
                      <SelectItem key={code} value={code}>
                        {stateDisplayName(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasLoc && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level of care
                </Label>
                <Select value={selectedLevel} onValueChange={onLevelChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All levels of care" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels of Care</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
