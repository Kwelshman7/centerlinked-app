import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CreditCard, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

const reassurances = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: CheckCircle2, text: "You control what partners see" },
  { icon: Link2, text: "One link — always current" },
];

export function FinalCTA() {
  return (
    <section className="py-14 sm:py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5" />
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center px-1">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Your partners want to refer to you.{" "}
            <span className="text-primary">Make it easy for them.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Create your live referral profile in about 30 minutes. Share it with every partner —
            and stop resending PDFs that go out of date overnight.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="hero" size="xl" className="group shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link to="/request-access">
                Create Your Free Profile
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          <ul className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            {reassurances.map((r) => (
              <li key={r.text} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <r.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{r.text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-muted-foreground">
            Free during early access · Approved organizations only
          </p>
        </div>
      </div>
    </section>
  );
}
