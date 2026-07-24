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

      {/* Mobile: top-aligned under header. Desktop: open height, centered. */}
      <div className="relative z-10 flex flex-col min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] lg:min-h-0 pt-6 sm:pt-8 lg:pt-12 pb-4 sm:pb-8 lg:pb-14">
        <div className="container flex flex-1 flex-col justify-start lg:justify-center">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:items-center">
            <div className="flex flex-col gap-4 sm:gap-7 lg:gap-0 max-w-xl w-full mx-auto lg:mx-0 text-center lg:text-left items-center lg:items-start">
              <div className="space-y-2.5 sm:space-y-5 animate-fade-up w-full">
                <p className="font-sans text-[11px] sm:text-sm font-semibold tracking-[0.12em] uppercase text-primary">
                  Built for behavioral health business development
                </p>
                <DisplayHeading as="h1" className="text-center lg:text-left text-[2.05rem] sm:text-5xl">
                  Your Treatment Center Needs a{" "}
                  <DisplayAccent>Referral Link.</DisplayAccent>
                </DisplayHeading>

                <p className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {heroSubheader}
                </p>
              </div>

              {/* Mobile: 3 across → lines into CenterLinked logo */}
              <div className="lg:hidden w-full">
                <ReplaceIntoLogo />
              </div>

              <div
                className="animate-fade-up w-full flex flex-col gap-3 sm:gap-5 items-center lg:items-start lg:mt-7"
                style={{ animationDelay: "100ms" }}
              >
                <Button asChild variant="hero" size="xl" className="group w-full sm:w-auto">
                  <Link to="/request-access">
                    Create Your Organization Profile
                    <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>

                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2.5 max-w-md w-full text-left">
                  {helperItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-base text-foreground font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="animate-slide-in-right relative hidden lg:flex justify-end">
              <HeroPhone />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile phone — below the fold */}
      <div className="relative z-10 lg:hidden flex justify-center px-4 pb-10 pt-1">
        <HeroPhone className="w-[240px] sm:w-[270px]" />
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
      <div className="absolute -inset-16 bg-primary/8 blur-[80px] rounded-full opacity-70" />
      <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full opacity-60" />
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[70%] h-20 bg-foreground/5 blur-2xl rounded-full" />
      <PhoneFrame className={cn("w-[260px] sm:w-[290px] lg:w-[300px] animate-float", className)}>
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    </div>
  );
}
