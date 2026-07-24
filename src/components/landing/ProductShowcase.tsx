import { PhoneFrame } from "./PhoneFrame";
import { PublicOrgSheetPreviewContent } from "./PublicOrgSheetPreview";
import { SearchInteractiveDemo } from "./SearchInteractiveDemo";
import { PublicFacilitySheetPreviewContent } from "./PublicFacilitySheetPreview";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const views = [
  {
    label: "What partners open",
    title: "Your organization profile — one shared link.",
    caption:
      "Partners land on your live Banyan-style org page: branding, BD contact, and every facility in one place — the same view inside the app.",
    content: <PublicOrgSheetPreviewContent />,
    reverse: false,
  },
  {
    label: "Each facility page",
    title: "Each location has its own page.",
    caption: "Giving those who refer to you exactly what they need for that program.",
    content: <PublicFacilitySheetPreviewContent />,
    reverse: true,
  },
  {
    label: "How partners find you",
    title: "Search by Insurance, Location, and Level of Care.",
    caption:
      "Professionals filter by insurance and state — then verified partners like Banyan surface ready to refer.",
    content: <SearchInteractiveDemo />,
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
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-14 space-y-5">
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

        <div className="space-y-10 sm:space-y-12 lg:space-y-14 max-w-5xl mx-auto">
          {views.map((v) => (
            <div
              key={v.label}
              className={`grid gap-5 sm:gap-6 lg:gap-10 lg:items-center ${
                v.reverse ? "lg:grid-cols-[1.05fr_0.85fr]" : "lg:grid-cols-[0.85fr_1.05fr]"
              }`}
            >
              <div
                className={`flex justify-center w-full min-w-0 ${
                  v.reverse ? "lg:order-2" : ""
                }`}
              >
                <div className="relative" style={{ perspective: "1400px" }}>
                  <div
                    className="relative transform-gpu"
                    style={{ transform: "rotateX(2deg)" }}
                  >
                    <div
                      className="pointer-events-none absolute left-1/2 top-[72%] h-8 w-[65%] -translate-x-1/2 rounded-[100%] bg-black/12 blur-xl"
                      aria-hidden
                    />
                    <PhoneFrame className="w-[255px] sm:w-[270px]">{v.content}</PhoneFrame>
                  </div>
                </div>
              </div>
              <div
                className={`max-w-md mx-auto lg:mx-0 space-y-3 text-center lg:text-left ${
                  v.reverse ? "lg:order-1" : ""
                }`}
              >
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-primary">
                  {v.label}
                </p>
                <h3 className="font-display text-xl sm:text-2xl lg:text-3xl text-foreground leading-tight">
                  {v.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {v.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
