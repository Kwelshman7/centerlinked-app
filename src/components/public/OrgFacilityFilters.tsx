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
import { stateDisplayName } from "@/lib/us-states";
import { cn } from "@/lib/utils";

interface Props {
  states: string[];
  selectedState: string;
  onStateChange: (state: string) => void;
  levels: string[];
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  insurers: string[];
  selectedInsurance: string;
  onInsuranceChange: (insurance: string) => void;
  brand?: string;
  className?: string;
  /**
   * `button` — compact filter icon (mobile sheet).
   * `dropdowns` — Location / Level of Care / Insurance selects (desktop).
   */
  mode: "button" | "dropdowns";
  /** Static preview — button is non-interactive. */
  preview?: boolean;
}

/**
 * Facility filters for org public profiles.
 * Use `mode="button"` on mobile and `mode="dropdowns"` from sm+.
 */
export function OrgFacilityFilters({
  states,
  selectedState,
  onStateChange,
  levels,
  selectedLevel,
  onLevelChange,
  insurers,
  selectedInsurance,
  onInsuranceChange,
  className,
  mode,
  preview = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasState = states.length > 0;
  const hasLoc = levels.length > 0;
  const hasInsurance = insurers.length > 0;
  if (!hasState && !hasLoc && !hasInsurance) return null;

  const activeCount =
    (hasState && selectedState !== "all" ? 1 : 0) +
    (hasLoc && selectedLevel !== "all" ? 1 : 0) +
    (hasInsurance && selectedInsurance !== "all" ? 1 : 0);

  const clearAll = () => {
    onStateChange("all");
    onLevelChange("all");
    onInsuranceChange("all");
  };

  if (mode === "dropdowns") {
    return (
      <div className={cn("grid gap-2 sm:grid-cols-3 sm:gap-3", className)}>
        <FilterSelect
          label="Location"
          value={selectedState}
          onValueChange={onStateChange}
          allLabel="All Locations"
          options={states.map((code) => ({
            value: code,
            label: stateDisplayName(code),
          }))}
        />
        <FilterSelect
          label="Level of Care"
          value={selectedLevel}
          onValueChange={onLevelChange}
          allLabel="All Levels of Care"
          options={levels.map((level) => ({ value: level, label: level }))}
        />
        <FilterSelect
          label="Insurance"
          value={selectedInsurance}
          onValueChange={onInsuranceChange}
          allLabel="All Insurance"
          options={insurers.map((name) => ({ value: name, label: name }))}
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

            {hasInsurance && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Insurance
                </Label>
                <Select value={selectedInsurance} onValueChange={onInsuranceChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All insurance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Insurance</SelectItem>
                    {insurers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
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

function FilterSelect({
  label,
  value,
  onValueChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 bg-card">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
