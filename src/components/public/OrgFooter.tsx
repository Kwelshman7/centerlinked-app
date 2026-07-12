import { Link } from "react-router-dom";
import {
  Building2,
  Phone,
  MessageSquare,
  Mail,
  Printer,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrgEvent } from "@/lib/track-org-event";
import { orgPublicPath } from "@/lib/public-urls";
import { sanitizePhone } from "@/lib/phone";
import type { HeroContact } from "@/components/public/OrgHeroContactCard";

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
  /** BD / referral contact shown in the footer. */
  contact?: HeroContact | null;
  /** @deprecated Prefer `contact` — kept for call sites that only pass email/phone. */
  referralEmail?: string | null;
  referralPhone?: string | null;
  onReferralFallback?: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgFooter({
  orgId,
  orgName,
  slug,
  logoUrl,
  tagline,
  brand,
  orgLinkLabel,
  contact,
  referralEmail,
  referralPhone,
  onReferralFallback,
}: Props) {
  const year = new Date().getFullYear();
  const createdAtLabel = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const name = contact?.name ?? null;
  const title = contact?.title ?? "Business Development";
  const phone = contact?.phone ?? referralPhone ?? null;
  const email = contact?.email ?? referralEmail ?? null;
  const tel = sanitizePhone(phone);
  const hasContact = !!(name || tel || email);

  const fire = (kind: "contact_call" | "contact_text" | "contact_email" | "referral_click") => {
    trackOrgEvent(orgId, kind);
  };

  const printOrExportPdf = () => {
    window.print();
  };

  const bgStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${brand} 0%, ${brand}e6 55%, #0f1f3d 100%)`,
  };

  return (
    <>
      <footer
        className="relative overflow-hidden rounded-2xl text-white shadow-xl print:shadow-none print:rounded-none"
        style={bgStyle}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full blur-3xl opacity-25 print:hidden"
          style={{ background: "white" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl opacity-15 print:hidden"
          style={{ background: brand }}
        />

        <div className="relative px-5 sm:px-8 py-6 sm:py-8">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-white shadow-md ring-1 ring-black/5 overflow-hidden grid place-items-center p-1.5 shrink-0">
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

              {hasContact && (
                <div className="flex items-start gap-3">
                  {name && (
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center text-xs font-bold shrink-0 bg-white/15 ring-1 ring-white/25"
                    >
                      {initials(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    {name && (
                      <p className="font-semibold text-sm sm:text-base leading-tight">{name}</p>
                    )}
                    <p className="text-xs text-white/75 mt-0.5">{title}</p>
                    <div className="mt-1.5 flex flex-col gap-0.5 text-xs sm:text-sm text-white/85">
                      {tel && phone && (
                        <a
                          href={`tel:${tel}`}
                          onClick={() => fire("contact_call")}
                          className="hover:underline truncate"
                        >
                          {phone}
                        </a>
                      )}
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          onClick={() => fire("contact_email")}
                          className="hover:underline truncate"
                        >
                          {email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 w-full lg:w-auto lg:min-w-[220px] print:hidden">
              {hasContact ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      asChild={!!tel}
                      disabled={!tel}
                      size="lg"
                      className="h-11 bg-white text-foreground hover:bg-white/90 font-semibold px-2"
                    >
                      {tel ? (
                        <a
                          href={`tel:${tel}`}
                          onClick={() => fire("contact_call")}
                          className="inline-flex flex-col items-center justify-center gap-0.5 w-full h-full"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="text-[11px]">Call</span>
                        </a>
                      ) : (
                        <span className="inline-flex flex-col items-center justify-center gap-0.5">
                          <Phone className="h-4 w-4" />
                          <span className="text-[11px]">Call</span>
                        </span>
                      )}
                    </Button>
                    <Button
                      asChild={!!tel}
                      disabled={!tel}
                      size="lg"
                      variant="outline"
                      className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold px-2"
                    >
                      {tel ? (
                        <a
                          href={`sms:${tel}`}
                          onClick={() => fire("contact_text")}
                          className="inline-flex flex-col items-center justify-center gap-0.5 w-full h-full"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-[11px]">Text</span>
                        </a>
                      ) : (
                        <span className="inline-flex flex-col items-center justify-center gap-0.5">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-[11px]">Text</span>
                        </span>
                      )}
                    </Button>
                    <Button
                      asChild={!!email}
                      disabled={!email}
                      size="lg"
                      variant="outline"
                      className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold px-2"
                      onClick={() => {
                        if (!email) onReferralFallback?.();
                      }}
                    >
                      {email ? (
                        <a
                          href={`mailto:${email}?subject=${encodeURIComponent(`Referral inquiry — ${orgName}`)}`}
                          onClick={() => fire("referral_click")}
                          className="inline-flex flex-col items-center justify-center gap-0.5 w-full h-full"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="text-[11px]">Email</span>
                        </a>
                      ) : (
                        <span className="inline-flex flex-col items-center justify-center gap-0.5">
                          <Mail className="h-4 w-4" />
                          <span className="text-[11px]">Email</span>
                        </span>
                      )}
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={printOrExportPdf}
                    className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold"
                  >
                    <Printer className="h-4 w-4" />
                    Save as PDF / Print
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={printOrExportPdf}
                  className="h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Save as PDF / Print
                </Button>
              )}

              {orgLinkLabel && slug && (
                <Link
                  to={orgPublicPath(slug)}
                  className="text-[11px] font-semibold text-white/85 hover:text-white hover:underline text-center lg:text-right"
                >
                  {orgLinkLabel} →
                </Link>
              )}
            </div>
          </div>

          <div className="h-px bg-white/15 my-5" />

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

      {/* Print / PDF disclaimer — only visible when printing */}
      <div className="hidden print:block mt-6 pt-4 border-t border-border text-center text-[11px] text-muted-foreground space-y-1">
        <p>PDF created {createdAtLabel}.</p>
        <p>
          Log in to{" "}
          <span className="font-semibold text-foreground">centerlinked.com</span> for the most
          accurate and up-to-date information.
        </p>
      </div>
    </>
  );
}
