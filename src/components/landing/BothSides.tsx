import { Button } from "@/components/ui/button";
import { Building2, Users, Hospital, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EarlyAccessDialog } from "@/components/EarlyAccessDialog";

const cards = [
  {
    icon: Building2,
    title: "For treatment organizations",
    body: "Create one accurate, organization-controlled profile that every member of your BD and admissions team can share confidently — in every conversation, every follow-up, every outreach.",
  },
  {
    icon: Users,
    title: "For referral partners",
    body: "Search current treatment organization profiles, verify levels of care and insurance, find the right contact — without relying on old spreadsheets, dead numbers, or a BD rep's personal cell.",
  },
  {
    icon: Hospital,
    title: "For hospitals and discharge teams",
    body: "Give staff a clean, professional way to identify the right treatment resources, confirm levels of care, and reach the right admissions contact the first time — so discharges don't get delayed because no one knew who to call.",
  },
];

export function BothSides() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for both sides of{" "}
            <span className="text-primary">the referral relationship</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <EarlyAccessDialog>
            <Button variant="hero" size="lg" className="group">
              Create Your Free Profile
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </EarlyAccessDialog>
          <Button asChild variant="hero-outline" size="lg">
            <Link to="/request-access">Search the Network</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
