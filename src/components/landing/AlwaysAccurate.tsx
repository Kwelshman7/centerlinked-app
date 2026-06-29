import { BadgeCheck, Search, Star } from "lucide-react";

const differentiators = [
  {
    icon: BadgeCheck,
    eyebrow: "Always accurate",
    title: "Your profile stays verified.",
    body: "Every 30 days, you confirm your information. One click if nothing changed. A quick update if something did. Skip it, and your profile stops showing in search until you're current. There's no such thing as stale information hiding on CenterLinked.",
  },
  {
    icon: Search,
    eyebrow: "Find the right partner",
    title: "Find the right placement fast.",
    body: "Search by level of care, location, and insurance. When a client isn't right for your program, find a partner who fits in seconds. Not after an hour of phone calls.",
  },
  {
    icon: Star,
    eyebrow: "Your referral network",
    title: "Build your real referral network.",
    body: "Add the organizations you already work with. See which ones refer back to you. Your real partners show up first when you search — based on your actual relationships, not who paid for a top spot.",
  },
];

export function AlwaysAccurate() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Why CenterLinked works
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three things that{" "}
            <span className="text-primary">make it different.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {differentiators.map((d) => (
            <div
              key={d.title}
              className="group p-7 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <d.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">{d.eyebrow}</p>
              <h3 className="font-heading text-lg font-bold text-foreground">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
