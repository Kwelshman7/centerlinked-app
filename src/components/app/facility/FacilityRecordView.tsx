import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, Check, ChevronLeft, ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/app/search/VerificationBadge";
import { MakeReferralButton } from "@/components/public/MakeReferralButton";
import { BdContactLine } from "@/components/app/search/BdContactLine";
import type { FacilitySheetData, SheetContract, SheetOrg } from "@/components/public/FacilitySheetView";
import { displayAccreditations } from "@/lib/accreditations";
import { categorizeFacilityTags, PROGRAM_SECTIONS } from "@/lib/facility-program-tags";
import { OUT_OF_NETWORK_ONLY_LABEL } from "@/lib/insurance-contract-status";
import { initialsFromName } from "@/lib/professional-network";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { planTypeShortLabel, sanitizePlanTypes } from "@/lib/plan-types";
import { useNearbyCities } from "@/hooks/useNearbyCities";

type TabId = "overview" | "insurance" | "program" | "about";

export type FacilityExtraRep = {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  territory: string | null;
  availability_status: string | null;
};

type PayerRow = {
  name: string;
  plans: string;
};

interface Props {
  facility: FacilitySheetData;
  org: SheetOrg | null;
  contracts: SheetContract[];
  outOfNetworkOnly?: boolean;
  extraReps?: FacilityExtraRep[];
  orgHref?: string | null;
  headerActions?: ReactNode;
  verifiedAt?: string | null;
  frozen?: boolean | null;
}

