/**
 * Mobile mock of /app/facilities/:id/verify — mirrors VerifyContracts.tsx layout.
 */
import { ArrowLeft, CheckCircle2, Pencil, Shield, Clock, BadgeCheck } from "lucide-react";
import { FEATURED_FACILITY } from "./banyanDemoData";
import { cn } from "@/lib/utils";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

export function VerifyContractsPreview({
  phase = "review",
  highlightConfirm = false,
}: {
  phase?: "review" | "success";
  highlightConfirm?: boolean;
}) {
  const verified = phase === "success";

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-background text-foreground select-none pointer-events-none">
      {/* App shell header — matches AppLayout mobile top bar */}
      <header className="shrink-0 h-10 border-b border-border/60 bg-card/95 backdrop-blur-xl flex items-center justify-center px-3">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-3.5 w-auto object-contain"
          draggable={false}
        />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-4 space-y-4 pb-20">
        <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to facility
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-[17px] font-bold leading-tight tracking-tight">
              Verify contracts
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-semibold text-[9px] px-2 py-0.5",
                verified
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-amber-500/15 text-amber-700 border-amber-500/30",
              )}
            >
              {verified ? (
                <>
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Due
                </>
              )}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {FEATURED_FACILITY.name} · {FEATURED_FACILITY.location}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {verified ? "Last verified today." : "Last verified 32 days ago."}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <h2 className="font-semibold text-[12px]">In-network insurance</h2>
              <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full tabular-nums">
                {FEATURED_FACILITY.payers.length}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-background text-[9px] font-semibold shrink-0">
              <Pencil className="h-3 w-3" />
              Edit list
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FEATURED_FACILITY.payers.map((p) => (
              <span
                key={p}
                className="inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 shadow-sm">
          <p className="text-[11px] font-medium">Notes (optional)</p>
          <div className="min-h-[3.25rem] rounded-md border border-border/70 bg-background px-2.5 py-2 text-[10px] text-muted-foreground/70">
            Anything an admin should know about this verification…
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <div
            data-demo-confirm
            className={cn(
              "h-11 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200",
              highlightConfirm && "ring-2 ring-primary/45 scale-[0.985]",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            All contracts are accurate
          </div>
          <div className="h-11 rounded-lg border border-border bg-background text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Save edits & verify
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground text-center leading-relaxed px-1">
          Verifying resets the 30-day freshness clock and keeps your facility visible in search.
        </p>
      </div>

      {/* Success toast — matches sonner-style feedback after confirm */}
      {verified && (
        <div className="absolute inset-x-3 top-12 z-20 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg flex items-center gap-2 animate-fade-up">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <p className="text-[11px] font-semibold text-foreground">Contracts confirmed accurate</p>
        </div>
      )}

      {/* App shell bottom tabs — matches AppLayout mobile nav height */}
      <nav className="absolute inset-x-0 bottom-0 z-10 h-14 border-t border-border/60 bg-card/95 backdrop-blur-xl grid grid-cols-4">
        {["Home", "Search", "Network", "Settings"].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-0.5 text-[8px] font-medium text-muted-foreground"
          >
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            {label}
          </div>
        ))}
      </nav>
    </div>
  );
}
