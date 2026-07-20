/**
 * Mobile mock of the facility detail page (/app/facilities/:id).
 * Stacked layout for the org-dashboard interactive demo on small screens.
 */
import {
  MapPin,
  Calendar,
  Building2,
  Award,
  Clock,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  Pencil,
  ExternalLink,
} from "lucide-react";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";
import { BANYAN_DEMO, FEATURED_FACILITY } from "./banyanDemoData";

export function FacilityManageMobilePreview() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/30 text-foreground select-none pointer-events-none">
      <div className="px-2.5 py-2 border-b border-border/60 shrink-0 flex items-center justify-between gap-2 min-w-0 bg-card">
        <img
          src={centerlinkedLogo}
          alt="CenterLinked"
          className="h-3.5 w-auto max-w-[45%] object-contain object-left"
          draggable={false}
        />
        <div className="flex items-center gap-1 shrink-0">
          <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md border border-border bg-background text-[7px] font-semibold whitespace-nowrap">
            <ExternalLink className="h-2 w-2 shrink-0" aria-hidden />
            Org
          </span>
          <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md border border-border bg-background text-[7px] font-semibold whitespace-nowrap">
            <Pencil className="h-2 w-2 shrink-0" aria-hidden />
            Edit
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 space-y-2">
        <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
            <img
              src={FEATURED_FACILITY.gallery[0]}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5 bg-card border-t border-border/60">
            {FEATURED_FACILITY.gallery.map((src, i) => (
              <div
                key={i}
                className={`h-7 w-7 shrink-0 rounded-md overflow-hidden border ${
                  i === 0 ? "border-primary ring-1 ring-primary/30" : "border-border/60 opacity-85"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
            ))}
          </div>

          <div className="p-2.5 space-y-2 border-t border-border/50">
            <div>
              <h1 className="font-heading text-[12px] font-bold tracking-tight leading-tight">
                {FEATURED_FACILITY.name}
              </h1>
              <p className="mt-0.5 text-[8px] text-muted-foreground inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                {FEATURED_FACILITY.location}
              </p>
            </div>
            <p className="text-[8px] text-foreground/80 leading-snug">{FEATURED_FACILITY.description}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <Meta icon={Calendar} label="Founded" value={FEATURED_FACILITY.founded} />
              <Meta icon={Building2} label="Type" value={FEATURED_FACILITY.facilityType} />
              <Meta icon={Award} label="Accreditation" value={FEATURED_FACILITY.accreditation} />
              <Meta icon={Clock} label="Updated" value={FEATURED_FACILITY.lastUpdated} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-card shadow-sm p-2.5 space-y-2">
          <div>
            <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
              In-Network Contracts
            </p>
            <div className="flex flex-wrap gap-1">
              {FEATURED_FACILITY.payers.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[7px] font-semibold"
                >
                  <ShieldCheck className="h-2 w-2 text-primary shrink-0" />
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
              Levels of Care
            </p>
            <div className="flex flex-wrap gap-1">
              {FEATURED_FACILITY.levels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[7px] font-semibold"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
              Program Details
            </p>
            <ul className="space-y-0.5">
              {FEATURED_FACILITY.features.map((item) => (
                <li key={item} className="flex items-start gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-[7.5px] text-foreground/85 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
              What We Treat
            </p>
            <div className="flex flex-wrap gap-1">
              {FEATURED_FACILITY.treat.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded-md border border-border bg-background text-[7px] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-card shadow-sm p-2.5">
          <p className="text-[7.5px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
            For Referrals
          </p>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground text-[8px] font-bold shrink-0">
              {BANYAN_DEMO.userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold truncate leading-tight">{BANYAN_DEMO.userFullName}</p>
              <p className="text-[7px] text-muted-foreground truncate">{BANYAN_DEMO.userTitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="h-6 rounded-md bg-primary text-primary-foreground text-[7px] font-semibold inline-flex items-center justify-center gap-0.5">
              <Mail className="h-2.5 w-2.5" /> Email
            </span>
            <span className="h-6 rounded-md border border-border bg-background text-[7px] font-semibold inline-flex items-center justify-center gap-0.5">
              <MessageSquare className="h-2.5 w-2.5" /> Text
            </span>
            <span className="h-6 rounded-md border border-border bg-background text-[7px] font-semibold inline-flex items-center justify-center gap-0.5">
              <Phone className="h-2.5 w-2.5" /> Call
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[6.5px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-0.5">
        <Icon className="h-2 w-2 text-primary" /> {label}
      </p>
      <p className="text-[8px] font-semibold truncate">{value}</p>
    </div>
  );
}
