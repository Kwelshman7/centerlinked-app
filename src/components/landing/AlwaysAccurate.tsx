import { Link2, Handshake, Target, Clock, Search } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const reasons = [
  {
    icon: Link2,
    title: "One link for every partner",
    body: "Stop redistributing materials. Share your organization URL once — partners always reopen the accurate version.",
    featured: true,
  },
  {
    icon: Search,
    title: "Get found when it matters",
    body: "Appear when professionals search by level of care, location, and insurance — not buried in last year’s PDF.",
  },
  {
    icon: Handshake,
    title: "Earn partner confidence",
    body: "Give referral partners one place they can trust for facilities, coverage, and who to call.",
  },
  {
    icon: Target,
    title: "Fewer wrong-fit referrals",
    body: "Partners confirm fit — programs, payers, contacts — before they pick up the phone.",
  },
  {
    icon: Clock,
    title: "Less time answering the same questions",
    body: "Reduce “are you still in-network?” and “who do I call?” — it’s already on the profile.",
  },
];

export function AlwaysAccurate() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:items-start">
          <div className="space-y-5 max-w-md lg:sticky lg:top-24">
            <SectionBadge>Why organizations join</SectionBadge>
            <DisplayHeading as="h2">
              Become the organization partners{" "}
              <DisplayAccent>actually trust to refer to.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base text-muted-foreground leading-relaxed">
              CenterLinked turns your referral marketing into a live network presence — easier
              to share, easier to verify, easier to place from.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {reasons.map((r) => (
              <div
                key={r.title}
                className={`group p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all duration-300 ${
                  r.featured ? "sm:col-span-2 sm:flex sm:gap-5 sm:items-start" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 ${
                    r.featured ? "mb-0" : "mb-4"
                  }`}
                >
                  <r.icon className="h-5 w-5" />
                </div>
                <div className={r.featured ? "mt-4 sm:mt-0" : ""}>
                  <h3 className="font-display text-lg text-foreground leading-snug">{r.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
