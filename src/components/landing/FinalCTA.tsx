import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, CreditCard, Link2 } from "lucide-react";
import { Link } from "react-router-dom";


const riskReversals = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: Shield, text: "You control your profile — update it anytime" },
  { icon: Link2, text: "One link, always current" },
];

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5" />
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Make your organization easier to refer to.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Give every referral partner one link with your levels of care, verified insurance, contacts, and referral instructions. Setup takes about 30 minutes — your BD team can start sharing it today.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="hero" size="xl" className="group shadow-lg shadow-primary/20">
              <Link to="/request-access">
                Create Your Free Profile
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {riskReversals.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                  <item.icon className="h-3.5 w-3.5 text-success" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
