import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import northbendCover from "@/assets/northbend-cover.jpg";
import logoNorthbend from "@/assets/logo-northbend.png";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

/** Partner-facing mock — matches the live facility sheet partners open from a shared link. */
export function PartnerProfilePreviewContent() {
  const brand = "#1A73E8";

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-3.5 pt-1 pb-2 flex items-center justify-between border-b border-border bg-background shrink-0">
        <img src={centerlinkedLogo} alt="CenterLinked" className="h-3.5 w-auto object-contain" draggable={false} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="rounded-b-xl border-x border-b border-border/60 bg-card shadow-sm overflow-hidden mx-2 mt-2">
          <div className="relative h-[72px] overflow-hidden bg-muted">
            <img
              src={northbendCover}
              alt="Northbend Detox Center"
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.12] brightness-[0.94]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
            <div className="absolute top-2 left-2 h-7 w-7 rounded-md bg-white/95 shadow grid place-items-center p-0.5">
              <img src={logoNorthbend} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <h3 className="font-heading text-[11px] font-bold text-white leading-tight">Northbend Detox Center</h3>
              <p className="text-[8px] text-white/95 inline-flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5 shrink-0" /> Asheville, NC 28801
              </p>
            </div>
          </div>
        </section>

        <section className="mx-2 mt-2 rounded-xl border border-border/60 bg-card p-2.5">
          <h4 className="font-heading text-[10px] font-bold mb-2">In-Network Contracts</h4>
          <div className="flex flex-wrap gap-1">
            {["Aetna PPO", "Cigna PPO", "BCBS", "United"].map((payer) => (
              <span
                key={payer}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-1 text-[8px] font-semibold"
              >
                <ShieldCheck className="h-2.5 w-2.5 text-success shrink-0" />
                {payer}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-2 mt-2 rounded-xl border border-border/60 bg-card p-2.5">
          <h4 className="font-heading text-[10px] font-bold mb-2">Program Details</h4>
          <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 underline underline-offset-2">
            Programs
          </p>
          <div className="flex flex-wrap gap-1">
            {["Detox", "Residential", "PHP"].map((loc) => (
              <span
                key={loc}
                className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{ backgroundColor: `${brand}14`, color: brand }}
              >
                {loc}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-2 mt-2 mb-3 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="px-2.5 py-2 border-b border-border/60" style={{ backgroundColor: `${brand}14` }}>
            <p className="text-[8px] uppercase tracking-wider font-bold" style={{ color: brand }}>
              For Referrals
            </p>
          </div>
          <div className="p-2.5">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-full grid place-items-center text-[9px] font-bold shrink-0 border"
                style={{ backgroundColor: `${brand}14`, color: brand, borderColor: `${brand}30` }}
              >
                EM
              </div>
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold truncate">Elena Martinez</p>
                <p className="text-[8px] text-muted-foreground">BD Representative</p>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div
                className="h-7 rounded-md text-[8.5px] font-semibold text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: brand }}
              >
                <Mail className="h-3 w-3" /> Email
              </div>
              <div className="h-7 rounded-md border border-border text-[8.5px] font-semibold flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" /> Text
              </div>
              <div className="h-7 rounded-md border border-border text-[8.5px] font-semibold flex items-center justify-center gap-1">
                <Phone className="h-3 w-3" /> Call
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
