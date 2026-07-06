import { Globe2, Database, Sparkles } from "lucide-react";

export function Positioning() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Where CenterLinked fits
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            It's not a directory. It's not a CRM.{" "}
            <span className="text-primary">It's the thing that was missing.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Patient directories help families search for treatment online. CRMs help your team track contacts internally. Neither one helps your referral partners understand who you are and how to send you a client.
          </p>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-4 sm:gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm h-full">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
              <Globe2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">Public directories</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Built for patients and families searching online for treatment options. Not built for professional referral relationships.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm h-full">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">Internal CRMs</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Help your team track contacts, outreach, and pipeline inside your organization. They don't help your partners understand who you are.
            </p>
          </div>

          <div className="relative p-6 rounded-2xl border-2 border-primary/40 bg-card shadow-md h-full">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
              Built for this
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 mt-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">CenterLinked</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A professional referral-facing profile your partners can actually use when they have a client to place. Built for the people who call you, not the people who google you.
            </p>
          </div>
        </div>

        <div className="mt-12 sm:mt-14 mx-auto max-w-3xl relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/30 to-primary/10 p-6 sm:p-10 text-center">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <p className="relative font-heading text-lg sm:text-2xl font-bold text-foreground leading-snug">
            Your CRM helps you remember your referral partners.
          </p>
          <p className="relative mt-2 font-heading text-lg sm:text-2xl font-bold text-primary leading-snug">
            CenterLinked helps your referral partners remember you.
          </p>
        </div>
      </div>
    </section>
  );
}
