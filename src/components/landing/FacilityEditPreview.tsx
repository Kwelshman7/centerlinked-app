import { Loader2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import logoNorthbend from "@/assets/logo-northbend.png";

/** Internal app mock — matches Edit in-network contracts on a facility page. */
export function FacilityEditPreviewContent() {
  return (
    <div className="flex flex-col h-full bg-secondary/30 overflow-hidden">
      <div className="px-3.5 pt-2.5 pb-2 flex items-center justify-between border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-white border border-border flex items-center justify-center p-1 shrink-0">
            <img src={logoNorthbend} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-foreground truncate leading-tight">Northbend Detox Center</p>
            <p className="text-[8.5px] text-muted-foreground truncate">Asheville, NC</p>
          </div>
        </div>
        <img src={centerlinkedLogo} alt="CenterLinked" className="h-3 w-auto object-contain shrink-0" draggable={false} />
      </div>

      <div className="flex-1 overflow-hidden px-3.5 pt-3 pb-4">
        <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-3.5 pt-3.5 pb-2 border-b border-border/60 shrink-0">
            <p className="text-[11px] font-bold text-foreground">Edit in-network contracts</p>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 leading-snug">
              Add or remove insurance companies this facility is in-network with.
            </p>
          </div>

          <div className="px-3.5 py-3 space-y-3 flex-1 overflow-hidden">
            <div>
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Add an insurance company
              </p>
              <div className="h-8 rounded-md border border-border bg-background px-2.5 flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Search payers…</span>
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            <div className="min-h-0 flex-1 flex flex-col">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                In-network with (4)
              </p>
              <div className="space-y-1.5 overflow-hidden">
                {[
                  { name: "Aetna PPO", badge: null },
                  { name: "Cigna PPO", badge: "new" },
                  { name: "BCBS", badge: null },
                  { name: "United Healthcare", badge: null },
                ].map((payer) => (
                  <div
                    key={payer.name}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="flex-1 truncate text-[9.5px] font-medium">{payer.name}</span>
                    {payer.badge === "new" && (
                      <span className="text-[8px] font-semibold uppercase text-primary shrink-0">new</span>
                    )}
                    <Trash2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2.5 border-t border-border/60 flex items-center justify-end gap-2 shrink-0 bg-background">
            <span className="text-[9px] font-medium text-muted-foreground px-2 py-1">Cancel</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground text-[9px] font-semibold px-2.5 py-1.5">
              Save changes
            </span>
          </div>
        </div>
      </div>

      <div className="px-3.5 pb-2 shrink-0">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 flex items-center gap-2">
          <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
          <p className="text-[8.5px] text-muted-foreground leading-snug">
            Saving updates your live facility link instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
