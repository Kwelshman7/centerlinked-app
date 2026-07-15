import {
  FileText,
  BookOpen,
  ClipboardList,
  CreditCard,
  Mail,
  Presentation,
  Replace,
} from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const materials = [
  {
    icon: FileText,
    title: "Program one-pagers & PDFs",
    body: "Sent once, stale forever — partners keep working from last month’s attachment.",
  },
  {
    icon: BookOpen,
    title: "Brochures & leave-behinds",
    body: "Printed, handed out, and impossible to update when a facility or payer changes.",
  },
  {
    icon: ClipboardList,
    title: "Insurance & payer sheets",
    body: "Static coverage lists partners bookmark — then call on contracts that no longer apply.",
  },
  {
    icon: CreditCard,
    title: "Business cards",
    body: "Names and direct lines change. The card in someone’s desk drawer does not.",
  },
  {
    icon: Mail,
    title: "Email blasts & “latest info” threads",
    body: "Another forward, another version — nobody knows which message is current.",
  },
  {
    icon: Presentation,
    title: "Slide decks & capability decks",
    body: "Recycled presentations with last quarter’s programs, team, and network status.",
  },
];

export function Problem() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 landing-glow-center" aria-hidden />
      <div className="container relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:items-start">
          <div className="space-y-5 max-w-md lg:sticky lg:top-24">
            <SectionBadge icon={Replace}>What we replace</SectionBadge>
            <DisplayHeading as="h2">
              Your referral marketing still lives in{" "}
              <DisplayAccent>materials that go stale.</DisplayAccent>
            </DisplayHeading>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              BD and admissions teams keep redistributing PDFs, brochures, and payer lists.
              Partners open whatever they saved last — not what’s true today.
            </p>
            <p className="text-sm font-semibold text-foreground pt-1">
              CenterLinked replaces the stack with one organization link.
            </p>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {materials.map((item) => (
              <li key={item.title} className="flex gap-4 py-5 sm:gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <item.icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg sm:text-xl text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
