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
      <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      {/*
        Desktop: modest top inset (not viewport-centered) so copy + phone read as one
        composition above the fold. Phone scale is capped so a laptop viewport fits both.
        Mobile: content-sized stack with even beats.
      */}
      <div className="relative z-10 px-0 pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-8 lg:pb-12 xl:pt-10 xl:pb-14">
        <div className="container w-full">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center lg:flex-row lg:items-start lg:justify-between gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
            {/* Copy column */}
            <div className="flex w-full max-w-xl flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[30rem] xl:max-w-[32rem] lg:pt-3 xl:pt-4">
              <div className="animate-fade-up w-full space-y-3 sm:space-y-3.5 lg:space-y-4">
                <p className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-primary">
                  Built for behavioral health business development
                </p>
                <DisplayHeading
                  as="h1"
                  className="text-center lg:text-left text-[1.9rem] leading-[1.12] sm:text-[2.6rem] sm:leading-[1.08] lg:text-[2.85rem] xl:text-[3.15rem] lg:leading-[1.06]"
                >
                  Your Treatment Center Needs a{" "}
                  <DisplayAccent>Referral Link.</DisplayAccent>
                </DisplayHeading>
                <p className="text-[15px] sm:text-base lg:text-[1.05rem] text-muted-foreground leading-relaxed max-w-md sm:max-w-lg mx-auto lg:mx-0">
                  {heroSubheader}
                </p>
              </div>

              {/* Mobile-only replace graphic — spaced as its own beat */}
              <div className="lg:hidden w-full mt-7 sm:mt-8">
                <ReplaceIntoLogo />
              </div>

              <div
                className="animate-fade-up w-full mt-6 sm:mt-7 lg:mt-8 flex flex-col items-center lg:items-start gap-4 sm:gap-5"
                style={{ animationDelay: "100ms" }}
              >
                <Button asChild variant="hero" size="xl" className="group w-full sm:w-auto min-h-12 px-7">
                  <Link to="/request-access">
                    Create Your Organization Profile
                    <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>

                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-5 sm:gap-y-2.5 max-w-sm sm:max-w-md w-full text-left">
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

            {/* Desktop mockup — top-aligned with copy so both sit above the fold */}
            <div className="animate-slide-in-right relative hidden lg:flex shrink-0 justify-center lg:pr-2 xl:pr-4">
              <HeroPhone />
            </div>
          </div>

          {/* Mobile mockup — clear separation from copy, never cramped under CTA */}
          <div className="lg:hidden mt-9 sm:mt-10 flex justify-center">
            <HeroPhone className="w-[220px] sm:w-[250px]" />
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
      <div className="absolute -inset-8 sm:-inset-10 lg:-inset-12 bg-primary/8 blur-[64px] rounded-full opacity-70" />
      <div className="absolute -inset-4 sm:-inset-6 bg-primary/10 blur-3xl rounded-full opacity-60" />
      <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-12 sm:h-14 bg-foreground/5 blur-2xl rounded-full" />
      <PhoneFrame
        className={cn(
          // Desktop width keeps phone height (~540–585px) inside a laptop viewport with copy.
          "w-[240px] sm:w-[260px] lg:w-[250px] xl:w-[270px] animate-float",
          className,
        )}
      >
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    </div>
  );
}
