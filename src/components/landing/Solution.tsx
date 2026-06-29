import { Layers, MapPin, Phone, Shield, Users, Send } from "lucide-react";

const questions = [
  { icon: Layers, q: "What levels of care do you offer?" },
  { icon: MapPin, q: "Where are your facilities located?" },
  { icon: Phone, q: "Who is the best contact for admissions?" },
  { icon: Shield, q: "Who are you in network with?" },
  { icon: Users, q: "Who is the BD rep for this location?" },
  { icon: Send, q: "How do I send a referral?" },
];

export function Solution() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            How CenterLinked works
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Referrals are built on trust and timing.{" "}
            <span className="text-primary">Both require accurate information.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Treatment referrals don't happen through websites — they happen through relationships. A clinician calls someone they trust. A hospital discharge planner reaches out to a contact they know. In every one of those moments, someone needs a quick answer to a basic question:
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {questions.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-semibold text-foreground leading-snug pt-1.5">
                {item.q}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-base text-muted-foreground max-w-2xl mx-auto">
          CenterLinked gives every referral partner instant, accurate answers to all of those questions — in one professional profile your team controls and can update anytime.
        </p>
      </div>
    </section>
  );
}
