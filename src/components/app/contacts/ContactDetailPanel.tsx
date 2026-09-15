import { Link } from "react-router-dom";
import { Mail, Phone, Building2, MapPin, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CONTACT_TYPE_LABELS,
  type ContactType,
  type WorkspaceContact,
} from "@/lib/contact-workspace";
import { initialsFromName, professionalPath } from "@/lib/professional-network";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { orgPublicPath } from "@/lib/public-urls";
import { cn } from "@/lib/utils";

const CONTACT_TYPE_BADGE_CLASS: Record<ContactType, string> = {
  bd_rep: "border-sky-200 bg-sky-50 text-sky-800",
  facility: "border-emerald-200 bg-emerald-50 text-emerald-800",
  admissions: "border-lime-200 bg-lime-50 text-lime-800",
  insurance: "border-rose-200 bg-rose-50 text-rose-800",
  clinical: "border-violet-200 bg-violet-50 text-violet-800",
  outreach: "border-orange-200 bg-orange-50 text-orange-800",
  executive: "border-indigo-200 bg-indigo-50 text-indigo-800",
  other: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return (
    <Badge variant="outline" className={cn("font-medium", CONTACT_TYPE_BADGE_CLASS[type])}>
      {CONTACT_TYPE_LABELS[type]}
    </Badge>
  );
}

export function ContactDetailPanel({
  contact,
  onClose,
}: {
  contact: WorkspaceContact;
  onClose: () => void;
}) {
  const tel = sanitizePhone(contact.phone);
  const mail = contact.email?.trim();
  const place = [contact.city, contact.state].filter(Boolean).join(", ");
  const orgHref = contact.organization?.slug ? orgPublicPath(contact.organization.slug) : null;
  const profileHref = contact.userId ? professionalPath(contact.userId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-border/60 pb-4">
        {contact.avatarUrl ? (
          <img src={contact.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center text-lg font-semibold">
            {initialsFromName(contact.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold leading-tight">{contact.fullName}</h2>
          {contact.title ? <p className="mt-0.5 text-sm text-muted-foreground">{contact.title}</p> : null}
          {contact.organization?.name ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{contact.organization.name}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ContactTypeBadge type={contact.contactType} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {tel ? (
          <Button asChild size="sm" className="flex-1">
            <a href={`tel:${tel}`}>
              <Phone className="h-4 w-4" /> Call
            </a>
          </Button>
        ) : (
          <Button size="sm" className="flex-1" disabled>
            <Phone className="h-4 w-4" /> Call
          </Button>
        )}
        {mail ? (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={`mailto:${mail}`}>
              <Mail className="h-4 w-4" /> Email
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            <Mail className="h-4 w-4" /> Email
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-5 overflow-y-auto text-sm">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contact information
          </h3>
          <ul className="mt-2 space-y-2">
            {contact.phone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={tel ? `tel:${tel}` : undefined} className="hover:text-primary">
                  {formatPhoneDisplay(contact.phone) || contact.phone}
                </a>
              </li>
            ) : null}
            {mail ? (
              <li className="flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${mail}`} className="truncate hover:text-primary">
                  {mail}
                </a>
              </li>
            ) : null}
            {place ? (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {place}
              </li>
            ) : null}
            {!contact.phone && !mail && !place ? (
              <li className="text-muted-foreground">No phone, email, or location on file.</li>
            ) : null}
          </ul>
        </section>

        {contact.organization ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organization</h3>
            <div className="mt-2 rounded-lg border border-border/60 p-3">
              <p className="font-medium">{contact.organization.name}</p>
              {place ? <p className="text-xs text-muted-foreground mt-0.5">{place}</p> : null}
              {orgHref ? (
                <Link to={orgHref} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Building2 className="h-3.5 w-3.5" /> View organization
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Insurance contracts
          </h3>
          {contact.payers.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {contact.payers.slice(0, 8).map((payer) => (
                <Badge key={payer} variant="secondary" className="font-medium">
                  {payer}
                </Badge>
              ))}
              {contact.payers.length > 8 ? (
                <Badge variant="outline">+{contact.payers.length - 8} more</Badge>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-muted-foreground">No in-network payers listed for this contact.</p>
          )}
        </section>

        {contact.notes ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
            <p className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-foreground/90">{contact.notes}</p>
          </section>
        ) : null}

        {profileHref ? (
          <Button asChild variant="outline" className="w-full">
            <Link to={profileHref}>
              <UserRound className="h-4 w-4" /> View profile
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
