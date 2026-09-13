import { Mail, Phone } from "lucide-react";
import { bdContactStatusLabel, hasAssignedBdContact, isBdContactVerified } from "@/lib/bd-contact";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface Props {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  title?: string | null;
  verifiedAt?: string | null;
  className?: string;
}

export function BdContactLine({ name, phone, email, title, verifiedAt, className }: Props) {
  const contact = {
    bd_contact_name: name,
    bd_contact_phone: phone,
    bd_contact_email: email,
    bd_contact_title: title,
    bd_contact_verified_at: verifiedAt,
  };
  const assigned = hasAssignedBdContact(contact);
  const tel = sanitizePhone(phone);
  const displayPhone = formatPhoneDisplay(phone);

  if (!assigned) {
    return (
      <p className={cn("text-[10px] text-muted-foreground", className)}>
        {bdContactStatusLabel(contact)}
      </p>
    );
  }

  return (
    <div className={cn("space-y-0.5 text-[11px]", className)}>
      <p className="font-medium leading-snug">
        {name}
        {title?.trim() ? <span className="font-normal text-muted-foreground"> · {title}</span> : null}
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground">
        {tel ? (
          <a
            href={`tel:${tel}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3" aria-hidden />
            {displayPhone || phone}
          </a>
        ) : null}
        {email?.trim() ? (
          <a
            href={`mailto:${email.trim()}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3" aria-hidden />
            {email.trim()}
          </a>
        ) : null}
      </p>
      {!isBdContactVerified(contact) ? (
        <p className="text-[10px] text-amber-700">Contact not yet verified</p>
      ) : null}
    </div>
  );
}
