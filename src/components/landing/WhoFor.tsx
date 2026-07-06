const audiences = [
  "Detox programs",
  "Residential treatment centers",
  "PHP programs",
  "IOP programs",
  "Mental health programs",
  "Dual diagnosis programs",
  "Eating disorder programs",
  "Sober living & recovery housing",
  "Alumni & aftercare teams",
  "Business development teams",
  "Admissions teams",
  "Multi-location treatment organizations",
];

export function WhoFor() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Who it's for
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Built for behavioral health organizations{" "}
            <span className="text-primary">that grow through referrals.</span>
          </h2>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            If your BD team drives your census, this is for you. Detox. Residential. PHP. IOP. Outpatient. Mental health. Dual diagnosis. Sober living. Multi-location networks. Single-site programs. If a referral partner's phone call keeps your beds full — CenterLinked is built for you.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto px-1">
          {audiences.map((a) => (
            <span
              key={a}
              className="inline-flex items-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card border border-border text-xs sm:text-sm font-semibold text-foreground shadow-sm hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 transition-all duration-200"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
