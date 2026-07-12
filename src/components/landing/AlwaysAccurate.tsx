import { BadgeCheck, Search, Handshake } from "lucide-react";

const differentiators = [
  {
    icon: BadgeCheck,
    eyebrow: "Verification",
    title: "Accuracy you can count on",
    body: "Organizations verify their profile every 30 days. Miss a check-in, and search visibility pauses — so stale insurance and contact info can't quietly stick around.",
  },
  {
    icon: Search,
    eyebrow: "Outbound placements",
    title: "Find the right next step fast",
    body: "When a client isn't a fit for you, search by level of care, insurance, and location. Verified profiles surface first — so you can place with confidence, not guesswork.",
  },
  {
    icon: Handshake,
    eyebrow: "Your network",
    title: "Relationships over paid placement",
    body: "Preferred partners rise to the top based on who you actually work with — not who bought a featured slot. Refer out, and stay top of mind when they refer back.",
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
            Three things that make CenterLinked{" "}
            <span className="text-primary">work for referrals.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            A live profile only helps if the information is trustworthy, searchable when you need
            a placement, and rooted in real professional relationships.
          </p>
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
                {d.eyebrow}
              </p>
              <h3 className="font-heading text-base font-bold text-foreground">{d.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
