import {
  ArrowRight,
  Link2,
  RefreshCw,
  Handshake,
  Presentation,
  Hospital,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const useCases: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: Handshake,
    title: "After a meeting",
    body: "Send your live link in the follow-up email instead of attaching another PDF.",
  },
  {
    icon: Presentation,
    title: "At a conference",
    body: "Share one link from the booth, a badge scan, or a quick text — no brochure stack required.",
  },
  {
    icon: Hospital,
    title: "With hospital case workers",
    body: "Give discharge planners and case managers a profile they can reopen when a placement comes up.",
  },
  {
    icon: MessageSquare,
    title: "Anytime someone asks",
    body: "When a partner texts “send me your info,” reply with your CenterLinked link in seconds.",
  },
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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/30">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 45% at 85% 40%, hsl(var(--primary-glow) / 0.1), transparent 70%)",
        }}
      />

      <div className="container relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-start">
          <div className="space-y-6 max-w-xl lg:sticky lg:top-28">
            <SectionBadge>Who it&apos;s for</SectionBadge>
            <DisplayHeading as="h2">
              How BD reps{" "}
              <DisplayAccent>use CenterLinked.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              One live referral link for every conversation — so partners always have current
              insurance, locations, levels of care, and who to contact.
            </p>

            <div className="rounded-xl border border-primary/25 bg-background/90 px-4 py-3.5 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Link2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    centerlinked.com/northbend
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <RefreshCw className="h-3 w-3 text-success" aria-hidden />
                    Share once. Stays current when your team updates.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary shrink-0 hidden sm:block" aria-hidden />
              </div>
            </div>
          </div>

          <ul className="space-y-0 divide-y divide-border border-y border-border">
            {useCases.map((item, i) => (
              <li
                key={item.title}
                className="animate-fade-up py-5 sm:py-6"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex gap-4 sm:gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-display text-lg sm:text-xl text-foreground leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 sm:mt-16 pt-8 border-t border-border/70">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
            Built for behavioral healthcare organizations
          </p>
          <ul className="flex flex-wrap gap-x-1 gap-y-2 items-center">
            {orgTypes.map((type, i) => (
              <li key={type} className="flex items-center text-sm sm:text-base text-foreground/85">
                {i > 0 && (
                  <span className="mx-2.5 sm:mx-3 text-primary/35 select-none" aria-hidden>
                    ·
                  </span>
                )}
                <span className="font-medium">{type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
