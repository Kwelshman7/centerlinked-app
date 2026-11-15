import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { programPublicPath } from "@/lib/public-urls";
import { formatPlanTypeList } from "@/lib/plan-types";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { hasAssignedBdContact } from "@/lib/bd-contact";
import { initialsFromName } from "@/lib/professional-network";
import { InsuranceMatchBadge } from "@/components/app/search/InsuranceMatchBadge";
import { MakeReferralButton } from "@/components/public/MakeReferralButton";
import { Button } from "@/components/ui/button";
import type { OrgSearchFacility } from "@/components/app/search/OrgResultCard";

export function SearchProgramRow({
  facility: f,
  orgName,
  orgSlug,
  orgLogo,
  organizationId,
  preferred,
  onTogglePreferred,
  preferredBusy,
  avatarUrl,
}: {
  facility: OrgSearchFacility;
  orgName: string;
  orgSlug: string | null;
  orgLogo: string | null;
  organizationId: string;
  preferred: boolean;
  onTogglePreferred?: () => void;
  preferredBusy?: boolean;
  avatarUrl?: string;
}) {
  const href = f.slug ? programPublicPath(f.slug, orgSlug) : `/app/facilities/${f.id}`;
  const place = [f.city, f.state].filter(Boolean).join(", ");
  const levels = (f.levels_of_care ?? []).slice(0, 3);
  const payerLabel = f.matched_payer
    ? f.matched_plan_types?.length
      ? `${f.matched_payer} — ${formatPlanTypeList(f.matched_plan_types)}`
      : f.matched_payer
    : null;
  const tel = sanitizePhone(f.bd_contact_phone);
  const email = f.bd_contact_email?.trim() || "";
  const hasPerson = hasAssignedBdContact({
    bd_contact_name: f.bd_contact_name,
    bd_contact_phone: f.bd_contact_phone,
    bd_contact_email: f.bd_contact_email,
  });
  const photo = avatarUrl ?? f.bd_contact_avatar ?? null;
  const personName =
    f.bd_contact_name?.trim() || (tel || email ? "BD contact" : "No BD contact yet");

  return (
    <article className={cn("bg-card px-4 py-3 sm:px-5", preferred && "bg-primary/[0.04]")}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : hasPerson ? (
            initialsFromName(personName)
          ) : orgLogo ? (
            <img src={orgLogo} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            initialsFromName(orgName)
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-base font-semibold leading-snug">{personName}</h2>
            {preferred ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                Preferred
              </span>
            ) : null}
          </div>
          {f.bd_contact_title?.trim() ? (
            <p className="text-sm text-muted-foreground">{f.bd_contact_title}</p>
          ) : null}
          {tel || email ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {tel ? (
                <a href={`tel:${tel}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {formatPhoneDisplay(f.bd_contact_phone) || f.bd_contact_phone}
                </a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{email}</span>
                </a>
              ) : null}
            </p>
          ) : null}

          <p className="mt-2 text-sm">
            <Link to={href} className="font-medium hover:text-primary">
              {f.name}
            </Link>
            <span className="text-muted-foreground">
              {" · "}
              {orgSlug ? (
                <Link to={`/o/${orgSlug}`} className="hover:text-foreground">
                  {orgName}
                </Link>
              ) : (
                orgName
              )}
            </span>
          </p>
          {place ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {place}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {levels.map((level) => (
              <span
                key={level}
                className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
              >
                {level}
              </span>
            ))}
            {f.insurance_match_status && f.insurance_match_status !== "unknown" ? (
              <InsuranceMatchBadge status={f.insurance_match_status} payerName={payerLabel} />
            ) : payerLabel ? (
              <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                {payerLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {tel || email ? (
            <MakeReferralButton
              name={f.bd_contact_name}
              phone={f.bd_contact_phone}
              email={f.bd_contact_email}
              organizationId={organizationId}
              variant="default"
            />
          ) : null}
          {onTogglePreferred ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={preferredBusy}
              onClick={onTogglePreferred}
              aria-label={preferred ? "Remove preferred provider" : "Mark as preferred provider"}
            >
              <Star className={cn("h-3.5 w-3.5", preferred && "fill-current text-primary")} />
              <span className="hidden sm:inline">{preferred ? "Preferred" : "Prefer"}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
