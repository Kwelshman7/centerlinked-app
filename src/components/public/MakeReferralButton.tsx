import type { CSSProperties } from "react";
import { ChevronDown, Mail, MessageSquare, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trackOrgEvent } from "@/lib/track-org-event";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface Props {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  organizationId?: string;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "outline";
}

/**
 * Header CTA that opens Call / Text / Email for the facility BD rep.
 */
export function MakeReferralButton({
  name,
  phone,
  email,
  organizationId,
  className,
  style,
  variant = "outline",
}: Props) {
  const tel = sanitizePhone(phone);
  const mail = email?.trim() || "";
  if (!tel && !mail) return null;

  const fire = (kind: "contact_call" | "contact_text" | "contact_email") => {
    if (organizationId) trackOrgEvent(organizationId, kind);
  };

  const displayPhone = formatPhoneDisplay(phone);
  const displayName = name?.trim() || "BD representative";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={variant}
          aria-label="Make a Referral"
          className={cn("shadow-sm whitespace-nowrap px-2.5 sm:px-4", className)}
          style={style}
        >
          <User className="h-4 w-4" />
          <span className="md:hidden">Refer</span>
          <span className="hidden md:inline">Make a Referral</span>
          <ChevronDown className="hidden sm:block h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="w-[min(16.5rem,calc(100vw-1.5rem))] p-2"
        sideOffset={8}
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-sm font-semibold leading-tight truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">Contact to make a referral</p>
        </div>
        <div className="flex flex-col gap-1">
          {tel ? (
            <Button asChild variant="ghost" className="h-10 justify-start font-normal">
              <a href={`tel:${tel}`} onClick={() => fire("contact_call")}>
                <Phone className="h-4 w-4" />
                <span className="truncate">Call{displayPhone ? ` · ${displayPhone}` : ""}</span>
              </a>
            </Button>
          ) : null}
          {tel ? (
            <Button asChild variant="ghost" className="h-10 justify-start font-normal">
              <a href={`sms:${tel}`} onClick={() => fire("contact_text")}>
                <MessageSquare className="h-4 w-4" />
                Text
              </a>
            </Button>
          ) : null}
          {mail ? (
            <Button asChild variant="ghost" className="h-10 justify-start font-normal">
              <a href={`mailto:${mail}`} onClick={() => fire("contact_email")}>
                <Mail className="h-4 w-4" />
                <span className="truncate">Email{mail ? ` · ${mail}` : ""}</span>
              </a>
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
