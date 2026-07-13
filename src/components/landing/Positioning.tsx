import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const rows = [
  {
    area: "Program details",
    today: "Buried in PDFs and slide decks",
    withUs: "Live levels of care, always current",
  },
  {
    area: "Insurance",
    today: "Outdated payer lists partners can't trust",
    withUs: "Verified in-network coverage, updated in minutes",
  },
  {
    area: "BD & admissions contacts",
    today: "Business cards and old email signatures",
    withUs: "Direct phones and emails on one shareable profile",
  },
  {
    area: "Facility locations",
    today: "Scattered across websites and one-pagers",
    withUs: "Every facility under one organization link",
  },
  {
    area: "Partner confidence",
    today: "“Is this still accurate?”",
    withUs: "Verified monthly — accuracy is the product",
  },
];

export function Positioning() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="pointer-events-none absolute inset-0 landing-glow-center opacity-70" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={ArrowLeftRight}>The shift</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Imagine referral partners who never ask{" "}
            <DisplayAccent>whether your information is current.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            One organization profile replaces the stack of materials. Update once in your
            dashboard — every shared link stays accurate automatically.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.1fr_1.2fr_auto_1.2fr] gap-4 px-6 py-4 bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span>Area</span>
            <span>Today</span>
            <span className="w-8" aria-hidden />
            <span className="text-primary">With CenterLinked</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.area}
              className="grid grid-cols-[1.1fr_1.2fr_auto_1.2fr] gap-4 px-6 py-5 border-b border-border last:border-b-0 items-center"
            >
              <p className="font-semibold text-foreground text-sm">{row.area}</p>
              <p className="text-sm text-muted-foreground leading-snug">{row.today}</p>
              <ArrowRight className="h-4 w-4 text-primary/50 justify-self-center" aria-hidden />
              <p className="text-sm font-medium text-foreground leading-snug">{row.withUs}</p>
            </div>
          ))}
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-3 max-w-lg mx-auto">
          {rows.map((row) => (
            <div
              key={row.area}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                {row.area}
              </p>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Today
                </p>
                <p className="text-sm text-foreground/80 leading-snug">{row.today}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                  With CenterLinked
                </p>
                <p className="text-sm text-foreground leading-snug">{row.withUs}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="hero" size="lg" className="group rounded-full">
            <Link to="/request-access">
              Create Your Organization Profile
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