export function FacilityRecordView({
  facility,
  org,
  contracts,
  outOfNetworkOnly = false,
  extraReps = [],
  orgHref = null,
  headerActions,
  verifiedAt,
  frozen,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const images = (facility.image_urls ?? []).filter(Boolean);
  const payers = payerRows(contracts);
  const levels = (facility.levels_of_care ?? []).filter((level) => level.trim());
  const programTags = categorizeFacilityTags(facility);
  const programSections = PROGRAM_SECTIONS.filter(({ kind }) => programTags[kind].length > 0);
  const accreditations = displayAccreditations(facility.accreditations);
  const repName = facility.bd_contact_name?.trim() || org?.bd_contact_name?.trim() || "";
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email?.trim() || org?.bd_contact_email?.trim() || "";
  const tel = sanitizePhone(repPhone);
  const displayPhone = formatPhoneDisplay(repPhone);
  const place = [[facility.city, facility.state].filter(Boolean).join(", "), facility.zip].filter(Boolean).join(" ");
  const about = facility.description?.trim() || facility.short_description?.trim() || facility.tagline?.trim() || "";
  const canRefer = Boolean(tel || repEmail);

  return (
    <div className="mx-auto w-full min-w-0 space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
          <FacilityMark name={facility.name} imageUrl={images[0]} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="break-words font-heading text-2xl font-bold tracking-tight sm:text-3xl">{facility.name}</h1>
              {tel ? (
                <IconAction href={`tel:${tel}`} label={`Call ${repName || facility.name}`}>
                  <Phone className="h-4 w-4" />
                </IconAction>
              ) : null}
              {repEmail ? (
                <IconAction href={`mailto:${repEmail}`} label={`Email ${repName || facility.name}`}>
                  <Mail className="h-4 w-4" />
                </IconAction>
              ) : null}
            </div>
            {org?.name ? (
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm">
                {orgHref ? (
                  <Link to={orgHref} className="truncate font-medium text-primary hover:underline">
                    {org.name}
                  </Link>
                ) : (
                  <span className="truncate font-medium">{org.name}</span>
                )}
                {org.verified ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified organization" /> : null}
              </div>
            ) : null}
            {place ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {place}
              </p>
            ) : null}
            {repName ? <p className="mt-1 text-sm text-muted-foreground">BD contact · {repName}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <VerificationBadge verifiedAt={verifiedAt} frozen={frozen} size="md" />
              {outOfNetworkOnly ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-950">
                  {OUT_OF_NETWORK_ONLY_LABEL}
                </span>
              ) : null}
              {levels.map((level) => (
                <span
                  key={level}
                  className="inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground/90"
                >
                  {level}
                </span>
              ))}
            </div>
            {headerActions ? <div className="mt-4 flex flex-wrap items-center gap-2">{headerActions}</div> : null}
          </div>
          {org ? <OrgColumn org={org} href={orgHref} /> : null}
        </div>

        <dl className="grid grid-cols-2 border-t border-border/70 sm:flex">
          <Stat value={payers.length} label={payers.length === 1 ? "Insurance network" : "Insurance networks"} />
          <Stat value={levels.length} label={levels.length === 1 ? "Level of care" : "Levels of care"} />
          {place ? (
            <div className="col-span-2 border-t border-border/70 px-5 py-4 sm:col-span-1 sm:min-w-0 sm:flex-1 sm:border-l sm:border-t-0 sm:px-6">
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="mt-0.5 font-heading text-sm font-semibold leading-tight">{place}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)} className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0">
          <RecordTab value="overview">Overview</RecordTab>
          <RecordTab value="insurance">Insurance</RecordTab>
          <RecordTab value="program">Program</RecordTab>
          <RecordTab value="about">About</RecordTab>
        </TabsList>

        <TabsContent value="overview" className="mt-0 min-w-0 space-y-5">
          <PhotoStrip images={images} name={facility.name} />
          {about ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-base font-semibold">About this program</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                <span className="line-clamp-3">{about}</span>
                {about.length > 180 ? (
                  <button type="button" className="ml-1 font-medium text-primary hover:underline" onClick={() => setTab("about")}>
                    Read more
                  </button>
                ) : null}
              </p>
            </section>
          ) : null}
          <InsuranceGrid
            payers={payers}
            outOfNetworkOnly={outOfNetworkOnly}
            preview
            onSeeAll={() => setTab("insurance")}
          />
          {canRefer ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{repName || "BD contact"}</p>
                <p className="text-sm text-muted-foreground">Call or email to check coverage and send a referral.</p>
              </div>
              <MakeReferralButton
                name={repName || facility.name}
                phone={repPhone}
                email={repEmail}
                organizationId={org?.id}
                variant="default"
              />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="insurance" className="mt-0">
          <InsuranceGrid payers={payers} outOfNetworkOnly={outOfNetworkOnly} />
        </TabsContent>

        <TabsContent value="program" className="mt-0 space-y-5">
          {programSections.length === 0 && accreditations.length === 0 ? (
            <EmptyNote>No program details listed yet.</EmptyNote>
          ) : (
            <>
              {programSections.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {programSections.map(({ kind, title }) => (
                    <section key={kind} className="rounded-2xl border border-border/70 bg-card p-5">
                      <h2 className="font-heading text-sm font-semibold">{title}</h2>
                      <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
                        {programTags[kind].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : null}
              {accreditations.length > 0 ? (
                <section className="rounded-2xl border border-border/70 bg-card p-5">
                  <h2 className="font-heading text-sm font-semibold">Accreditations</h2>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {accreditations.map((item) => (
                      <li key={item}>
                        <span className="inline-flex rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-0 space-y-5">
          {about ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="font-heading text-sm font-semibold">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{about}</p>
            </section>
          ) : (
            <EmptyNote>No description yet.</EmptyNote>
          )}
          <LocationSection facility={facility} />
          {extraReps.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-heading text-base font-semibold">Additional BD contacts</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {extraReps.map((rep) => (
                  <div key={rep.id} className="rounded-2xl border border-border/70 bg-card p-4">
                    <BdContactLine name={rep.full_name} phone={rep.phone} email={rep.email} title={rep.title} />
                    {rep.territory || rep.availability_status ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[rep.territory, rep.availability_status].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function payerRows(contracts: SheetContract[]): PayerRow[] {
  const map = new Map<string, { name: string; plans: Set<string> }>();
  for (const contract of contracts) {
    if (!contract.in_network) continue;
    const name = contract.payer_name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const row = map.get(key) ?? { name, plans: new Set<string>() };
    for (const slug of sanitizePlanTypes(contract.plan_types)) row.plans.add(planTypeShortLabel(slug));
    map.set(key, row);
  }
  return [...map.values()]
    .map((row) => ({ name: row.name, plans: [...row.plans].join(", ") }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function FacilityMark({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:h-20 sm:w-28">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground" aria-label={name}>
          <Building2 className="h-6 w-6" aria-hidden />
        </div>
      )}
    </div>
  );
}

function OrgColumn({ org, href }: { org: SheetOrg; href: string | null }) {
  const mark = org.logo_url ? (
    <img src={org.logo_url} alt={org.name} className="h-auto w-auto max-h-10 max-w-full object-contain sm:max-h-12 lg:max-h-24" />
  ) : (
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary lg:h-16 lg:w-16 lg:text-base">
      {initialsFromName(org.name)}
    </div>
  );
  return (
    <div className="hidden w-36 shrink-0 flex-col items-center gap-2 text-center sm:flex lg:w-56 lg:self-stretch lg:justify-start lg:border-l lg:border-border/70 lg:pl-6">
      {href ? (
        <Link to={href} className="block max-w-full" aria-label={org.name}>
          {mark}
        </Link>
      ) : (
        mark
      )}
    </div>
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
    <Button asChild variant="outline" size="icon" className="h-9 w-9">
      <a href={href} aria-label={label}>
        {children}
      </a>
    </Button>
  );
}

function RecordTab({ value, children }: { value: TabId; children: string }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      {children}
    </TabsTrigger>
  );
}

function InsuranceGrid({
  payers,
  outOfNetworkOnly,
  preview = false,
  onSeeAll,
}: {
  payers: PayerRow[];
  outOfNetworkOnly: boolean;
  preview?: boolean;
  onSeeAll?: () => void;
}) {
  const shown = preview ? payers.slice(0, 10) : payers;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Insurance networks</h2>
          <p className="text-xs text-muted-foreground">In-network contracts for this program. Coverage can vary by plan.</p>
        </div>
        {preview && payers.length > 10 && onSeeAll ? (
          <button type="button" className="shrink-0 text-xs font-medium text-primary hover:underline" onClick={onSeeAll}>
            View all ({payers.length})
          </button>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <EmptyNote>{outOfNetworkOnly ? OUT_OF_NETWORK_ONLY_LABEL : "No in-network insurance listed yet."}</EmptyNote>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((payer) => (
            <div key={payer.name} className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initialsFromName(payer.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{payer.name}</span>
                {payer.plans ? <span className="block truncate text-xs text-muted-foreground">{payer.plans}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PhotoStrip({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  const current = images[Math.min(index, images.length - 1)];
  const many = images.length > 1;
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="relative aspect-[16/8] bg-muted sm:aspect-[21/8]">
        <img src={current} alt={`${name} photo ${index + 1} of ${images.length}`} className="h-full w-full object-cover" />
        {many ? (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm"
              onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm"
              onClick={() => setIndex((value) => (value + 1) % images.length)}
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {index + 1}/{images.length}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function LocationSection({ facility }: { facility: FacilitySheetData }) {
  const { cities, loading } = useNearbyCities(facility.city, facility.state);
  const street = facility.address_line1?.trim() || "";
  const cityState = [facility.city, facility.state].filter(Boolean).join(", ");
  const line = [street, cityState, facility.zip].filter(Boolean).join(", ");
  const website = facility.website?.trim() || "";
  const phone = formatPhoneDisplay(facility.phone);
  const tel = sanitizePhone(facility.phone);
  if (!line && !website && !phone) return null;
  const query = `${facility.name} ${line}`.trim();
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-sm font-semibold">Location</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
        {line ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-36 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60"
          >
            <iframe
              title={`Map for ${facility.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=11&output=embed`}
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </a>
        ) : null}
        <div className="min-w-0 space-y-2 text-sm">
          {line ? (
            <a href={mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 hover:text-primary">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{line}</span>
            </a>
          ) : null}
          {phone && tel ? (
            <a href={`tel:${tel}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </a>
          ) : null}
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer" className="block truncate text-primary hover:underline">
              {website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {loading ? (
            <p className="text-xs text-muted-foreground">Finding nearby cities…</p>
          ) : cities.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
              {cities.map((city) => (
                <li key={city} className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {city}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
