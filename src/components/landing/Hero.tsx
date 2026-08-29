import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  IdCard,
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

const heroSubheader =
  "One live profile for your organization — who you are, where you treat, what you offer, and which insurance you’re in network with.";

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
              "grid-cols-1 items-center gap-10",
              "pt-8 pb-12 sm:pt-10 sm:pb-14",
              /* Top-weighted split — denser than vertical centering, still above the fold */
              "lg:grid-cols-[minmax(0,1.05fr)_auto] lg:items-start lg:gap-10 xl:gap-14",
              "lg:pt-14 lg:pb-16 xl:pt-16 xl:pb-20",
            )}
          >
            <div className="flex w-full max-w-xl flex-col items-center text-center lg:max-w-none lg:items-start lg:text-left lg:pt-6 xl:pt-10">
              <div className="animate-fade-up w-full space-y-5 sm:space-y-6 lg:max-w-[34rem] xl:max-w-[36rem]">
                <p className="font-display text-sm font-semibold tracking-tight text-foreground">
                  CenterLinked
                  <span className="mx-2.5 text-border" aria-hidden>
                    ·
                  </span>
                  <span className="font-sans text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-primary align-middle">
                    Behavioral health BD
                  </span>
                </p>

                <DisplayHeading
                  as="h1"
                  className="text-center lg:text-left text-[2rem] leading-[1.1] sm:text-[2.65rem] sm:leading-[1.06] lg:text-[3.15rem] xl:text-[3.45rem] lg:leading-[1.04]"
                >
                  Your Treatment Center Needs a{" "}
                  <DisplayAccent>Referral Link.</DisplayAccent>
                </DisplayHeading>

                <p className="text-[15px] sm:text-base lg:text-[1.0625rem] text-muted-foreground leading-relaxed max-w-md sm:max-w-lg mx-auto lg:mx-0">
                  {heroSubheader}
                </p>

                {/* Mobile-only replace graphic */}
                <div className="lg:hidden w-full pt-2">
                  <ReplaceIntoLogo />
                </div>

                <div
                  className="animate-fade-up flex flex-col items-center lg:items-start gap-3.5 pt-1 sm:pt-2"
                  style={{ animationDelay: "120ms" }}
                >
                  <Button
                    asChild
                    variant="hero"
                    size="xl"
                    className="group w-full sm:w-auto min-h-12 px-8 shadow-glow"
                  >
                    <Link to="/request-access">
                      Create Your Organization Profile
                      <ArrowRight className="ml-1.5 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Levels of care · Locations · In-network insurance · Who to contact
                  </p>
                </div>
              </div>
            </div>

            <div
              className="animate-slide-in-right relative hidden lg:flex lg:pt-2 xl:pt-0"
              style={{ animationDelay: "80ms" }}
            >
              <HeroPhone className="w-[300px] xl:w-[330px]" />
            </div>
          </div>

          <div className="lg:hidden pb-4 flex justify-center">
            <HeroPhone className="w-[230px] sm:w-[255px]" />
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
          "w-[240px] sm:w-[260px] lg:w-[300px] xl:w-[330px]",
          className,
        )}
      >
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    </div>
  );
}
