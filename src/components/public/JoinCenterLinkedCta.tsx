import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export function JoinCenterLinkedCta() {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-accent/30 p-6 sm:p-8 text-center shadow-sm">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
        <Sparkles className="h-3.5 w-3.5" /> For treatment facilities
      </div>
      <h3 className="font-heading text-xl sm:text-2xl font-bold">
        Want a shareable link for your facility?
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Join CenterLinked to create a polished, always-current page BD reps can share in one tap.
      </p>
      <Button asChild size="lg" className="mt-5">
        <Link to="/">Join CenterLinked <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </section>
  );
}
