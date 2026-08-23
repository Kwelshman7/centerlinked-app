import { Phone, MessageSquare, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrgEvent } from "@/lib/track-org-event";
import { sanitizePhone } from "@/lib/phone";
import { safeHttpUrl } from "@/lib/public-urls";
import { cn } from "@/lib/utils";

export interface HeroContact {
  name: string;
  title?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Props {
  contacts: HeroContact[];
  organizationId?: string;
  brand?: string;
  heading?: string;
  /** Optional org website shown under the action row. */
  website?: string | null;
  /** Slightly larger type, avatar, and actions for profile sidebars. */
  size?: "default" | "lg";
  className?: string;
}

function websiteLabel(url: string) {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

function websiteHref(url: string) {
  return safeHttpUrl(url);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Solid, high-contrast referral contact card.
 * Opaque surface so name/title always read clearly on any page background.
 */
export function OrgHeroContactCard({
  contacts,
  organizationId,
  brand = "#1A73E8",
  heading = "For Referrals",
  website,
  size = "default",
  className,
}: Props) {
  if (!contacts.length) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
  };

  const site = website?.trim() || null;
  const lg = size === "lg";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground overflow-hidden w-full flex flex-col shadow-lg",
        className,
      )}
      style={{ borderColor: `${brand}30` }}
    >
      <div
        className={cn("border-b shrink-0", lg ? "px-5 py-3" : "px-4 py-2.5")}
        style={{ backgroundColor: `${brand}10`, borderColor: `${brand}18` }}
      >
        <p
          className={cn(
            "font-bold uppercase tracking-[0.14em] text-center",
            lg ? "text-[11px]" : "text-[10px]",
          )}
          style={{ color: brand }}
        >
          {heading}
        </p>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col justify-between min-h-0 bg-card",
          lg ? "p-5 sm:p-6 gap-5" : "p-4 sm:p-5 gap-4",
        )}
      >
        {contacts.map((c, i) => {
          const tel = sanitizePhone(c.phone);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 flex flex-col justify-between min-h-0",
                lg ? "space-y-5" : "space-y-4",
              )}
            >
              <div className={cn("flex items-center", lg ? "gap-4" : "gap-3.5")}>
                <div
                  className={cn(
                    "rounded-full grid place-items-center font-bold shrink-0 border",
                    lg ? "h-14 w-14 text-base" : "h-12 w-12 text-sm",
                  )}
                  style={{
                    backgroundColor: `${brand}14`,
                    color: brand,
                    borderColor: `${brand}28`,
                  }}
                >
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p
                    className={cn(
                      "font-semibold leading-tight truncate text-foreground",
                      lg ? "text-base sm:text-lg" : "text-[15px] sm:text-base",
                    )}
                  >
                    {c.name}
                  </p>
                  {c.title && (
                    <p
                      className={cn(
                        "text-muted-foreground leading-snug mt-0.5 line-clamp-2",
                        lg ? "text-sm" : "text-xs",
                      )}
                    >
                      {c.title}
                    </p>
                  )}
                  {c.location && (
                    <p
                      className={cn(
                        "text-muted-foreground mt-0.5 truncate",
                        lg ? "text-xs" : "text-[11px]",
                      )}
                    >
                      {c.location}
                    </p>
                  )}
                </div>
              </div>

              <div className={cn("grid grid-cols-3 mt-auto", lg ? "gap-2.5" : "gap-2")}>
                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className={cn(
                    "px-1.5 font-semibold bg-background text-foreground",
                    lg ? "h-11 text-sm" : "h-10 text-xs",
                  )}
                >
                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      onClick={() => fire("contact_call")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <Phone className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Call</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <Phone className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Call</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className={cn(
                    "px-1.5 font-semibold bg-background text-foreground",
                    lg ? "h-11 text-sm" : "h-10 text-xs",
                  )}
                >
                  {tel ? (
                    <a
                      href={`sms:${tel}`}
                      onClick={() => fire("contact_text")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <MessageSquare className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Text</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <MessageSquare className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Text</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!c.email}
                  disabled={!c.email}
                  className={cn(
                    "px-1.5 font-semibold hover:opacity-90 text-white",
                    lg ? "h-11 text-sm" : "h-10 text-xs",
                  )}
                  style={{ backgroundColor: brand }}
                >
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={() => fire("contact_email")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <Mail className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Email</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <Mail className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      <span>Email</span>
                    </span>
                  )}
                </Button>
              </div>

              {site && websiteHref(site) ? (
                <a
                  href={websiteHref(site)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: brand }}
                >
                  {websiteLabel(site)}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
