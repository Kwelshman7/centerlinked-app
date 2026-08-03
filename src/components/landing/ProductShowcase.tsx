import { PhoneFrame } from "./PhoneFrame";
import { PublicOrgSheetPreviewContent } from "./PublicOrgSheetPreview";
import { SearchInteractiveDemo } from "./SearchInteractiveDemo";
import { PublicFacilitySheetPreviewContent } from "./PublicFacilitySheetPreview";
import { FeatureCarousel, type FeatureCarouselSlide } from "./FeatureCarousel";
import { SectionBadge } from "./SectionBadge";
import { DisplayAccent, DisplayHeading } from "./DisplayHeading";

const slides: FeatureCarouselSlide[] = [
  {
    id: "org-profile",
    label: "What partners open",
    title: "Your organization profile — one shared link.",
    caption: "The link that simplifies who you are and what you offer.",
    content: (
      <PhoneFrame className="w-[210px] sm:w-[230px] md:w-[250px]">
        <PublicOrgSheetPreviewContent />
      </PhoneFrame>
    ),
  },
  {
    id: "facility-page",
    label: "Each facility page",
    title: "Each location has its own page.",
    caption: "Giving those who refer to you exactly what they need for that program.",
    content: (
      <PhoneFrame className="w-[210px] sm:w-[230px] md:w-[250px]">
        <PublicFacilitySheetPreviewContent />
      </PhoneFrame>
    ),
  },
  {
    id: "search",
    label: "How partners find you",
    title: "Search by Insurance, Location, and Level of Care.",
    caption:
      "Professionals filter by insurance and state — then verified partners surface ready to refer.",
    /** Long enough for typing → state pick → results to play through. */
    durationMs: 11000,
    content: (
      <PhoneFrame className="w-[210px] sm:w-[230px] md:w-[250px]">
        <SearchInteractiveDemo />
      </PhoneFrame>
    ),
  },
];

export function ProductShowcase() {
  return (
    <section
      id="example"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-secondary/40 scroll-mt-20"
    >
      <div className="pointer-events-none absolute inset-0 landing-glow opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-30"
        aria-hidden
      >
        <div className="absolute bottom-0 left-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,hsl(var(--primary)/0.22),transparent)]" />
        <div className="absolute bottom-0 right-[-10%] top-[5%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,hsl(var(--primary)/0.16),transparent)]" />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-12 space-y-5">
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

        <FeatureCarousel slides={slides} />
      </div>
    </section>
  );
}
