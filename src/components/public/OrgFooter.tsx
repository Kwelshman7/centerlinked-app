import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { OrgHeroContactCard, HeroContact } from "@/components/public/OrgHeroContactCard";
import { trackOrgEvent } from "@/lib/track-org-event";
import { orgDisplayPath, orgPublicPath } from "@/lib/public-urls";
import { cn } from "@/lib/utils";

interface Props {
  orgId: string;
  orgName: string;
  slug: string | null;
  logoUrl: string | null;
  tagline?: string | null;
  brand: string;
  contact?: HeroContact | null;
  /** Override share URL (e.g. program sheet on branded path). */
  shareUrl?: string;
  /** Override display path used when building the default share URL. */
  shareDisplayPath?: string;
  /** Native share sheet title (defaults to org name). */
  shareTitle?: string;
  orgLinkLabel?: string;
}

export function OrgFooter({
  orgId,
  orgName,
  slug,
  logoUrl,
  tagline,
  brand,
  contact,
  shareUrl: shareUrlOverride,
  shareDisplayPath,
  shareTitle,
  orgLinkLabel,
}: Props) {
  const [copied, setCopied] = useState(false);
  const displayUrl =
    shareDisplayPath ??
    (slug ? orgDisplayPath(slug) : "centerlinked.com");
  const fullUrl =
    shareUrlOverride ??
    (typeof window !== "undefined" && slug
      ? `${window.location.origin}${orgPublicPath(slug)}`
      : `https://${displayUrl}`);
  const year = new Date().getFullYear();
  const hasContact = !!(contact && (contact.phone || contact.email));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      trackOrgEvent(orgId, "share_click");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    if (
      typeof navigator !== "undefined" &&
      (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share
    ) {
      try {
        await (
          navigator as Navigator & { share: (data: ShareData) => Promise<void> }
        ).share({
          title: shareTitle ?? orgName,
          url: fullUrl,
        });
        trackOrgEvent(orgId, "share_click");
        return;
      } catch {
        /* fall through to copy */
      }
    }
    copy();
  };

  const bgStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${brand} 0%, ${brand}e6 55%, #0f1f3d 100%)`,
  };

  return (
    <div className="space-y-3">
      <footer
        className="relative overflow-hidden rounded-2xl text-white shadow-xl"
        style={bgStyle}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full blur-3xl opacity-25"
          style={{ background: "white" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl opacity-15"
          style={{ background: brand }}
        />

        <div className="relative">
          <div
            className={cn(
              "flex flex-col lg:grid lg:items-stretch",
              hasContact && "lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]",
            )}
          >
            <div className="px-5 sm:px-8 py-5 flex flex-col gap-4 min-w-0">
              <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-white shadow-md ring-1 ring-black/5 overflow-hidden grid place-items-center p-2 shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${orgName} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-foreground/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-base sm:text-xl font-bold leading-tight truncate">
                      {orgName}
                    </p>
                    {tagline && (
                      <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-snug line-clamp-2">
                        {tagline}
                      </p>
                    )}
                    {orgLinkLabel && slug && (
                      <Link
                        to={orgPublicPath(slug)}
                        className="mt-1 inline-block text-[11px] font-semibold text-white/85 hover:text-white hover:underline"
                      >
                        {orgLinkLabel} →
                      </Link>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={share}
                  className="h-10 sm:h-11 px-4 sm:px-5 bg-white text-foreground hover:bg-white/90 font-semibold shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <Share2 className="h-4 w-4 shrink-0" />
                  )}
                  {copied ? "Copied" : "Share"}
                </Button>
              </div>

              <div className="pt-3 border-t border-white/15">
                <p className="text-[11px] text-white/65">© {year} {orgName}</p>
              </div>
            </div>

            {hasContact && contact && (
              <div className="hidden lg:flex w-full min-w-0 border-t lg:border-t-0 lg:border-l border-white/15 p-3 sm:p-3.5">
                <OrgHeroContactCard
                  contacts={[contact]}
                  organizationId={orgId}
                  brand={brand}
                  heading="Your Contact"
                  size="lg"
                  className="flex-1 shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </footer>

      <div className="flex justify-center pb-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Powered by</span>
          <Logo to="" size="xs" className="opacity-80" />
        </Link>
      </div>
    </div>
  );
}
