import { Phone, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrgEvent } from "@/lib/track-org-event";
import { sanitizePhone } from "@/lib/phone";
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
  /** Elevated card for hero overlay placement. */
  variant?: "default" | "floating";
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgHeroContactCard({
  contacts,
  organizationId,
  brand = "#1A73E8",
  heading = "For Referrals",
  variant = "default",
  className,
}: Props) {
  if (!contacts.length) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
  };

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden w-full h-full text-foreground flex flex-col",
        variant === "floating"
          ? "rounded-2xl border-white/25 bg-card/97 backdrop-blur-md shadow-2xl ring-1 ring-white/15"
          : "border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      <div
        className="px-3 py-2.5 border-b shrink-0"
        style={{ backgroundColor: `${brand}12`, borderColor: `${brand}22` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-wider text-center"
          style={{ color: brand }}
        >
          {heading}
        </p>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center gap-4 min-h-0">
        {contacts.map((c, i) => {
          const tel = sanitizePhone(c.phone);
          return (
            <div key={i} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full grid place-items-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: `${brand}1f`, color: brand }}
                >
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-base leading-tight truncate">{c.name}</p>
                  {c.title && (
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                      {c.title}
                    </p>
                  )}
                  {c.location && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {c.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="h-10 px-1.5 text-xs font-semibold bg-background"
                >
                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      onClick={() => fire("contact_call")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="h-10 px-1.5 text-xs font-semibold bg-background"
                >
                  {tel ? (
                    <a
                      href={`sms:${tel}`}
                      onClick={() => fire("contact_text")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Text</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Text</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!c.email}
                  disabled={!c.email}
                  className="h-10 px-1.5 text-xs font-semibold hover:opacity-90"
                  style={{ backgroundColor: brand, color: "#fff" }}
                >
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={() => fire("contact_email")}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 w-full h-full"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
