import { Logo } from "@/components/Logo";
import { SearchForm } from "@/components/app/search/SearchForm";

export default function Search() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-5 lg:-mt-8 -mb-[calc(5rem+env(safe-area-inset-bottom))] lg:-mb-10">
      <section className="relative flex min-h-[calc(100dvh-3rem)] items-center overflow-hidden bg-hero-gradient lg:min-h-dvh">
        <div className="pointer-events-none absolute inset-0 landing-glow" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-primary/[0.12] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[hsl(var(--primary-glow)/0.22)] blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="animate-fade-up flex w-full flex-col items-center text-center">
            <Logo to="" size="lg" className="mb-5 hidden sm:mb-7 sm:flex" />
            <h1 className="font-heading text-[1.35rem] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl sm:leading-[1.1]">
              Search the referral network
            </h1>
            <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm md:text-base">
              Find approved programs by insurance, location, and level of care.
            </p>
          </div>

          <div
            className="animate-fade-up mt-6 w-full sm:mt-10"
            style={{ animationDelay: "90ms" }}
          >
            <div className="rounded-2xl border border-border/70 bg-card/95 p-5 shadow-xl shadow-primary/[0.08] ring-1 ring-primary/5 backdrop-blur-sm sm:p-7 md:p-8">
              <SearchForm variant="hero" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
