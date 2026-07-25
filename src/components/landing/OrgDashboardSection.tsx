import { OrgDashboardInteractiveDemo } from "./OrgDashboardInteractiveDemo";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

export function OrgDashboardSection() {
  return (
    <section id="org-dashboard" className="py-16 sm:py-20 lg:py-28 bg-muted/30 overflow-hidden">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-4 mb-10 sm:mb-12">
          <SectionBadge>Organization dashboard</SectionBadge>
          <DisplayHeading as="h2" align="center">
            Keep every facility accurate from{" "}
            <DisplayAccent>one place.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your dashboard is how the link stays true. Update facilities, programs, insurance, and
            contacts — partners always open the latest version.
          </p>
        </div>

        <div className="w-full max-w-full md:overflow-x-auto">
          <OrgDashboardInteractiveDemo />
        </div>
      </div>
    </section>
  );
}
