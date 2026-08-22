import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Check,
  Facebook,
  FileText,
  Instagram,
  Linkedin,
  Share2,
  Twitter,
  User,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { trackOrgEvent } from "@/lib/track-org-event";
import { orgDisplayPath, orgPublicPath } from "@/lib/public-urls";
import {
  contrastingTextColor,
  footerMutedText,
  footerRingColor,
} from "@/lib/color-contrast";
import {
  FOOTER_ACTION_BTN_CLASS,
  FOOTER_ACTION_ICON_CLASS,
  ORG_FOOTER_REFER_SLOT_ID,
  ORG_SHARED_FOOTER_ID,
  footerActionButtonStyle,
  openReferPatientSheet,
} from "@/lib/org-shared-footer";
import { cn } from "@/lib/utils";

export type OrgSocialLinks = {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  x?: string | null;
};

interface Props {
  orgId: string;
  orgName: string;
  slug: string | null;
  logoUrl: string | null;
  brand: string;
  social?: OrgSocialLinks | null;
  /** Override share URL (e.g. program sheet on branded path). */
  shareUrl?: string;
  shareDisplayPath?: string;
  shareTitle?: string;
  /** When set, shows a "View More" button linking to the org page. */
  orgLinkLabel?: string;
  /** Reserve / show the Refer Patient action (dock target for the sticky CTA). */
  showReferSlot?: boolean;
  showExportPdf?: boolean;
  /** Dedicated one-pager exporter. Falls back to window.print() when omitted. */
  onExportPdf?: () => void | Promise<void>;
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function OrgFooter({
  orgId,
  orgName,
  slug,
  logoUrl,
  brand,
  social,
  shareUrl: shareUrlOverride,
  shareDisplayPath,
  shareTitle,
  orgLinkLabel,
  showReferSlot = false,
  showExportPdf = false,
  onExportPdf,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const displayUrl =
    shareDisplayPath ?? (slug ? orgDisplayPath(slug) : "centerlinked.com");
  const fullUrl =
    shareUrlOverride ??
    (typeof window !== "undefined" && slug
      ? `${window.location.origin}${orgPublicPath(slug)}`
      : `https://${displayUrl}`);
  const year = new Date().getFullYear();
  const orgHref = slug ? orgPublicPath(slug) : null;
  const text = contrastingTextColor(brand);
  const muted = footerMutedText(text);
  const ring = footerRingColor(text);
  const buttonStyle = footerActionButtonStyle(brand);

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
        /* fall through — user cancel or unsupported payload */
      }
    }
    await copy();
  };

  const exportPdf = async () => {
    if (exportingPdf) return;
    if (!onExportPdf) {
      window.print();
      return;
    }
    setExportingPdf(true);
    try {
      await onExportPdf();
    } finally {
      setExportingPdf(false);
    }
  };

  const menuItems: {
    key: string;
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
    href?: string;
  }[] = [
    {
      key: "share",
      label: copied ? "Link Copied" : "Share Link",
      icon: copied ? Check : Share2,
      onClick: share,
    },
    ...(showExportPdf
      ? [
          {
            key: "pdf",
            label: exportingPdf ? "Creating PDF…" : "Export PDF",
            icon: FileText,
            onClick: exportPdf,
          },
        ]
      : []),
  ];
  const viewMoreItem =
    orgHref && orgLinkLabel
      ? {
          key: "view-more",
          label: "View More",
          icon: Building2,
          href: orgHref,
        }
      : null;

  const socialItems = [
    { key: "facebook", href: social?.facebook, icon: Facebook, label: "Facebook" },
    { key: "x", href: social?.x, icon: Twitter, label: "X" },
    { key: "instagram", href: social?.instagram, icon: Instagram, label: "Instagram" },
    { key: "linkedin", href: social?.linkedin, icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => !!s.href?.trim());

  const logoNode = logoUrl ? (
    <img
      src={logoUrl}
      alt={`${orgName} logo`}
      className="h-24 w-auto max-w-[14rem] lg:h-32 lg:max-w-[18rem] object-contain"
    />
  ) : (
    <Building2 className="h-16 w-16 lg:h-20 lg:w-20" style={{ color: text }} aria-hidden />
  );

  const elevatedLogo = (
    <div
      className="rounded-2xl border bg-card p-2.5 lg:p-4 shadow-xl shadow-black/20 ring-1"
      style={{ borderColor: `${brand}38`, ["--tw-ring-color" as string]: "rgba(255,255,255,0.32)" }}
    >
      {logoNode}
    </div>
  );

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 space-y-3">
      {/* Normal flow reserves space below the facility grid; the negative margin
          overlaps the logo with the footer only, never the cards above it. */}
      <div className="relative z-10 flex justify-center pt-6 -mb-12 lg:pt-8 lg:-mb-20 print:mb-0 print:pt-0">
        {orgHref ? (
          <Link
            to={orgHref}
            className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: ring }}
            aria-label={`${orgName} home`}
          >
            {elevatedLogo}
          </Link>
        ) : (
          elevatedLogo
        )}
      </div>
      <footer
        id={ORG_SHARED_FOOTER_ID}
        className="relative overflow-visible print:shadow-none"
        style={{ backgroundColor: brand, color: text }}
      >
        <div className="relative flex flex-col items-center text-center px-6 sm:px-10 pt-20 pb-12 lg:pt-32 lg:pb-16 gap-8 sm:gap-10">
          <nav
            aria-label="Footer actions"
            className="print:hidden grid grid-cols-2 justify-items-center gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center"
          >
            {showReferSlot ? (
              <button
                id={ORG_FOOTER_REFER_SLOT_ID}
                type="button"
                onClick={() => openReferPatientSheet()}
                className={FOOTER_ACTION_BTN_CLASS}
                style={buttonStyle}
              >
                <User className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
                Refer Patient
              </button>
            ) : null}

            {viewMoreItem ? (
              <Link
                to={viewMoreItem.href}
                className={FOOTER_ACTION_BTN_CLASS}
                style={buttonStyle}
              >
                <Building2 className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
                {viewMoreItem.label}
              </Link>
            ) : null}

            {menuItems.map((item) => {
              const Icon = item.icon;
              if (item.href) {
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={FOOTER_ACTION_BTN_CLASS}
                    style={buttonStyle}
                  >
                    <Icon className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.key === "pdf" && exportingPdf}
                  className={cn(FOOTER_ACTION_BTN_CLASS, item.key === "pdf" && exportingPdf && "opacity-70")}
                  style={buttonStyle}
                >
                  <Icon className={FOOTER_ACTION_ICON_CLASS} aria-hidden />
                  {item.label}
                </button>
              );
            })}

          </nav>

          {socialItems.length > 0 ? (
            <ul className="print:hidden flex items-center justify-center gap-3.5 sm:gap-4">
              {socialItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <a
                      href={normalizeExternalUrl(item.href!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                      style={{ borderColor: ring, color: text }}
                    >
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <p className="text-[11px] tracking-wide" style={{ color: muted }}>
            © {year} {orgName}
          </p>
        </div>
      </footer>

      <div className="flex justify-center pb-1 print:hidden">
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
