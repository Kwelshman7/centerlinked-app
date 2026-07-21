import { BadgeCheck, Building2 } from "lucide-react";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { OrgClaimCard } from "@/components/public/OrgClaimCard";
import { orgHeroImage } from "@/lib/org-hero";
import { cn } from "@/lib/utils";

interface OrgHeroOrg {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  cover_image_url: string | null;
  image_urls?: string[] | null;
  verified: boolean;
}

interface Props {
  org: OrgHeroOrg;
  heroContact: HeroContact | null;
  brand: string;
}

export function OrgHeroSection({ org, heroContact, brand }: Props) {
  const heroImage = orgHeroImage(org);
  const headline = org.tagline || org.name;
  const briefDescription =
    org.tagline && org.description && org.description !== org.tagline
      ? org.description
      : !org.tagline
        ? org.description
        : null;

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-[220px] sm:min-h-[300px] lg:min-h-[400px]">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 45%, hsl(var(--muted)) 100%)`,
            }}
          />
        )}

        {/* Dim overlay — image stays visible, text stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background: heroImage
              ? "linear-gradient(105deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.52) 42%, rgba(15,23,42,0.38) 100%)"
              : "linear-gradient(105deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.15) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10" />

        <div className="relative z-[1] max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-10 min-h-[160px] sm:min-h-[220px] lg:min-h-[320px]">
            {/* Org identity — left */}
            <div className="flex-1 min-w-0 flex flex-col justify-end lg:justify-center lg:max-w-[min(100%,720px)]">
              <div className="flex items-end gap-4 sm:gap-5">
                <div className="h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 rounded-2xl bg-white border border-white/40 shadow-lg overflow-hidden grid place-items-center p-2 shrink-0">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={`${org.name} logo`} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-0.5">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {org.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-[1.15] drop-shadow-md">
                    {headline}
                  </h1>
                  {org.tagline && org.name !== org.tagline && (
                    <p className="mt-1 text-sm sm:text-base text-white/80 font-medium">{org.name}</p>
                  )}
                </div>
              </div>

              {briefDescription && (
                <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/88 leading-relaxed line-clamp-3 max-w-2xl">
                  {briefDescription}
                </p>
              )}
            </div>

            {/* Contact card — desktop only; mobile uses sticky Contact now bar + footer card */}
            {heroContact ? (
              <div
                id="org-contact"
                className={cn(
                  "hidden lg:block w-full shrink-0 lg:w-[min(100%,360px)]",
                  "lg:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]",
                )}
              >
                <OrgHeroContactCard
                  contacts={[heroContact]}
                  organizationId={org.id}
                  brand={brand}
                  heading="Your Contact"
                  variant="floating"
                  className="w-full"
                />
              </div>
            ) : (
              <div
                id="org-contact"
                className="w-full shrink-0 lg:w-[min(100%,360px)] lg:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]"
              >
                <div className="rounded-2xl bg-card/95 backdrop-blur-md border border-white/20 shadow-xl p-1">
                  <OrgClaimCard organizationId={org.id} organizationName={org.name} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
