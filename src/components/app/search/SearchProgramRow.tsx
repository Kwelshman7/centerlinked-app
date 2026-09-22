import { Link } from "react-router-dom";
import { Building2, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { programPublicPath } from "@/lib/public-urls";
import { formatPlanTypeList } from "@/lib/plan-types";
import { sanitizePhone } from "@/lib/phone";
import { InsuranceMatchBadge } from "@/components/app/search/InsuranceMatchBadge";
import { BdContactLine } from "@/components/app/search/BdContactLine";
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
  const thumb = f.image_urls?.[0] || orgLogo;
  const levels = (f.levels_of_care ?? []).slice(0, 4);
  const payerLabel = f.matched_payer
    ? f.matched_plan_types?.length
      ? `${f.matched_payer} — ${formatPlanTypeList(f.matched_plan_types)}`
      : f.matched_payer
    : null;
  const hasReferralContact = Boolean(sanitizePhone(f.bd_contact_phone) || f.bd_contact_email?.trim());

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-3 bg-card px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5",
        preferred && "bg-primary/[0.03]",
      )}
    >
      <Link
        to={href}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40 sm:h-[4.5rem] sm:w-[4.5rem]"
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-base font-semibold leading-snug">
              <Link to={href} className="hover:text-primary">
                {f.name}
              </Link>
            </h2>
            {preferred ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                Preferred
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {orgSlug ? (
              <Link to={`/o/${orgSlug}`} className="hover:text-foreground">
                {orgName}
              </Link>
            ) : (
              orgName
            )}
          </p>
          {place ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {place}
            </p>
          ) : null}
        </div>

        {levels.length > 0 ? (
          <ul className="flex flex-wrap gap-1">
            {levels.map((level) => (
              <li
                key={level}
                className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
              >
                {level}
              </li>
            ))}
          </ul>
        ) : null}

        {f.insurance_match_status && f.insurance_match_status !== "unknown" ? (
          <div className="space-y-0.5">
            <InsuranceMatchBadge status={f.insurance_match_status} payerName={payerLabel} />
            {f.insurance_match_status === "verified" && f.insurance_verified_at ? (
              <p className="text-[11px] text-muted-foreground">
                Verified {new Date(f.insurance_verified_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : payerLabel ? (
          <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            {payerLabel}
          </span>
        ) : null}

        <BdContactLine
          name={f.bd_contact_name}
          phone={f.bd_contact_phone}
          email={f.bd_contact_email}
          title={f.bd_contact_title}
          verifiedAt={f.bd_contact_verified_at}
          avatarUrl={avatarUrl ?? f.bd_contact_avatar}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        {hasReferralContact ? (
          <MakeReferralButton
            name={f.bd_contact_name}
            phone={f.bd_contact_phone}
            email={f.bd_contact_email}
            organizationId={organizationId}
            variant="default"
          />
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link to={href}>Program</Link>
        </Button>
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
    </article>
  );
}
