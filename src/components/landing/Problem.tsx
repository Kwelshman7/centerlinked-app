import { FileWarning, PhoneMissed, Clock3, RefreshCw, TrendingDown } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const decayStages = [
  { label: "Printed materials", intact: 100, lost: 0 },
  { label: "Partner inboxes", intact: 68, lost: 32 },
  { label: "Shared links & PDFs", intact: 41, lost: 27 },
  { label: "Accurate placement", intact: 22, lost: 19 },
];

const leaks = [
  {
    num: "01",
    eyebrow: "Leaks in materials",
    icon: FileWarning,
    title: "Stale brochures & PDFs",
    body: "Insurance, programs, and contacts change constantly. Printed materials and email attachments fall out of date within weeks.",
  },
  {
    num: "02",
    eyebrow: "Leaks in the handoff",
    icon: PhoneMissed,
    title: "Wrong numbers, wasted calls",
    body: "Partners call outdated admissions lines or chase coverage that no longer applies — while the right facility sits one update away.",
  },
  {
    num: "03",
    eyebrow: "Leaks in the timeline",
    icon: Clock3,
    title: "Delayed care",
    body: "Every round of phone tag and clarification adds days. Patients wait longer while teams hunt for accurate information.",
  },
  {
    num: "04",
    eyebrow: "Leaks in trust",
    icon: RefreshCw,
    title: "Partners stop relying on you",
    body: "When information is repeatedly wrong, referral partners stop opening your materials — and placement opportunities go elsewhere.",
  },
];

export function Problem() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 landing-glow-center" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-5 mb-12 sm:mb-16">
          <SectionBadge icon={TrendingDown}>Current state</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Outdated referral materials aren&apos;t a paperwork problem.{" "}
            <DisplayAccent>They&apos;re a placement problem.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Behavioral health organizations invest heavily in referral relationships — yet most
            placements still depend on brochures, PDFs, business cards, and email chains that
            go stale the moment something changes.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:items-start">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TrendingDown className="h-4 w-4" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Referral accuracy drain
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                −78% intact
              </span>
            </div>

            <div className="space-y-5">
              {decayStages.map((stage, i) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {stage.intact}% intact
                    </p>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-bar-gradient animate-bar-grow"
                      style={{
                        width: `${stage.intact}%`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  </div>
                  {stage.lost > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">−{stage.lost}% lost</p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 pt-5 border-t border-border text-sm text-muted-foreground leading-relaxed">
              By the time a partner needs to place, only a fraction of your original information
              is still accurate — and they often can&apos;t tell which part.
            </p>
          </div>

          <div className="divide-y divide-border">
            {leaks.map((leak) => (
              <div key={leak.num} className="flex gap-4 py-5 first:pt-0 last:pb-0 sm:gap-5">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold tabular-nums text-primary">{leak.num}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <leak.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                    {leak.eyebrow}
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl text-foreground leading-snug">
                    {leak.title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                    {leak.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
