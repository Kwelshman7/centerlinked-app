import { Building2, Pencil, Share2 } from "lucide-react";
import { OrgDashboardInteractiveDemo } from "./OrgDashboardInteractiveDemo";

const highlights = [
  {
    icon: Building2,
    title: "All facilities, one dashboard",
    description: "Open any program to update insurance, LOC, and contacts.",
  },
  {
    icon: Pencil,
    title: "Edit once",
    description: "Every public link updates instantly — no re-email.",
  },
  {
    icon: Share2,
    title: "Share org or program",
    description: "Copy the link your BD team sends after every conversation.",
  },
];

export function OrgDashboardSection() {
  return (
    <section id="org-dashboard" className="py-14 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center px-1">
          <span className="inline-block px-4 py-1.5 mb-4 text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-primary bg-primary/10 rounded-full border border-primary/15">
            Organization Dashboard
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Keep every facility accurate from{" "}
            <span className="text-primary">one workspace.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Click a facility, update what partners need, and your shared link is current.
          </p>
        </div>

        <div className="mt-10 sm:mt-12">
          <OrgDashboardInteractiveDemo />
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3 max-w-4xl mx-auto">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex gap-3 p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <h.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{h.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
