import { Globe2, Database, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Positioning() {
  return (
    <section className="py-14 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Not a Directory. Not a CRM.
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            It's the missing piece between{" "}
            <span className="text-primary">finding you</span> and{" "}
            <span className="text-primary">referring to you.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Public directories help families search online. CRMs help your team track outreach.
            Neither gives professional referral partners a live, verified profile they can trust
            when a client needs a placement today.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-3 sm:gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Globe2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">Public directories</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Built for consumer search — not for a discharge planner verifying insurance and
              calling the right BD rep in under a minute.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">Internal CRMs</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Essential for your pipeline. They don't help partners remember your programs,
              payers, or who to call when you're not in the room.
            </p>
          </div>

          <div className="relative p-5 sm:p-6 rounded-2xl border-2 border-primary/40 bg-card shadow-md">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
              Built for this
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 mt-1">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">Live referral profile</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              One shareable link for clinicians and discharge planners — always current, always
              actionable, owned by your organization.
            </p>
          </div>
        </div>

        <blockquote className="mt-10 sm:mt-12 mx-auto max-w-2xl text-center px-4">
          <p className="font-heading text-lg sm:text-xl font-semibold text-foreground leading-snug tracking-tight">
            Your CRM helps you remember your partners.{" "}
            <span className="text-primary">CenterLinked helps your partners remember you.</span>
          </p>
        </blockquote>

        <div className="mt-10 text-center">
          <Button asChild variant="hero" size="lg" className="group">
            <Link to="/request-access">
              Create Your Free Profile
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
