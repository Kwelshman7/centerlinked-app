import { Phone, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOrgEvent } from "@/lib/track-org-event";
import { sanitizePhone } from "@/lib/phone";

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
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgHeroContactCard({ contacts, organizationId, brand = "#1A73E8", heading = "For Referrals" }: Props) {
  if (!contacts.length) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden w-full text-foreground">
      <div
        className="px-3 py-1.5 border-b"
        style={{ backgroundColor: `${brand}10`, borderColor: `${brand}20` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-wider text-center"
          style={{ color: brand }}
        >
          {heading}
        </p>
      </div>

      <div className="p-3 space-y-3">
        {contacts.map((c, i) => {
          const tel = sanitizePhone(c.phone);
          return (
            <div key={i} className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-9 w-9 rounded-full grid place-items-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: `${brand}1f`, color: brand }}
                >
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-sm leading-tight truncate">{c.name}</p>
                  {c.title && (
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
                      {c.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="h-8 px-1.5 text-[11px] font-semibold bg-background"
                >
                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      onClick={() => fire("contact_call")}
                      className="inline-flex flex-row items-center justify-center gap-1 w-full h-full"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="h-8 px-1.5 text-[11px] font-semibold bg-background"
                >
                  {tel ? (
                    <a
                      href={`sms:${tel}`}
                      onClick={() => fire("contact_text")}
                      className="inline-flex flex-row items-center justify-center gap-1 w-full h-full"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Text</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Text</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!c.email}
                  disabled={!c.email}
                  className="h-8 px-1.5 text-[11px] font-semibold hover:opacity-90"
                  style={{ backgroundColor: brand, color: "#fff" }}
                >
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={() => fire("contact_email")}
                      className="inline-flex flex-row items-center justify-center gap-1 w-full h-full"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-1">
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
