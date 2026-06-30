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
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgHeroContactCard({ contacts, organizationId, brand = "#1A73E8" }: Props) {
  if (!contacts.length) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-border/40 overflow-hidden w-full sm:w-[320px] text-foreground">
      <div
        className="px-4 py-2.5 border-b"
        style={{ backgroundColor: `${brand}14`, borderColor: `${brand}26` }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-wider text-center"
          style={{ color: brand }}
        >
          For Referrals
        </p>
      </div>

      <div className="p-4 space-y-4">
        {contacts.map((c, i) => {
          const tel = sanitizePhone(c.phone);
          return (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-full grid place-items-center text-sm font-bold shrink-0"
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

              <div className="space-y-2">
                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="w-full h-9 text-[13px] font-semibold"
                >
                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      onClick={() => fire("contact_call")}
                      className="inline-flex flex-row items-center justify-center gap-2 w-full h-full"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Call</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Call</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!tel}
                  variant="outline"
                  disabled={!tel}
                  className="w-full h-9 text-[13px] font-semibold"
                >
                  {tel ? (
                    <a
                      href={`sms:${tel}`}
                      onClick={() => fire("contact_text")}
                      className="inline-flex flex-row items-center justify-center gap-2 w-full h-full"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Text</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Text</span>
                    </span>
                  )}
                </Button>

                <Button
                  asChild={!!c.email}
                  disabled={!c.email}
                  className="w-full h-9 text-[13px] font-semibold hover:opacity-90"
                  style={{ backgroundColor: brand, color: "#fff" }}
                >
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={() => fire("contact_email")}
                      className="inline-flex flex-row items-center justify-center gap-2 w-full h-full"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </a>
                  ) : (
                    <span className="inline-flex flex-row items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
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
