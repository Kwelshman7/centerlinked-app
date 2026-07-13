import { Building2, Pencil, Share2 } from "lucide-react";
import { OrgDashboardInteractiveDemo } from "./OrgDashboardInteractiveDemo";

const highlights = [
  {
    icon: Building2,
    title: "All facilities, one workspace",
    description:
      "Open any program to update insurance, levels of care, contacts, and referral details without hunting through files.",
  },
  {
    icon: Pencil,
    title: "Edit once — live everywhere",
    description:
      "Every public organization and program link updates instantly. Your BD team never re-emails a new PDF.",
  },
  {
    icon: Share2,
    title: "Share the org or a single program",
    description:
      "Send the link that fits the conversation — a full network overview or the one facility partners need right now.",
  },
];

export function OrgDashboardSection() {
  return (
    <section id="org-dashboard" className="py-16 sm:py-20 lg:py-28 bg-secondary/40">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:items-end mb-10 sm:mb-12">
          <div className="max-w-xl space-y-4">
            <span className="inline-block text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary">
              Organization dashboard
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Keep every facility accurate from{" "}
              <span className="text-primary">one workspace.</span>
            </h2>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl lg:pb-1">
            Update facilities, programs, insurance, and referral contacts from your organization
            dashboard — so the profile partners open is always the latest version.
          </p>
        </div>

        <OrgDashboardInteractiveDemo />

        <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex gap-3.5 p-5 rounded-xl bg-card border border-border"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
