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
      {/* Desktop stage wash — phone side is the visual plane */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-l from-primary/[0.09] via-primary/[0.035] to-transparent" />
        <div className="absolute right-[6%] top-[42%] h-[min(640px,72%)] w-[min(640px,78%)] -translate-y-1/2 rounded-full bg-primary/[0.14] blur-[100px]" />
      </div>
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl lg:hidden"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="container">
          <div
            className={cn(
              "mx-auto grid w-full max-w-6xl",
              "grid-cols-1 items-center gap-8 sm:gap-10",
              "pt-8 pb-12 sm:pt-10 sm:pb-14",
              "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 xl:gap-16",
              "lg:pt-12 lg:pb-16 xl:pt-14 xl:pb-20",
            )}
          >
            <div className="flex w-full max-w-xl flex-col items-center text-center lg:max-w-none lg:items-start lg:text-left">
              <div className="animate-fade-up w-full space-y-4 sm:space-y-5 lg:max-w-[34rem] xl:max-w-[36rem]">
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

                {/* Mobile-only replace graphic */}
                <div className="lg:hidden w-full pt-1">
                  <ReplaceIntoLogo />
                </div>

                <div
                  className="animate-fade-up flex flex-col items-center lg:items-start gap-4 sm:gap-5 pt-1"
                  style={{ animationDelay: "120ms" }}
                >
                  <Button
                    asChild
                    variant="hero"
                    size="xl"
                    className="group w-full sm:w-auto min-h-12 px-7"
                  >
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
            </div>

            <div
              className="animate-slide-in-right relative hidden lg:flex"
              style={{ animationDelay: "80ms" }}
            >
              <HeroPhone className="w-[270px] xl:w-[290px]" />
            </div>
          </div>

          <div className="lg:hidden mt-8 sm:mt-10 flex justify-center">
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
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-8 rounded-[3.25rem] bg-gradient-to-b from-white/50 via-transparent to-primary/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-11 left-1/2 h-[4.5rem] w-[82%] -translate-x-1/2 rounded-full bg-foreground/[0.12] blur-2xl"
        aria-hidden
      />
      <PhoneFrame
        className={cn(
          "w-[240px] sm:w-[260px] lg:w-[270px] xl:w-[290px] animate-float",
          className,
        )}
      >
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    </div>
  );
}
