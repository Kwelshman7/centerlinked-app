import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  IdCard,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./PhoneFrame";
import { OrgLogoCarousel } from "./OrgLogoCarousel";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import { PublicOrgSheetPreviewContent } from "./PublicOrgSheetPreview";
import centerlinkedLogo from "@/assets/centerlinked-logo-full.png";

/** Set to true to show partner logos under the hero. */
const SHOW_ORG_LOGO_CAROUSEL = false;

/** Simple tri-fold brochure glyph (lucide has no brochure icon). */
function TriFoldBrochureIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 5.5h5.5v13H4z" />
      <path d="M9.5 4h5v16h-5z" />
      <path d="M14.5 5.5H20v13h-5.5z" />
    </svg>
  );
}

const replaceItems: { icon: LucideIcon | typeof TriFoldBrochureIcon; label: string }[] = [
  { icon: FileText, label: "PDFs" },
  { icon: TriFoldBrochureIcon, label: "Brochures" },
  { icon: IdCard, label: "Business cards" },
];

const helperItems = [
  "Levels of care",
  "In-network insurance",
  "Locations",
  "Who to contact",
];

const heroSubheader =
  "Create a profile for your organization that tells referral partners exactly who you are, where you're located, what you treat, and what insurance you're currently in network with.";

/** Three items across → animated lines converge into the CenterLinked logo. */
function ReplaceIntoLogo() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2.5 text-center">
        Replace the outdated handoffs
      </p>

      <div className="relative">
        <ul className="grid grid-cols-3 gap-2">
          {replaceItems.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1.5 animate-fade-up"
              style={{ animationDelay: `${80 + i * 70}ms` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[11px] sm:text-xs font-display font-semibold tracking-tight text-foreground text-center leading-tight px-0.5">
                {label}
              </span>
            </li>
          ))}
        </ul>

        {/* Converging lines → logo */}
        <div className="relative h-[72px] mt-1" aria-hidden>
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 300 72"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M50 0 C50 28 150 28 150 72"
              className="animate-converge-line"
              stroke="hsl(var(--primary) / 0.45)"
              strokeWidth="1.75"
              strokeLinecap="round"
              style={{ animationDelay: "280ms" }}
            />
            <path
              d="M150 0 L150 72"
              className="animate-converge-line"
              stroke="hsl(var(--primary) / 0.55)"
              strokeWidth="1.75"
              strokeLinecap="round"
              style={{ animationDelay: "380ms" }}
            />
            <path
              d="M250 0 C250 28 150 28 150 72"
              className="animate-converge-line"
              stroke="hsl(var(--primary) / 0.45)"
              strokeWidth="1.75"
              strokeLinecap="round"
              style={{ animationDelay: "480ms" }}
            />
          </svg>
        </div>

        <div
          className="flex justify-center -mt-1 animate-logo-arrive"
          style={{ animationDelay: "820ms" }}
        >
          <div className="rounded-xl bg-background/90 border border-border/70 shadow-sm px-3.5 py-2 ring-1 ring-primary/10">
            <img
              src={centerlinkedLogo}
              alt="CenterLinked"
              className="h-6 w-auto object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0 landing-glow" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-32 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      {/*
        Hero spacing: content-sized (no forced viewport stretch), generous section
        padding, clear copy rhythm, and a stable gutter beside the mockup.
      */}
      <div className="relative z-10 px-0 pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-20 xl:pt-[4.5rem] xl:pb-24">
        <div className="container">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center lg:flex-row lg:items-center lg:justify-between gap-10 sm:gap-12 lg:gap-12 xl:gap-16">
            {/* Copy column */}
            <div className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[32rem] xl:max-w-[34rem]">
              <div className="animate-fade-up w-full space-y-4 sm:space-y-5">
                <p className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-primary">
                  Built for behavioral health business development
                </p>
                <DisplayHeading
                  as="h1"
                  className="text-center lg:text-left text-[1.9rem] leading-[1.12] sm:text-[2.75rem] sm:leading-[1.08] lg:text-[3.25rem] xl:text-[3.5rem]"
                >
                  Your Treatment Center Needs a{" "}
                  <DisplayAccent>Referral Link.</DisplayAccent>
                </DisplayHeading>
                <p className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-md sm:max-w-lg mx-auto lg:mx-0">
                  {heroSubheader}
                </p>
              </div>

              {/* Mobile-only replace graphic — spaced as its own beat */}
              <div className="lg:hidden w-full mt-8 sm:mt-10">
                <ReplaceIntoLogo />
              </div>

              <div
                className="animate-fade-up w-full mt-8 sm:mt-10 flex flex-col items-center lg:items-start gap-5 sm:gap-6"
                style={{ animationDelay: "100ms" }}
              >
                <Button asChild variant="hero" size="xl" className="group w-full sm:w-auto min-h-12 px-7">
                  <Link to="/request-access">
                    Create Your Organization Profile
                    <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>

                <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:gap-x-5 sm:gap-y-3 max-w-sm sm:max-w-md w-full text-left">
                  {helperItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm sm:text-[15px] text-foreground font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Desktop mockup */}
            <div className="animate-slide-in-right relative hidden lg:flex shrink-0 justify-center">
              <HeroPhone />
            </div>
          </div>

          {/* Mobile mockup — clear separation from copy, never cramped under CTA */}
          <div className="lg:hidden mt-10 sm:mt-12 flex justify-center">
            <HeroPhone className="w-[220px] sm:w-[260px]" />
          </div>
        </div>
      </div>

      {SHOW_ORG_LOGO_CAROUSEL ? (
        <OrgLogoCarousel className="relative z-10" />
      ) : null}
    </section>
  );
}

function HeroPhone({ className }: { className?: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-12 sm:-inset-16 bg-primary/8 blur-[80px] rounded-full opacity-70" />
      <div className="absolute -inset-6 sm:-inset-8 bg-primary/10 blur-3xl rounded-full opacity-60" />
      <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 w-[70%] h-16 sm:h-20 bg-foreground/5 blur-2xl rounded-full" />
      <PhoneFrame
        className={cn(
          "w-[260px] sm:w-[280px] lg:w-[300px] xl:w-[320px] animate-float",
          className,
        )}
      >
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    </div>
  );
}
