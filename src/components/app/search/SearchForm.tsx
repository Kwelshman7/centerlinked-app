import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayerCombobox } from "@/components/app/facility/PayerCombobox";
import { LEVELS_OF_CARE } from "@/components/app/facility/facility-types";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

type SearchFormVariant = "page" | "inline";

function FieldLabel({
  step,
  title,
  hint,
  variant,
}: {
  step?: string;
  title: string;
  hint?: string;
  variant: SearchFormVariant;
}) {
  if (variant === "inline") {
    return <Label>{title}</Label>;
  }

  return (
    <div className="space-y-0.5">
      <p className="font-heading text-sm font-semibold flex items-center gap-2">
        {step ? (
          <span
            className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            aria-hidden
          >
            {step}
          </span>
        ) : null}
        {title}
      </p>
      {hint ? (
        <p className={cn("text-xs text-muted-foreground leading-snug", step && "pl-7")}>{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchForm({ variant = "page" }: { variant?: SearchFormVariant }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [payerId, setPayerId] = useState<string | null>(params.get("payerId"));
  const [payerName, setPayerName] = useState(params.get("payerName") ?? "");
  const [state, setState] = useState(params.get("state") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [loc, setLoc] = useState(params.get("loc") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (payerId) q.set("payerId", payerId);
    if (payerName) q.set("payerName", payerName);
    if (state) q.set("state", state);
    if (city) q.set("city", city);
    if (loc) q.set("loc", loc);
    navigate(`/app/search/results?${q.toString()}`);
  };

  const stateLabel = US_STATES.find((s) => s.code === state)?.name || state;
  const place = [city.trim(), stateLabel].filter(Boolean).join(", ");
  const summary = [payerName || "Any insurance", place || "Any location", loc || "Any level of care"].join(" · ");
  const isPage = variant === "page";
  const control = isPage ? "h-12 rounded-lg text-sm" : undefined;

  return (
    <form onSubmit={submit} className={cn(isPage ? "space-y-5 sm:space-y-6" : "space-y-4")}>
      <div
        className={cn(
          isPage
            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5"
            : "space-y-4",
        )}
      >
        <div className={cn("space-y-2 min-w-0", isPage && "xl:col-span-4", !isPage && "space-y-1.5")}>
          <FieldLabel
            step="1"
            title="Insurance"
            hint="The plan that has to be in-network."
            variant={variant}
          />
          <PayerCombobox
            payerId={payerId}
            payerName={payerName}
            onSelect={(p) => {
              setPayerId(p.id);
              setPayerName(p.name);
            }}
            placeholder="Any insurance"
            triggerClassName={cn("w-full font-normal", control)}
            approvedOnly
          />
        </div>

        <div className={cn("space-y-2 min-w-0", isPage && "xl:col-span-3", !isPage && "space-y-1.5")}>
          <FieldLabel
            step="2"
            title="State"
            hint="Narrow to a state — or leave open."
            variant={variant}
          />
          <Select value={state || "_any"} onValueChange={(v) => setState(v === "_any" ? "" : v)}>
            <SelectTrigger className={control}>
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="_any">Any state</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn("space-y-2 min-w-0", isPage && "xl:col-span-2", !isPage && "space-y-1.5")}>
          <FieldLabel
            title="City"
            hint="Only if they need a nearby campus."
            variant={variant}
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Any city"
            className={control}
          />
        </div>

        <div className={cn("space-y-2 min-w-0", isPage && "xl:col-span-3", !isPage && "space-y-1.5")}>
          <FieldLabel
            step="3"
            title="Level of care"
            hint="Detox through outpatient — or any."
            variant={variant}
          />
          <Select value={loc || "_any"} onValueChange={(v) => setLoc(v === "_any" ? "" : v)}>
            <SelectTrigger className={control}>
              <SelectValue placeholder="Any level of care" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_any">Any level of care</SelectItem>
              {LEVELS_OF_CARE.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={cn(
          isPage
            ? "flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1 border-t border-border/60 sm:border-0 sm:pt-0"
            : undefined,
        )}
      >
        {isPage ? (
          <p className="text-xs sm:text-sm text-muted-foreground flex-1 text-center sm:text-left min-w-0">
            Ready: <span className="font-medium text-foreground">{summary}</span>
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          variant={isPage ? "hero" : "default"}
          className={cn(
            "w-full",
            isPage && "sm:w-auto sm:min-w-[17.5rem] sm:h-14 rounded-xl text-base shrink-0",
          )}
        >
          <SearchIcon className="h-4 w-4" /> Search verified facilities
        </Button>
      </div>
    </form>
  );
}
