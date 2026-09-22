import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Building2,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import { MakeReferralButton } from "@/components/public/MakeReferralButton";
import { orgPublicPath, programPublicPath } from "@/lib/public-urls";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import {
  initialsFromName,
  locationLine,
  primaryTerritory,
  professionalPath,
  type ProfessionalFacility,
  type ProfessionalProfileData,
  type SharedProfessionalConnections,
} from "@/lib/professional-network";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import { cn } from "@/lib/utils";

export type ProfileFacility = ProfessionalFacility & {
  image_urls?: string[];
  short_description?: string | null;
  tagline?: string | null;
  description?: string | null;
};

export type BdProfileMetrics = {
  facilities: number;
  inNetwork: number;
};

type TabId = "overview" | "facilities" | "insurance" | "about";

interface Props {
  profile: ProfessionalProfileData;
  facilities: ProfileFacility[];
  payers: string[];
  metrics: BdProfileMetrics;
  isSelf: boolean;
  canConnect: boolean;
  canSave: boolean;
  saved: boolean;
  saveBusy: boolean;
  connectBusy: boolean;
  shared: SharedProfessionalConnections;
  onConnect: () => void;
  onAccept: () => void;
  onCopyLink: () => void;
  onToggleSave: () => void;
}

export function BdProfileView({
  profile,
  facilities,
  payers,
  metrics,
  isSelf,
  canConnect,
  canSave,
  saved,
  saveBusy,
  connectBusy,
  shared,
  onConnect,
  onAccept,
  onCopyLink,
  onToggleSave,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const name = profile.full_name || "CenterLinked professional";
  const place = locationLine(profile.city || profile.organization?.hq_city, profile.state || profile.organization?.hq_state);
  const tel = sanitizePhone(profile.phone);
  const displayPhone = formatPhoneDisplay(profile.phone) || formatPhoneDisplay(tel);
  const email = profile.email?.trim() || "";
  const orgHref = profile.organization?.slug ? orgPublicPath(profile.organization.slug) : null;
  const territory = primaryTerritory(profile, facilities);
  const years = profile.years_in_bh;
  const bio = profile.bio?.trim() || "";
  const canRefer = Boolean(tel || email);
  const canShare = Boolean(profile.user_id);

  return (
    <div className="mx-auto w-full min-w-0 space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-1 items-start gap-4 lg:gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary ring-1 ring-border sm:h-24 sm:w-24 sm:text-2xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsFromName(name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="break-words font-heading text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                  {profile.job_title ? <p className="mt-1 text-sm font-medium text-foreground/80">{profile.job_title}</p> : null}
                  {profile.organization ? (
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm">
                      {orgHref ? (
                        <Link to={orgHref} className="truncate font-medium text-primary hover:underline">
                          {profile.organization.name}
                        </Link>
                      ) : (
                        <span className="truncate font-medium">{profile.organization.name}</span>
                      )}
                      {profile.organization.verified ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified organization" />
                      ) : null}
                    </div>
                  ) : null}
                  {place ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {place}
                    </p>
                  ) : null}
                  {shared.count > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shared.count} shared {shared.count === 1 ? "connection" : "connections"}
                    </p>
                  ) : null}
                </div>
                {profile.organization?.logo_url ? (
                  <img
                    src={profile.organization.logo_url}
                    alt=""
                    className="hidden h-14 w-14 rounded-xl bg-background object-contain p-1 ring-1 ring-border lg:block"
                  />
                ) : null}
              </div>
              {bio ? (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/80">
                  <span className="line-clamp-2">{bio}</span>
                  {bio.length > 140 ? (
                    <button
                      type="button"
                      className="ml-1 font-medium text-primary hover:underline"
                      onClick={() => setTab("about")}
                    >
                      Read more
                    </button>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end lg:pt-1">
                {isSelf ? (
                  <Button asChild>
                    <Link to="/app/settings">
                      <Pencil className="h-4 w-4" />
                      Edit profile
                    </Link>
                  </Button>
                ) : (
                  <>
                    {canRefer ? (
                      <MakeReferralButton
                        name={name}
                        phone={profile.phone}
                        email={email}
                        organizationId={profile.organization?.id}
                        variant="default"
                      />
                    ) : null}
                    {canConnect ? (
                      <ConnectButton
                        status={profile.connection_status}
                        busy={connectBusy}
                        onConnect={onConnect}
                        onAccept={onAccept}
                      />
                    ) : null}
                  </>
                )}
                {tel ? (
                  <IconAction href={`tel:${tel}`} label="Call">
                    <Phone className="h-4 w-4" />
                  </IconAction>
                ) : null}
                {email ? (
                  <IconAction href={`mailto:${email}`} label="Email">
                    <Mail className="h-4 w-4" />
                  </IconAction>
                ) : null}
                {canSave ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onToggleSave}
                    disabled={saveBusy}
                    aria-pressed={saved}
                  >
                    <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                    {saved ? "Saved" : "Save"}
                  </Button>
                ) : null}
                {canShare ? (
                  <Button type="button" variant="outline" size="sm" onClick={onCopyLink}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                ) : null}
              </div>
        </div>

        <dl className="grid grid-cols-2 border-t border-border/70 sm:flex">
          <Stat value={metrics.facilities} label={metrics.facilities === 1 ? "Facility" : "Facilities"} />
          <Stat value={metrics.inNetwork} label={metrics.inNetwork === 1 ? "Insurance network" : "Insurance networks"} />
          {years != null ? <Stat value={years} label={years === 1 ? "Year in BH" : "Years in BH"} /> : null}
          {territory ? (
            <div className="border-border/70 px-5 py-4 sm:min-w-0 sm:flex-1 sm:border-l sm:px-6">
              <dt className="text-xs text-muted-foreground">Primary territory</dt>
              <dd className="mt-0.5 font-heading text-sm font-semibold leading-tight">{territory}</dd>
            </div>
          ) : null}
        </dl>
        {profile.organization || displayPhone || email ? (
          <div className="hidden flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 px-6 py-3 text-sm lg:flex">
            {profile.organization ? (
              orgHref ? (
                <Link to={orgHref} className="inline-flex min-w-0 items-center gap-2 font-medium hover:text-primary">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{profile.organization.name}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {profile.organization.name}
                </span>
              )
            ) : null}
            {displayPhone && tel ? (
              <a href={`tel:${tel}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {displayPhone}
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-2 text-muted-foreground hover:text-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{email}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)} className="space-y-5">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border/70 bg-transparent p-0">
              <ProfileTab value="overview">Overview</ProfileTab>
              <ProfileTab value="facilities">Facilities</ProfileTab>
              <ProfileTab value="insurance">Insurance</ProfileTab>
              <ProfileTab value="about">About</ProfileTab>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-5">
              <FacilitiesSection
                facilities={facilities}
                orgSlug={profile.organization?.slug}
                contactName={name}
                phone={profile.phone}
                email={email}
                organizationId={profile.organization?.id}
                preview
                onSeeAll={() => setTab("facilities")}
              />
              <InsuranceSection payers={payers} preview onSeeAll={() => setTab("insurance")} />
              {canRefer && !isSelf ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Need to check coverage or find the right program? Send a referral and this team will help verify benefits.
                  </p>
                  <MakeReferralButton
                    name={name}
                    phone={profile.phone}
                    email={email}
                    organizationId={profile.organization?.id}
                    variant="default"
                  />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="facilities" className="mt-0">
              <FacilitiesSection
                facilities={facilities}
                orgSlug={profile.organization?.slug}
                contactName={name}
                phone={profile.phone}
                email={email}
                organizationId={profile.organization?.id}
              />
            </TabsContent>

            <TabsContent value="insurance" className="mt-0">
              <InsuranceSection payers={payers} />
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <AboutCard bio={bio} />
            </TabsContent>
      </Tabs>

      <aside className="space-y-4 lg:hidden">
          {bio ? <AboutCard bio={bio} compact /> : null}
          {profile.organization ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-sm font-semibold">Organization</h2>
              {orgHref ? (
                <Link to={orgHref} className="-mx-1 mt-3 flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted/60">
                  <OrgMark org={profile.organization} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{profile.organization.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[profile.organization.hq_city, profile.organization.hq_state].filter(Boolean).join(", ") || "View organization"}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="mt-3 font-medium">{profile.organization.name}</p>
              )}
              {orgHref ? (
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <Link to={orgHref}>View organization</Link>
                </Button>
              ) : null}
            </section>
          ) : null}

          {displayPhone || email || place ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-sm font-semibold">Contact information</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {displayPhone && tel ? (
                  <li>
                    <a href={`tel:${tel}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {displayPhone}
                    </a>
                  </li>
                ) : null}
                {email ? (
                  <li>
                    <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{email}</span>
                    </a>
                  </li>
                ) : null}
                {place ? (
                  <li className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {place}
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {canConnect || shared.count > 0 ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-sm font-semibold">Network connection</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.connection_status === "accepted"
                  ? "You are connected."
                  : profile.connection_status === "pending_out" || profile.connection_status === "pending"
                    ? "Invite sent. Waiting for them to accept."
                    : profile.connection_status === "pending_in"
                      ? "They invited you to connect."
                      : "Not connected yet."}
              </p>
              {shared.count > 0 ? (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {shared.people.slice(0, 3).map((person) => (
                      <Link
                        key={person.user_id}
                        to={professionalPath(person.user_id)}
                        className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary ring-2 ring-card"
                        title={person.full_name || "Professional"}
                      >
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initialsFromName(person.full_name)
                        )}
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {shared.count} shared {shared.count === 1 ? "connection" : "connections"}
                  </p>
                </div>
              ) : null}
              {canConnect ? (
                <div className="mt-3">
                  <ConnectButton
                    status={profile.connection_status}
                    busy={connectBusy}
                    onConnect={onConnect}
                    onAccept={onAccept}
                    className="w-full justify-center"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {canShare ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-sm font-semibold">Share profile</h2>
              <p className="mt-2 text-sm text-muted-foreground">Copy a connect link to share this profile with your team.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={onCopyLink}>
                <Share2 className="h-4 w-4" />
                Copy link
              </Button>
            </section>
          ) : null}
      </aside>
    </div>
  );
}

function ProfileTab({ value, children }: { value: TabId; children: string }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      {children}
    </TabsTrigger>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-border/70 px-5 py-4 sm:min-w-0 sm:flex-1 sm:border-l sm:px-6 sm:first:border-l-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-heading text-2xl font-bold tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

function IconAction({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="icon" className="h-9 w-9" aria-label={label}>
      <a href={href}>{children}</a>
    </Button>
  );
}

function AboutCard({ bio, compact = false }: { bio: string; compact?: boolean }) {
  if (!bio) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
        No about section yet.
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="font-heading text-sm font-semibold">About</h2>
      <p className={cn("mt-3 text-sm leading-relaxed text-foreground/85", compact && "line-clamp-6")}>{bio}</p>
    </section>
  );
}

function OrgMark({ org }: { org: NonNullable<ProfessionalProfileData["organization"]> }) {
  if (org.logo_url) {
    return <img src={org.logo_url} alt="" className="h-11 w-11 rounded-xl bg-background object-contain p-1 ring-1 ring-border" />;
  }
  return (
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
      {initialsFromName(org.name)}
    </div>
  );
}

function FacilitiesSection({
  facilities,
  orgSlug,
  contactName,
  phone,
  email,
  organizationId,
  preview = false,
  onSeeAll,
}: {
  facilities: ProfileFacility[];
  orgSlug?: string | null;
  contactName: string;
  phone?: string | null;
  email?: string;
  organizationId?: string;
  preview?: boolean;
  onSeeAll?: () => void;
}) {
  const shown = preview ? facilities.slice(0, 3) : facilities;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Facilities I represent</h2>
          <p className="text-xs text-muted-foreground">
            {facilities.length} {facilities.length === 1 ? "location" : "locations"}
          </p>
        </div>
        {preview && facilities.length > 3 && onSeeAll ? (
          <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={onSeeAll}>
            View all ({facilities.length})
          </button>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No facilities listed for this representative yet.
        </div>
      ) : (
        <div className={cn(
          "grid gap-4",
          shown.length <= 1 && "max-w-xl grid-cols-1",
          shown.length === 2 && "sm:grid-cols-2",
          shown.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}>
          {shown.map((facility) => (
            <ProfileFacilityCard
              key={facility.id}
              facility={facility}
              href={facility.slug && orgSlug ? programPublicPath(facility.slug, orgSlug) : null}
              contactName={contactName}
              phone={phone}
              email={email}
              organizationId={organizationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileFacilityCard({
  facility,
  href,
  contactName,
  phone,
  email,
  organizationId,
}: {
  facility: ProfileFacility;
  href: string | null;
  contactName: string;
  phone?: string | null;
  email?: string;
  organizationId?: string;
}) {
  const imageUrl = facility.image_urls?.[0] ?? null;
  const stateLabel = facility.state ? stateDisplayName(resolveStateCode(facility.state) ?? facility.state) : null;
  const place = [facility.city, stateLabel].filter(Boolean).join(", ");
  const levels = (facility.levels_of_care ?? []).filter(Boolean).slice(0, 4);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative aspect-[16/10] bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <Building2 className="h-8 w-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{facility.name}</h3>
          {place ? <p className="mt-0.5 text-xs text-muted-foreground">{place}</p> : null}
        </div>
        {levels.length ? (
          <div className="flex flex-wrap gap-1.5">
            {levels.map((level) => (
              <span key={level} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                {level}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-2">
          {href ? (
            <Button asChild variant="outline" size="sm">
              <Link to={href}>View facility</Link>
            </Button>
          ) : null}
          <MakeReferralButton name={contactName} phone={phone} email={email} organizationId={organizationId} />
        </div>
      </div>
    </article>
  );
}

function InsuranceSection({
  payers,
  preview = false,
  onSeeAll,
}: {
  payers: string[];
  preview?: boolean;
  onSeeAll?: () => void;
}) {
  const shown = preview ? payers.slice(0, 12) : payers;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Insurance networks</h2>
          <p className="text-xs text-muted-foreground">In-network with major payers. Coverage can vary by facility.</p>
        </div>
        {preview && payers.length > 12 && onSeeAll ? (
          <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={onSeeAll}>
            View all ({payers.length})
          </button>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No in-network insurance listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((payer) => (
            <div key={payer} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initialsFromName(payer)}
              </span>
              <span className="truncate text-sm font-medium">{payer}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
