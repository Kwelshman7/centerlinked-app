const audiences = [
  "Detox",
  "Residential",
  "PHP / IOP",
  "Dual Diagnosis",
  "Mental Health",
  "Multi-Location Networks",
  "BD Teams",
  "Admissions",
];

export function WhoFor() {
  return (
    <section className="py-14 sm:py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Who It's For
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Built for organizations that grow through{" "}
            <span className="text-primary">professional referrals.</span>
          </h2>
        </div>

        <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto px-1">
          {audiences.map((a) => (
            <span
              key={a}
              className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-card border border-border text-xs sm:text-sm font-semibold text-foreground shadow-sm"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
