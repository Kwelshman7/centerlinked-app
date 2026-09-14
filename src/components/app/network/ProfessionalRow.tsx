import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { initialsFromName, locationLine, professionalPath, type ProfessionalCard } from "@/lib/professional-network";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface Props {
  person: ProfessionalCard;
  trailing?: ReactNode;
  className?: string;
  showActions?: boolean;
}

function ActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-border/70 bg-background text-primary grid place-items-center shrink-0 hover:border-primary/40 hover:bg-primary/8 transition-colors"
    >
      {children}
    </a>
  );
}

export function ProfessionalRow({ person, trailing, className, showActions = false }: Props) {
  const name = person.full_name || "CenterLinked professional";
  const orgLine = person.organization?.name || "Independent";
  const place = locationLine(
    person.city || person.organization?.hq_city,
    person.state || person.organization?.hq_state,
  );
  const tel = sanitizePhone(person.phone);
  const email = person.email?.trim();
  const hasActions = showActions && !!(tel || email);

  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-accent/40 active:bg-accent/60 transition-colors", className)}>
      <Link
        to={professionalPath(person.user_id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-primary/10 text-primary overflow-hidden grid place-items-center text-sm font-semibold shrink-0 ring-1 ring-primary/10">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsFromName(name)
          )}
          {person.organization?.logo_url ? (
            <img
              src={person.organization.logo_url}
              alt=""
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-background object-contain ring-2 ring-background"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-[15px] sm:text-sm leading-tight truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[person.job_title, orgLine].filter(Boolean).join(" · ")}
          </p>
          {place ? <p className="text-[11px] text-muted-foreground/90 truncate">{place}</p> : null}
        </div>
      </Link>
      {hasActions ? (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {tel ? (
            <>
              <ActionLink href={`tel:${tel}`} label={`Call ${name}`}>
                <Phone className="h-3.5 w-3.5" />
              </ActionLink>
              <ActionLink href={`sms:${tel}`} label={`Text ${formatPhoneDisplay(person.phone) || name}`}>
                <MessageSquare className="h-3.5 w-3.5" />
              </ActionLink>
            </>
          ) : null}
          {email ? (
            <ActionLink href={`mailto:${email}`} label={`Email ${name}`}>
              <Mail className="h-3.5 w-3.5" />
            </ActionLink>
          ) : null}
        </div>
      ) : null}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
