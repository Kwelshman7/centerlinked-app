/**
 * Mobile mock of /app/facilities/:id/verify — monthly contract verification.
 */
import { ArrowLeft, CheckCircle2, Pencil, Shield, BadgeCheck, Clock } from "lucide-react";
import { FEATURED_FACILITY } from "./banyanDemoData";
import { cn } from "@/lib/utils";

export function VerifyContractsPreview({
  phase = "verify",
  highlightConfirm = false,
}: {
  phase?: "reminder" | "verify" | "success";
  highlightConfirm?: boolean;
}) {
  const verified = phase === "success";

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-background text-foreground select-none pointer-events-none">
      {phase === "reminder" && (
        <div className="shrink-0 mx-2.5 mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-foreground leading-tight">Monthly verification due</p>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 leading-snug">
              Confirm your in-network contracts are still accurate.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-2.5 space-y-2.5">
        <div className="inline-flex items-center gap-1 text-[8.5px] text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to facility
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="font-heading text-[13px] font-bold leading-tight">Verify contracts</h1>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full border font-semibold text-[7.5px] px-1.5 py-0.5",
                verified
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-amber-500/15 text-amber-700 border-amber-500/30",
              )}
            >
              {verified ? (
                <>
                  <BadgeCheck className="h-2.5 w-2.5" /> Verified
                </>
              ) : (
                <>
                  <Clock className="h-2.5 w-2.5" /> Due
                </>
              )}
            </span>
          </div>
          <p className="text-[8.5px] text-muted-foreground mt-0.5">
            {FEATURED_FACILITY.name} · {FEATURED_FACILITY.location}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-2.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <h2 className="font-semibold text-[10px]">In-network insurance</h2>
              <span className="text-[7px] font-bold bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
                {FEATURED_FACILITY.payers.length}
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md border border-border text-[7px] font-semibold shrink-0">
              <Pencil className="h-2 w-2" /> Edit
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {FEATURED_FACILITY.payers.slice(0, 4).map((p) => (
              <span
                key={p}
                className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[7.5px] font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          <div
            data-demo-confirm
            className={cn(
              "h-8 rounded-lg bg-primary text-primary-foreground text-[8.5px] font-semibold inline-flex items-center justify-center gap-1 shadow-sm transition-all duration-200",
              highlightConfirm && "ring-2 ring-primary/40 scale-[0.98]",
              verified && "opacity-80",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            All contracts are accurate
          </div>
          <div className="h-8 rounded-lg border border-border bg-background text-[8.5px] font-semibold inline-flex items-center justify-center gap-1 text-muted-foreground">
            <Pencil className="h-3 w-3" />
            Save edits & verify
          </div>
        </div>

        <p className="text-[7px] text-muted-foreground text-center leading-snug px-1">
          Verifying resets the 30-day freshness clock and keeps your facility visible in search.
        </p>
      </div>

      {verified && (
        <div className="absolute inset-x-3 bottom-14 z-20 rounded-xl border border-success/30 bg-success/10 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-foreground">Contracts confirmed accurate</p>
            <p className="text-[7.5px] text-muted-foreground">Live profile updated instantly</p>
          </div>
        </div>
      )}
    </div>
  );
}
