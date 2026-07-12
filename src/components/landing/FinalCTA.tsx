import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function FinalCTA() {
  return (
    <section className="py-14 sm:py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5" />
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center px-1">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            One link. Always current.{" "}
            <span className="text-primary">Free to start.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Create your profile in minutes. Share it with every referral partner —
            and stop resending PDFs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="hero" size="xl" className="group shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link to="/request-access">
                Create Your Free Profile
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free during early access · No credit card · Approved organizations only
          </p>
        </div>
      </div>
    </section>
  );
}
