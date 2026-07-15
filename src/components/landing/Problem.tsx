import { FileText, Link2, Replace } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const replaceItems = [
  "Outdated PDFs",
  "Referral Brochures",
  "One-pagers",
  "Email Attachments",
  "Spreadsheet Directories",
  'Constant “Can you send me…” requests',
];

export function Problem() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 landing-glow-center" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-5 mb-12 sm:mb-14">
          <SectionBadge icon={Replace}>The shift</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Replace This…{" "}
            <DisplayAccent>With One Live Link</DisplayAccent>
          </DisplayHeading>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto items-stretch">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-5">
              Replace this…
            </p>
            <ul className="space-y-3.5">
              {replaceItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-foreground/90">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="leading-snug pt-1.5 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 shadow-sm flex flex-col justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary mb-5">
              <Link2 className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl text-foreground leading-snug">
              With One Live Link
            </h3>
            <ul className="mt-6 space-y-3">
              {["Always current.", "Always professional.", "Always shareable."].map((line) => (
                <li
                  key={line}
                  className="text-base sm:text-lg font-medium text-foreground leading-snug"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
