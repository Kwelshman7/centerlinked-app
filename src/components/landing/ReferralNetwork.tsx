import { Network, Repeat, Crown } from "lucide-react";

const cards = [
  {
    icon: Network,
    title: "Add your real relationships",
    body: "Connect the organizations you already work with — the ones you call first when a client isn't the right fit for your program.",
  },
  {
    icon: Repeat,
    title: "See who refers back",
    body: "Track which relationships are reciprocal, so you know who's a true referral partner and who's only receiving.",
  },
  {
    icon: Crown,
    title: "Preferred partners surface first",
    body: "When you search for a placement, the organizations you have real relationships with come up before strangers — based on your network, never on payment.",
  },
];

export function ReferralNetwork() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Your Referral Network
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build your referral network — not just a{" "}
            <span className="text-primary">profile</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Add the organizations you already refer to and receive referrals from. See who's actually sending business back, not just who you're sending to. When a referral comes in, your preferred partners surface first — ranked by relationship, never by who paid for placement.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-base text-muted-foreground max-w-2xl mx-auto">
          Your CRM tracks who you've talked to. CenterLinked tracks who actually refers back — and makes sure your information is right when they do.
        </p>
      </div>
    </section>
  );
}
