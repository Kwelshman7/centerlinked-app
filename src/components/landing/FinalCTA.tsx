import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="pointer-events-none absolute inset-0 landing-glow" aria-hidden />
      <div className="pointer-events-none absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <DisplayHeading as="h2" align="center">
            Your Next Referral Could Start With{" "}
            <DisplayAccent>One Link.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Replace outdated referral materials with a professional profile your entire
            organization can confidently share.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              variant="hero"
              size="xl"
              className="group shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              <Link to="/request-access">
                Claim Your Organization Profile Today
                <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
