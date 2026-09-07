import { Checkbox } from "@/components/ui/checkbox";
import { PLAN_TYPE_HELPER, PLAN_TYPES, sanitizePlanTypes } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

interface Props {
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  disabled?: boolean;
  showHelper?: boolean;
}

export function PlanTypeChecklist({ value, onChange, disabled, showHelper = true }: Props) {
  const selected = sanitizePlanTypes(value);

  const toggle = (slug: string) => {
    onChange(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);
  };

  return (
    <div className="space-y-1.5">
      {showHelper ? (
        <p className="text-[11px] text-muted-foreground leading-snug">{PLAN_TYPE_HELPER}</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {PLAN_TYPES.map((pt) => {
          const on = selected.includes(pt.slug);
          return (
            <label
              key={pt.slug}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1 text-xs cursor-pointer",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={on}
                disabled={disabled}
                onCheckedChange={() => toggle(pt.slug)}
                aria-label={pt.label}
              />
              <span className="leading-snug">{pt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
