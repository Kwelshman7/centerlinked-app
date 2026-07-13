import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const outcomes = [
  "One live profile replaces every PDF and brochure",
  "Partners always see current programs, payers, and contacts",
  "Your BD team shares one link — not another attachment",
];

export function Positioning() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-center">
          <div className="space-y-6 max-w-xl">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              The solution
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              One organization profile.{" "}
              <span className="text-primary">Always current.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              CenterLinked replaces static marketing materials with a live organization profile that
              stays accurate year-round — so referral professionals can identify the right program
              and reach the right person with confidence.
            </p>

            <ul className="space-y-3 pt-1">
              {outcomes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-[15px] text-foreground/90">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button asChild variant="hero" size="lg" className="group">
                <Link to="/request-access">
                  Create Your Organization Profile
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/40" />
            <div className="relative space-y-6">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                What changes for your team
              </p>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/80 bg-background/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Before
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Reprint brochures. Resend PDFs. Hope partners saved the latest version.
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      With CenterLinked
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Update once in your dashboard. Every shared link stays current automatically.
                    </p>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border pt-5">
                  Every profile includes the details professionals need to place patients
                  appropriately — levels of care, insurance, facilities, and direct referral contacts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
