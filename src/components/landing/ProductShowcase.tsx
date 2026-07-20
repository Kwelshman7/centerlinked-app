import { PhoneFrame } from "./PhoneFrame";
import { DashboardPreviewContent } from "./DashboardPreview";
import { SearchResultsPreviewContent } from "./SearchResultsPreview";
import { PublicFacilitySheetPreviewContent } from "./PublicFacilitySheetPreview";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const views = [
  {
    label: "Your organization dashboard",
    title: "Update once. Every shared link stays current.",
    caption:
      "Manage facilities, team, engagement, and branding from one dashboard — the same view your organization uses after onboarding.",
    content: <DashboardPreviewContent />,
    reverse: false,
  },
  {
    label: "What partners open",
    title: "Each facility has its own page.",
    caption: "Giving those who refer to you exactly what they need.",
    content: <PublicFacilitySheetPreviewContent />,
    reverse: true,
  },
  {
    label: "How partners find you",
    title: "Search by Insurance, Location, and Level of Care.",
    caption:
      "Professionals filter by level of care, location, and insurance. Verified profiles surface when someone is ready to refer.",
    content: <SearchResultsPreviewContent />,
    reverse: false,
  },
];

export function ProductShowcase() {
  return (
    <section
      id="example"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/40 scroll-mt-20"
    >
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-60" aria-hidden />
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-14 sm:mb-16 space-y-5">
          <SectionBadge>Example profile</SectionBadge>
          <DisplayHeading as="h2" align="center">
            See what partners open when you{" "}
            <DisplayAccent>share your link.</DisplayAccent>
          </DisplayHeading>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            A professional public profile with facilities, insurance, contacts, and referral
            details — always current, always shareable.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-20 lg:space-y-24 max-w-5xl mx-auto">
          {views.map((v) => (
            <div
              key={v.label}
              className={`grid gap-8 lg:gap-14 lg:items-center ${
                v.reverse ? "lg:grid-cols-[1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1fr]"
              }`}
            >
              <div className={`flex justify-center w-full min-w-0 px-2 sm:px-0 ${v.reverse ? "lg:order-2" : ""}`}>
                <PhoneFrame className="w-[min(100%,280px)] sm:w-[290px]">{v.content}</PhoneFrame>
              </div>
              <div className={`max-w-md mx-auto lg:mx-0 space-y-3 ${v.reverse ? "lg:order-1" : ""}`}>
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-primary">
                  {v.label}
                </p>
                <h3 className="font-display text-2xl sm:text-3xl text-foreground leading-tight">
                  {v.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">{v.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
