import { BadgeCheck, Search, Handshake } from "lucide-react";

const differentiators = [
  {
    icon: BadgeCheck,
    title: "Always accurate",
    body: "Verify every 30 days. Skip it, and search visibility pauses — stale info can't hide.",
  },
  {
    icon: Search,
    title: "Find placements fast",
    body: "Search by LOC, insurance, and location when a client isn't a fit for you.",
  },
  {
    icon: Handshake,
    title: "Real referral network",
    body: "Your partners surface first — based on relationships, not paid placement.",
  },
];

export function AlwaysAccurate() {
  return (
    <section className="py-14 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Why It's Different
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Accuracy you can{" "}
            <span className="text-primary">count on.</span>
          </h2>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-3 sm:gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          {differentiators.map((d) => (
            <div
              key={d.title}
              className="group p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <d.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{d.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
