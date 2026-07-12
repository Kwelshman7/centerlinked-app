import { useState } from "react";
import { Phone, MessageSquare, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { trackOrgEvent } from "@/lib/track-org-event";
import { sanitizePhone } from "@/lib/phone";

interface Props {
  repName: string | null;
  repPhone: string | null;
  repEmail: string | null;
  brand: string;
  organizationId?: string;
  contextLabel?: string;
  /** Pixels to lift the bar above a bottom tab bar (e.g. 64 in the logged-in app). */
  bottomOffset?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MobileContactBar({
  repName,
  repPhone,
  repEmail,
  brand,
  organizationId,
  contextLabel = "Reach the business development representative.",
  bottomOffset = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const tel = sanitizePhone(repPhone);
  const hasAny = !!(tel || repEmail);

  if (!hasAny) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
    setOpen(false);
  };

  const barStyle: React.CSSProperties = bottomOffset
    ? { bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))` }
    : { paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" };

  return (
    <>
      <div
        className="fixed left-0 right-0 lg:hidden z-30 bg-card/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-3 print:hidden"
        style={barStyle}
      >
        <Button
          size="lg"
          className="w-full shadow-md text-[15px] font-semibold"
          style={{ backgroundColor: brand, borderColor: brand }}
          onClick={() => setOpen(true)}
        >
          <User className="h-4 w-4" />
          Contact
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-w-lg mx-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading">Contact</SheetTitle>
            <p className="text-sm text-muted-foreground">{contextLabel}</p>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            {repName ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <div
                  className="h-11 w-11 rounded-full grid place-items-center shrink-0 font-heading font-bold text-sm border"
                  style={{ backgroundColor: `${brand}14`, color: brand, borderColor: `${brand}30` }}
                >
                  {getInitials(repName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{repName}</p>
                  <p className="text-xs text-muted-foreground">BD Representative</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <div className="h-11 w-11 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">BD Representative</p>
              </div>
            )}

            <div className="space-y-2.5">
              {repEmail && (
                <Button
                  asChild
                  size="lg"
                  className="w-full h-12 text-[15px] font-semibold hover:opacity-90"
                  style={{ backgroundColor: brand, borderColor: brand }}
                >
                  <a href={`mailto:${repEmail}`} onClick={() => fire("contact_email")}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}

              {tel && (
                <Button asChild size="lg" variant="outline" className="w-full h-12 text-[15px] font-semibold">
                  <a href={`sms:${tel}`} onClick={() => fire("contact_text")}>
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </a>
                </Button>
              )}

              {tel && (
                <Button asChild size="lg" variant="outline" className="w-full h-12 text-[15px] font-semibold">
                  <a href={`tel:${tel}`} onClick={() => fire("contact_call")}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Bottom padding to keep scroll content clear of the fixed contact bar on mobile. */
export function mobileContactBarPadding(bottomOffset = 0): string {
  const bar = "5rem";
  if (bottomOffset) {
    return `pb-[calc(${bar}+${bottomOffset}px+env(safe-area-inset-bottom))] lg:pb-0`;
  }
  return `pb-[calc(${bar}+env(safe-area-inset-bottom))] lg:pb-0`;
}
