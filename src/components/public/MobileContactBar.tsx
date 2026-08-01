import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Phone, MessageSquare, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ORG_SHARED_FOOTER_ID,
  registerReferPatientOpener,
} from "@/lib/org-shared-footer";
import { trackOrgEvent } from "@/lib/track-org-event";
import { sanitizePhone } from "@/lib/phone";

interface Props {
  repName: string | null;
  repPhone: string | null;
  repEmail: string | null;
  brand: string;
  organizationId?: string;
  contextLabel?: string;
  /** Sticky CTA label. Defaults to "Contact now". */
  ctaLabel?: string;
  /** Optional share button shown beside Contact on mobile (e.g. Share Facility). */
  shareAction?: ReactNode;
  /** Pixels to lift the bar above a bottom tab bar (e.g. 64 in the logged-in app). */
  bottomOffset?: number;
  /** Lets the page release sticky-bar spacing once the footer takes over. */
  onFooterVisibilityChange?: (visible: boolean) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mobile sticky contact CTA. Tapping opens a sheet to choose
 * Send Text, Call, or Email for the BD rep.
 * It stays full width until the footer enters view, where the footer's
 * matching Refer Patient action takes over.
 */
export function MobileContactBar({
  repName,
  repPhone,
  repEmail,
  brand,
  organizationId,
  contextLabel = "Reach the business development representative.",
  ctaLabel = "Refer Patient",
  shareAction,
  bottomOffset = 0,
  onFooterVisibilityChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const tel = sanitizePhone(repPhone);
  const hasContact = !!(tel || repEmail);

  useEffect(() => {
    if (!hasContact) {
      registerReferPatientOpener(null);
      return;
    }
    registerReferPatientOpener(() => setOpen(true));
    return () => registerReferPatientOpener(null);
  }, [hasContact]);

  useEffect(() => {
    const footer = document.getElementById(ORG_SHARED_FOOTER_ID);
    if (!footer || !hasContact) return;

    const updateVisibility = () => {
      const rect = footer.getBoundingClientRect();
      setFooterVisible(rect.top < window.innerHeight && rect.bottom > 0);
    };
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(footer);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    updateVisibility();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [hasContact]);

  useEffect(() => {
    onFooterVisibilityChange?.(footerVisible);
  }, [footerVisible, onFooterVisibilityChange]);

  if (!hasContact && !shareAction) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
    setOpen(false);
  };

  const stickyLabel = ctaLabel.includes(" ") ? ctaLabel : "Refer Patient";

  return (
    <>
      {/* Sticky chrome stays full width until the real footer controls are visible. */}
      {(shareAction || hasContact) && !footerVisible && (
        <div
          className="fixed inset-x-0 bottom-0 lg:hidden z-40 border-t bg-background/95 px-4 pt-3 pb-3 backdrop-blur-md print:hidden"
          style={bottomOffset ? { bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))` } : undefined}
        >
          {shareAction ? (
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 [&_button]:w-full [&_button]:shadow-md [&_button]:text-[15px] [&_button]:font-semibold">
                {shareAction}
              </div>
              {hasContact && (
                <Button
                  size="lg"
                  className="flex-1 min-w-0 shadow-md text-[15px] font-semibold"
                  style={{ backgroundColor: brand, borderColor: brand, color: "#ffffff" }}
                  onClick={() => setOpen(true)}
                >
                  <User className="h-4 w-4" />
                  {stickyLabel}
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              className="h-12 w-full text-[15px] font-semibold shadow-md hover:opacity-90"
              style={{ backgroundColor: brand, borderColor: brand, color: "#ffffff" }}
              onClick={() => setOpen(true)}
            >
              <User className="h-4 w-4" />
              {stickyLabel}
            </Button>
          )}
        </div>
      )}

      {hasContact && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-w-lg mx-auto pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="font-heading">How would you like to reach out?</SheetTitle>
              <p className="text-sm text-muted-foreground">{contextLabel}</p>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              {repName ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                  <div
                    className="h-11 w-11 rounded-full grid place-items-center shrink-0 font-heading font-bold text-sm border"
                    style={{
                      backgroundColor: `${brand}14`,
                      color: brand,
                      borderColor: `${brand}30`,
                    }}
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
                {tel && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-12 text-[15px] font-semibold hover:opacity-90"
                    style={{ backgroundColor: brand, borderColor: brand }}
                  >
                    <a href={`sms:${tel}`} onClick={() => fire("contact_text")}>
                      <MessageSquare className="h-4 w-4" />
                      Send Text
                    </a>
                  </Button>
                )}

                {tel && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-[15px] font-semibold"
                  >
                    <a href={`tel:${tel}`} onClick={() => fire("contact_call")}>
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  </Button>
                )}

                {repEmail && (
                  <Button
                    asChild
                    size="lg"
                    variant={tel ? "outline" : "default"}
                    className="w-full h-12 text-[15px] font-semibold"
                    style={
                      !tel
                        ? { backgroundColor: brand, borderColor: brand }
                        : undefined
                    }
                  >
                    <a href={`mailto:${repEmail}`} onClick={() => fire("contact_email")}>
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

/** Bottom padding to keep scroll content clear of the fixed contact bar on mobile. */
export function mobileContactBarPadding(bottomOffset = 0, collapsed = false): string {
  if (collapsed) return "pb-3 lg:pb-0";
  const bar = "5rem";
  if (bottomOffset) {
    return `pb-[calc(${bar}+${bottomOffset}px+env(safe-area-inset-bottom))] lg:pb-0`;
  }
  return `pb-[calc(${bar}+env(safe-area-inset-bottom))] lg:pb-0`;
}
