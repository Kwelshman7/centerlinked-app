import { SearchForm } from "@/components/app/search/SearchForm";

const TRUST = [
  "Approved programs only",
  "Leave any filter on Any",
  "Monthly verification",
] as const;

export default function Search() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 inset-x-0 h-64 rounded-[2.5rem] bg-hero-gradient opacity-80"
      />

      <div className="relative space-y-5 sm:space-y-7">
        <header className="space-y-2 sm:space-y-3">
          <p className="text-[11px] sm:text-xs font-heading font-semibold uppercase tracking-[0.18em] text-primary">
            Referral search
          </p>
          <h1 className="font-heading text-[1.7rem] leading-[1.12] sm:text-4xl lg:text-[2.55rem] font-extrabold tracking-tight">
            Find who is in-network
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Set the insurance, place, and level of care. Every result is an approved,
            non-frozen program with a current contract.
          </p>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/[0.07]">
          <div aria-hidden className="h-1.5 w-full bg-bar-gradient" />
          <div className="p-4 sm:p-6 lg:p-8">
            <SearchForm variant="page" />
          </div>
        </section>

        <ul className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {TRUST.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[11px] sm:text-xs font-medium text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
