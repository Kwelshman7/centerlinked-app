import { Building2, Pencil, Share2 } from "lucide-react";
import { OrgDashboardInteractiveDemo } from "./OrgDashboardInteractiveDemo";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const highlights = [
  {
    icon: Building2,
    title: "All facilities, one workspace",
    description:
      "Open any program to update insurance, levels of care, contacts, and referral details — no hunting through files.",
  },
  {
    icon: Pencil,
    title: "Edit once — live on every link",
    description:
      "Public organization and facility links update instantly. Your BD team never re-emails a new PDF.",
  },
  {
    icon: Share2,
    title: "Share the org or one facility",
    description:
      "Send the full network overview or the single program a partner needs for that conversation.",
  },
];

export function OrgDashboardSection() {
  return (
    <section id="org-dashboard" className="py-16 sm:py-20 lg:py-28 bg-secondary/30 overflow-hidden">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:items-end mb-10 sm:mb-12">
          <div className="max-w-xl space-y-4">
            <SectionBadge>Organization dashboard</SectionBadge>
            <DisplayHeading as="h2">
              Keep every facility accurate from{" "}
              <DisplayAccent>one place.</DisplayAccent>
            </DisplayHeading>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl lg:pb-1">
            Your dashboard is how the link stays true. Update facilities, programs, insurance,
            and contacts — partners always open the latest version.
          </p>
        </div>

        <div className="w-full max-w-full overflow-x-auto">
          <OrgDashboardInteractiveDemo />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex gap-3.5 p-5 rounded-2xl bg-card border border-border shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <h.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{h.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-snug">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
