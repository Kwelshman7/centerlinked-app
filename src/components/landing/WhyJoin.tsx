import { RefreshCw, Link2, MapPinned, Users2, Eye, Network } from "lucide-react";

const reasons = [
  {
    icon: RefreshCw,
    title: "Stop sending information you can't update",
    description: "Every email attachment, every one-pager, every PDF is a snapshot frozen in time. CenterLinked is live. Update it once and every partner gets the current version automatically.",
  },
  {
    icon: Link2,
    title: "Give your reps something better than a PDF",
    description: "One professional link your team can send after a meeting, at a conference, in a follow-up text. Clean. Current. No attachments.",
  },
  {
    icon: MapPinned,
    title: "Make your facilities easy to understand",
    description: "Show locations, LOCs, contacts, and referral paths in one organized place. Stop losing referrals because your program structure confused someone.",
  },
  {
    icon: Users2,
    title: "Reduce friction for every referral partner",
    description: "The easier you are to refer to, the more often you get referred to. CenterLinked removes the friction that makes partners hesitate or go somewhere else.",
  },
  {
    icon: Eye,
    title: "Show up as a serious, organized program",
    description: "Your profile signals how well-run your organization is. An accurate, complete, professional presence tells partners you have it together — before they ever pick up the phone.",
  },
  {
    icon: Network,
    title: "Build a cleaner professional network",
    description: "Connect your organization with the partners you actually work with. Accurate information, real relationships, and a network that reflects the referral ecosystem you've built over years.",
  },
];

export function WhyJoin() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Why join
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Six reasons BD directors are{" "}
            <span className="text-primary">building profiles right now.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, idx) => (
            <div
              key={idx}
              className="group relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">{r.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
