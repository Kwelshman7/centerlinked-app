import { Handshake, Mic, RefreshCw, MessageSquare } from "lucide-react";

const moments = [
  {
    icon: Handshake,
    title: "After a meeting",
    description: "Your rep sends one link instead of a stack of attachments.",
  },
  {
    icon: Mic,
    title: "After a conference",
    description: "Your rep shares one profile that stays current long after the booth comes down.",
  },
  {
    icon: RefreshCw,
    title: "After a program update",
    description: "Your team updates the dashboard once — every existing share link is current.",
  },
  {
    icon: MessageSquare,
    title: "After a partner asks",
    description: "Your team has a clean, professional answer ready instead of a search through old files.",
  },
];

export function BDTeam() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            For BD teams
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Made for treatment center{" "}
            <span className="text-primary">business development teams</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            BD reps spend too much time repeating the same information, sending the same materials, and correcting outdated details. CenterLinked makes follow-up easier.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
          {moments.map((m, idx) => (
            <div
              key={idx}
              className="group flex gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">{m.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-base text-muted-foreground max-w-2xl mx-auto">
          It helps your BD team look organized, professional, and easy to work with.
        </p>
      </div>
    </section>
  );
}
