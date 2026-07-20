import {
  Handshake,
  Presentation,
  Hospital,
  MessageSquare,
  Users,
  Check,
  Building2,
  MapPin,
  ShieldCheck,
  Phone,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";
import whoForNetwork from "@/assets/who-for-network.png";

const moments: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: Handshake,
    title: "After a meeting",
    body: "Follow up with one live link — not another PDF that goes stale overnight.",
  },
  {
    icon: Presentation,
    title: "At a conference",
    body: "Share from the booth, a badge scan, or a quick text.",
  },
  {
    icon: Hospital,
    title: "With hospital partners",
    body: "Give discharge planners and case managers a profile they can reopen.",
  },
  {
    icon: MessageSquare,
    title: "Anytime someone asks",
    body: "When a partner texts “send me your info,” reply with the same link in seconds.",
  },
];

const answers: {
  icon: LucideIcon;
  label: string;
}[] = [
  { icon: Building2, label: "Who you are" },
  { icon: Sparkles, label: "What you offer" },
  { icon: Users, label: "Who you help" },
  { icon: MapPin, label: "Where you're located" },
  { icon: ShieldCheck, label: "Which insurance you accept" },
  { icon: Phone, label: "How to contact you" },
];

const orgTypes = [
  "Detox",
  "Residential",
  "PHP",
  "IOP",
  "Mental Health",
  "MAT",
  "Eating Disorder",
  "Psychiatric Hospital",
];

export function WhoFor() {
  return (
    <section id="who-for" className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background scroll-mt-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 45% at 50% 35%, hsl(var(--primary-glow) / 0.1), transparent 70%)",
        }}
      />

      <div className="container relative z-10 space-y-12 sm:space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <SectionBadge icon={Users}>Who it&apos;s for</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Because referral partners shouldn&apos;t have to{" "}
            <DisplayAccent>wonder.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your BD team builds the relationships. CenterLinked gives every partner one live link
            with the answers they need — therapists, case managers, hospitals, and more.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div
            className="pointer-events-none absolute -inset-6 sm:-inset-10 bg-primary/8 blur-3xl rounded-full opacity-80"
            aria-hidden
          />
          <figure className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 bg-card shadow-[0_24px_64px_-28px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.04]">
            <img
              src={whoForNetwork}
              alt="Hub diagram: BD reps at the center connected to therapists, case managers, other BD reps, probation officers, hospitals, and community partners"
              className="w-full h-auto object-contain"
              draggable={false}
            />
          </figure>
          <figcaption className="sr-only">
            BD reps building connections with therapists, case managers, other BD reps, probation
            officers, hospitals, and community partners.
          </figcaption>
        </div>

        <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-7 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-primary mb-1">
              When to send your link
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              The same profile works across BD, admissions, and marketing.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {moments.map((moment) => {
                const Icon = moment.icon;
                return (
                  <li
                    key={moment.title}
                    className="rounded-xl border border-border/60 bg-muted/15 p-3.5 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {moment.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {moment.body}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-7 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-primary mb-1">
              What your link answers
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Immediately — without digging through emails or outdated brochures.
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {answers.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-2 border-t border-border/60">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
            Built for behavioral healthcare organizations
          </p>
          <ul className="flex flex-wrap gap-2">
            {orgTypes.map((type) => (
              <li key={type}>
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-background/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground/90">
                  {type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
