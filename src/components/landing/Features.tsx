import { TrendingUp, ArrowRightLeft, UserCheck, ClipboardCheck, Image } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "More appropriate inbound referrals",
    description: "When your profile clearly shows your LOC, accepted payers, and admissions criteria, referral partners self-filter. You stop reviewing placements that were never a fit to begin with.",
  },
  {
    icon: ArrowRightLeft,
    title: "Cleaner outbound handoffs",
    description: "When a client isn't right for your program, find a partner in the network with the right LOC and in-network insurance — and hand them off cleanly. Protect the relationship on both sides.",
  },
  {
    icon: UserCheck,
    title: "One story, every rep",
    description: "Your whole BD team shares the same live profile — same facilities, same payer list, same contacts. No more one rep saying something different in the field than what another rep sent in an email.",
  },
  {
    icon: ClipboardCheck,
    title: "A faster BD-to-admissions transition",
    description: "Your partners get clear referral instructions and the right contact upfront. Admissions doesn't spend the first 20 minutes of a referral call chasing information that should have been there from the start.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Benefits
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Better referrals in.{" "}
            <span className="text-primary">Less wasted time out.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            For BD directors, outreach managers, and admissions leaders who track every placement and know exactly how much a bad referral costs.
          </p>
        </div>

        {/* MOCKUP PLACEHOLDER — upload a dashboard/benefits screenshot here */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border-2 border-dashed border-border bg-muted/20 aspect-[16/9] flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Image className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">Dashboard mockup — upload screenshot here</p>
          <p className="text-xs opacity-60">Recommended: 1600×900px · shows the org dashboard or search results</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
