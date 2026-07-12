import { ShieldCheck, Users, Link2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Link2,
    title: "One shareable link",
    description: "Send it after meetings and conferences. No attachments. No re-sends when something changes.",
  },
  {
    icon: ShieldCheck,
    title: "Verified insurance & LOC",
    description: "Named payers and levels of care partners can act on — not \"we take most insurance.\"",
  },
  {
    icon: Users,
    title: "The right BD contact",
    description: "Name, phone, and email stay current. When a rep turns over, update once.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            How It Works
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Update the profile.{" "}
            <span className="text-primary">Every shared link stays current.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            No mass emails. No new PDFs. Change insurance, contacts, or programs once —
            partners always see the latest version.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-3 sm:gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <Button asChild variant="hero" size="lg" className="group">
            <Link to="/request-access">
              Create Your Free Profile
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
