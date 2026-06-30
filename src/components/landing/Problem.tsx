import { UserMinus, PhoneCall, Building, ShieldAlert } from "lucide-react";

const pillars = [
  {
    icon: UserMinus,
    title: "A BD rep leaves",
    body: "Their number was the one your partners had saved. Those calls go to voicemail now. The referral goes somewhere else.",
  },
  {
    icon: PhoneCall,
    title: "A phone number changes",
    body: "Partners keep calling the old line. By the time they reach the right person, the client is already placed.",
  },
  {
    icon: Building,
    title: "You add a new program",
    body: "You launched PHP. Your partners don't know. The referrals that would have been a perfect fit never come.",
  },
  {
    icon: ShieldAlert,
    title: "Your insurance changes",
    body: "You went in-network with a new plan. Your partners are still working off last year's list.",
  },
];

export function Problem() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="container max-w-6xl">
        <div className="text-center mb-14 sm:mb-16">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            The Problem
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
            Your referral partners are working from old information.{" "}
            <br className="hidden md:block" />
            <span className="text-primary">They just don't know it.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            When you send a PDF or a one-pager, it's accurate that day. But you move on. Things change. And that document doesn't update itself. Your partners keep using it — because it's all they have.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto auto-rows-fr">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="group h-full flex flex-col p-7 bg-card border border-border rounded-2xl shadow-[0_4px_20px_-8px_hsl(var(--foreground)/0.06)] hover:border-primary/30 hover:shadow-[0_12px_36px_-12px_hsl(var(--primary)/0.18)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground tracking-tight mb-2">
                {p.title}
              </h3>
              <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-base text-muted-foreground max-w-2xl mx-auto">
          None of this is anyone's fault. Referral partners just need one place that's always current. CenterLinked is that place.
        </p>
      </div>
    </section>
  );
}
