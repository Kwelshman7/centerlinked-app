import { Checkbox } from "@/components/ui/checkbox";
import { PLAN_TYPE_HELPER, sanitizePlanTypes } from "@/lib/plan-types";
import { cn } from "@/lib/utils";
import { getPlanTypeById } from "@/lib/insurance-plan-types-catalog";

interface Props {
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  disabled?: boolean;
  showHelper?: boolean;
  /**
   * Allowed plan type IDs for this payer.
   * When provided, only these plan types are shown.
   * When null/undefined, shows legacy hardcoded list.
   */
  allowedPlanTypeIds?: string[] | null;
}

export function PlanTypeChecklist({
  value,
  onChange,
  disabled,
  showHelper = true,
  allowedPlanTypeIds,
}: Props) {
  const selected = sanitizePlanTypes(value);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  // Build display list from catalog if allowedPlanTypeIds provided
  const displayItems = allowedPlanTypeIds
    ? allowedPlanTypeIds
        .map((id) => {
          const pt = getPlanTypeById(id);
          return pt ? { id: pt.id, label: pt.label } : null;
        })
        .filter((item): item is { id: string; label: string } => item !== null)
    : // Legacy fallback: use hardcoded PLAN_TYPES (will be deprecated)
      [];

  if (displayItems.length === 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          No plan types available for this payer. Check payer selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {showHelper ? (
        <p className="text-[11px] text-muted-foreground leading-snug">{PLAN_TYPE_HELPER}</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {displayItems.map((item) => {
          const on = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1 text-xs cursor-pointer",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={on}
                disabled={disabled}
                onCheckedChange={() => toggle(item.id)}
                aria-label={item.label}
              />
              <span className="leading-snug">{item.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
