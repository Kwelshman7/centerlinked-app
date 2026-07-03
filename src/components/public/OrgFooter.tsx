import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Copy, Check, Share2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrgEvent } from "@/lib/track-org-event";
import { orgDisplayPath, orgPublicPath } from "@/lib/public-urls";

interface Props {
  orgId: string;
  orgName: string;
  slug: string | null;
  logoUrl: string | null;
  tagline?: string | null;
  brand: string;
  /** Override share URL (e.g. program sheet on branded path). */
  shareUrl?: string;
  /** Override display path in the copy bar. */
  shareDisplayPath?: string;
  shareLabel?: string;
  orgLinkLabel?: string;
  /** Native share sheet title (defaults to org name). */
  shareTitle?: string;
}

export function OrgFooter({
  orgId,
  orgName,
  slug,
  logoUrl,
  tagline,
  brand,
  shareUrl: shareUrlOverride,
  shareDisplayPath,
  shareLabel = "Share organization",
  orgLinkLabel,
  shareTitle,
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

      <div className="relative px-5 sm:px-8 py-6 sm:py-7">
        {/* Top: Brand + share */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10 items-center">
          {/* Brand block */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-white shadow-md ring-1 ring-black/5 overflow-hidden grid place-items-center p-1 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${orgName} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-5 w-5 text-foreground/60" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-base sm:text-lg font-bold leading-tight truncate">
                {orgName}
              </p>
              {tagline && (
                <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-snug line-clamp-2">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          {/* Share block */}
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/70">{shareLabel}</p>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg p-1 backdrop-blur-sm w-full sm:max-w-md">
            <span className="flex-1 min-w-0 px-2.5 text-xs sm:text-sm truncate text-white/95 font-medium">
              {displayUrl}
            </span>
            <Button
              size="sm"
              onClick={copy}
              className="h-8 bg-white text-foreground hover:bg-white/90 shrink-0 font-semibold text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={share}
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/15 shrink-0"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            </div>
            {orgLinkLabel && slug && (
              <Link
                to={orgPublicPath(slug)}
                className="text-[11px] font-semibold text-white/85 hover:text-white hover:underline"
              >
                {orgLinkLabel} →
              </Link>
            )}
          </div>
        </div>

        <div className="h-px bg-white/15 my-5" />

        {/* Bottom: verified line */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-white/65">
            © {year} {orgName}
          </p>
          <p className="text-[11px] text-white/70 inline-flex items-center gap-1">
            Verified through{" "}
            <Link
              to="/request-access"
              className="font-semibold text-white hover:underline inline-flex items-center gap-0.5"
            >
              CenterLinked
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
