import { Building2, MapPin, Phone, Users, ShieldCheck, ClipboardList, Handshake, Mic, RefreshCw, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Who you are",
    description: "Your organization, what you treat, and where you fit in the continuum of care. In plain language partners can actually use.",
  },
  {
    icon: MapPin,
    title: "Where you are",
    description: "Every location, what level of care it offers, and the right contact for that site.",
  },
  {
    icon: Phone,
    title: "Who to call for admissions",
    description: "The right person. The right number. No more \"let me find out and call you back.\"",
  },
  {
    icon: Users,
    title: "Your BD team",
    description: "Who covers which area and how to reach them — even when reps change.",
  },
  {
    icon: ShieldCheck,
    title: "Your insurance",
    description: "In-network payers listed clearly. Not \"we take most major insurance.\" Specific. Verified.",
  },
  {
    icon: ClipboardList,
    title: "How to send a referral",
    description: "Step by step. What you need. Who responds. No guesswork.",
  },
];

const moments = [
  { icon: Handshake, title: "After a meeting", description: "Your rep sends one link instead of a stack of attachments." },
  { icon: Mic, title: "After a conference", description: "One profile that stays current long after the booth comes down." },
  { icon: RefreshCw, title: "After a program update", description: "Your team updates it once. Every link your team has ever shared updates automatically." },
  { icon: MessageSquare, title: "After a partner asks", description: "A clean, professional answer — not a search through old files." },
];

function UpdateOnceDemo() {
  return (
    <div className="mt-12 sm:mt-14 max-w-4xl mx-auto">
      <p className="text-center font-heading text-xl sm:text-2xl font-bold text-foreground mb-8">
        Update once. Reflected everywhere.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">Profile editor</p>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">Editing</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
              <span className="text-sm font-medium text-foreground">Cigna PPO</span>
              <span className="text-xs font-bold text-primary">Now in network</span>
            </div>
            {["Aetna PPO", "BCBS"].map((p) => (
              <div key={p} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <span className="text-sm text-foreground">{p}</span>
                <span className="text-xs text-muted-foreground">In network</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Save once. Every link your team has ever shared updates instantly.
          </p>
        </div>

        <div className="hidden md:flex items-center justify-center text-primary">
          <ArrowRight className="h-6 w-6" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">Shared profile</p>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">In-network payers</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-sm text-foreground">Cigna PPO — <span className="font-semibold text-success">Now in network</span></span>
            </div>
            {["Aetna PPO", "BCBS"].map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm text-foreground">{p}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Last updated</span> — Just now · visible to every referral partner
          </p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-5 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            What's in your profile
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            One link.{" "}
            <span className="text-primary">Your whole story.</span>
          </h2>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your CenterLinked profile has everything a referral partner needs — in one place, always current. Your BD reps share it everywhere. When something changes, you update it once. Every link your team has ever shared updates automatically.
          </p>
        </div>

        <UpdateOnceDemo />

        <div className="mt-12 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="group relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">
                {f.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-14 border-t border-border pt-8 sm:pt-10 max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 sm:mb-8">
            Your BD reps use it everywhere
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {moments.map((m) => (
              <div key={m.title} className="flex gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
