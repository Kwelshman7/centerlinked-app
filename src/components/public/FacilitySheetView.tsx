import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  ChevronRight,
  User,
  Award,
  Check,
  Pencil,
  ImageIcon,
  X,
  ChevronLeft,
  Phone,
  Mail,
} from "lucide-react";
import { EditPhotosDialog } from "@/components/public/FacilityPhotoGallery";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { OrgHeroContactCard } from "@/components/public/OrgHeroContactCard";
import { ExpandableText } from "@/components/public/ExpandableText";
import { useOrgBrandColor } from "@/hooks/useOrgBrandColor";
import { useNearbyCities } from "@/hooks/useNearbyCities";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";
import { uniqueAccreditations } from "@/lib/accreditations";
import { categorizeFacilityTags, PROGRAM_SECTIONS } from "@/lib/facility-program-tags";
import { formatPlanTypeList, sanitizePlanTypes } from "@/lib/plan-types";

/** Stacked hero photo on phones. Desktop fills the image half instead. */
const HERO_IMAGE_HEIGHT = "h-[200px] sm:h-[220px] lg:h-full";
const HERO_THUMB_SIZE = "h-10 w-10 sm:h-11 sm:w-11";

export interface FacilitySheetData {
  id: string;
  name: string;
  slug: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  image_urls: string[];
  levels_of_care: string[];
  population_served: string[];
  specializations: string[];
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  description?: string | null;
  tagline?: string | null;
  updated_at?: string | null;
  highlights?: string[] | null;
  accreditations?: string[] | null;
  phone?: string | null;
  insurance_status?: string | null;
  treatment_focus?: string | null;
  short_description?: string | null;
  quick_highlights?: string[] | null;
  created_at?: string | null;
  website?: string | null;
}

export interface SheetOrg {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  footer_image_url?: string | null;
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_linkedin_url?: string | null;
  social_x_url?: string | null;
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  website?: string | null;
  tagline?: string | null;
  brand_color?: string | null;
  accent_color?: string | null;
  cover_image_url?: string | null;
  favicon_url?: string | null;
  verified?: boolean | null;
  updated_at?: string | null;
}

export interface SheetContract {
  id: string;
  payer_name: string;
  in_network: boolean;
  payer_logo_url?: string | null;
  plan_types?: string[] | null;
}

interface Props {
  facility: FacilitySheetData;
  org: SheetOrg | null;
  contracts: SheetContract[];
  mode: "public" | "internal";
  updatedByName?: string | null;
  contractsHeaderExtra?: React.ReactNode;
  aboutHeaderExtra?: React.ReactNode;
  canEditPhotos?: boolean;
  facilityId?: string;
  onPhotosUpdated?: (images: string[]) => void;
  brandColor?: string;
  coverImageUrl?: string | null;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function SectionHeading({
  title,
  headerExtra,
  brand,
}: {
  title: string;
  headerExtra?: ReactNode;
  brand?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {brand ? (
          <span className="h-5 w-[3px] rounded-full shrink-0" style={{ background: brand }} aria-hidden />
        ) : null}
        <h2 className="font-heading text-base sm:text-[17px] font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {headerExtra ? <div className="print:hidden w-full sm:w-auto min-w-0">{headerExtra}</div> : null}
    </div>
  );
}

function ProgramTagCard({
  title,
  items,
  brand,
}: {
  title: string;
  items: string[];
  brand: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5 sm:p-4 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-4 w-[3px] rounded-full shrink-0" style={{ background: brand }} aria-hidden />
        <h3 className="font-heading text-[13px] sm:text-sm font-bold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5 min-w-0 text-[13px] sm:text-sm text-foreground leading-snug">
            <span className="shrink-0 text-muted-foreground select-none" aria-hidden>
              -
            </span>
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


export function FacilitySheetView({
  facility,
  org,
  contracts,
  mode,
  updatedByName,
  contractsHeaderExtra,
  aboutHeaderExtra,
  canEditPhotos = false,
  facilityId,
  onPhotosUpdated,
  brandColor,
  coverImageUrl,
}: Props) {
  const brand = useOrgBrandColor(org, brandColor);
  const [footerVisible, setFooterVisible] = useState(false);
  const { cities: nearbyCities, loading: nearbyCitiesLoading } = useNearbyCities(facility.city, facility.state);

  const address = [facility.address_line1, [facility.city, facility.state].filter(Boolean).join(", "), facility.zip]
    .filter(Boolean)
    .join(" · ");

  const cityStateZip = [[facility.city, facility.state].filter(Boolean).join(", "), facility.zip].filter(Boolean).join(" ");
  const street = facility.address_line1?.trim().replace(/\.+$/, "") || "";
  const locatedLine = street && cityStateZip
    ? `Located at ${street}, ${cityStateZip}.`
    : street
      ? `Located at ${street}.`
      : cityStateZip
        ? `Located in ${cityStateZip}.`
        : null;

  const inNetworkPayers = contracts.filter((c) => c.in_network);
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name} ${address}`)}`;
  const lastUpdated = fmtDate(facility.updated_at);

  const facilityHasOwnBd = !!(
    facility.bd_contact_name?.trim() &&
    (facility.bd_contact_phone?.trim() || facility.bd_contact_email?.trim())
  );
  const repName = facility.bd_contact_name || org?.bd_contact_name || null;
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email || org?.bd_contact_email || null;
  const cleanPhone = sanitizePhone(repPhone) || null;
  const displayPhone = formatPhoneDisplay(repPhone);
  const hasContact = !!(cleanPhone || repEmail);
  const hasBdForPdf = !!(repName?.trim() || cleanPhone || repEmail);
  const repTitle = facilityHasOwnBd
    ? "Business Development Representative"
    : org?.bd_contact_name
      ? "Organization Business Development Contact"
      : "Business Development Representative";

  /** Mobile sticky bar matches org pages — single Refer a Patient contact sheet. */
  const showMobileActionBar = hasContact;

  const programText =
    facility.description?.trim() ||
    facility.short_description?.trim() ||
    facility.tagline?.trim() ||
    null;

  const accreditations = uniqueAccreditations(facility.accreditations);

  const programTags = categorizeFacilityTags(facility);
  const hasProgramTags = PROGRAM_SECTIONS.some(({ kind }) => programTags[kind].length > 0);

  const hasFactsStrip = (facility.levels_of_care?.length ?? 0) > 0 || contracts.length >= 0;
  const hasServiceArea = !!(address || cityStateZip);

  const tabBarOffset = mode === "internal" ? 64 : 0;

  return (
    <div className={`space-y-5 lg:space-y-6 min-w-0 ${showMobileActionBar ? mobileContactBarPadding(tabBarOffset, footerVisible) : ""}`}>
      {/* Hero */}
      <section className="print-keep-together rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-2 lg:items-stretch print:grid-cols-1 lg:h-[340px] print:h-auto">
          <HeroGallery
            images={facility.image_urls ?? []}
            fallbackImage={coverImageUrl}
            facilityName={facility.name}
            brand={brand}
            canEdit={canEditPhotos}
            facilityId={facilityId ?? facility.id}
            onPhotosUpdated={onPhotosUpdated}
            className="order-1 lg:order-2 print:hidden"
          />

          <div className="p-4 sm:p-5 lg:p-6 flex flex-col min-w-0 order-2 lg:order-1 lg:min-h-0 lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className="relative h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm grid place-items-center"
                  aria-hidden={!org?.logo_url}
                >
                  {org?.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={`${org.name} logo`}
                      className="h-[86%] w-[86%] object-contain"
                    />
                  ) : (
                    <div
                      className="h-full w-full grid place-items-center"
                      style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)` }}
                    >
                      <Building2 className="h-6 w-6 text-white/90" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {mode === "public" && org?.slug && (
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground print:hidden min-w-0">
                      <Link to={`/o/${org.slug}`} className="hover:text-foreground transition-colors underline-offset-2 hover:underline truncate min-w-0">
                        {org.name}
                      </Link>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground truncate">{facility.name}</span>
                    </nav>
                  )}
                  {mode === "public" && org?.name ? (
                    <p className="hidden print:block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                      {org.name}
                    </p>
                  ) : null}
                  <h1 className="font-heading text-[1.375rem] sm:text-2xl lg:text-[1.65rem] font-bold tracking-tight leading-snug mt-0.5 break-words">
                    {facility.name}
                  </h1>
                  {cityStateZip && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: brand }} />
                      <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors break-words">
                        {cityStateZip}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              {aboutHeaderExtra ? <div className="shrink-0 print:hidden">{aboutHeaderExtra}</div> : null}
            </div>

            {programText ? (
              <ExpandableText text={programText} brand={brand} clampLines={3} className="mt-3 min-w-0" />
            ) : null}

            {accreditations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {accreditations.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground/90"
                  >
                    <Award className="h-3 w-3 shrink-0" style={{ color: brand }} aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {lastUpdated ? (
              <p className="mt-auto pt-4 text-xs text-muted-foreground print:pt-3">
                Last updated {lastUpdated}
              </p>
            ) : null}
          </div>
        </div>

        {updatedByName && (
          <div className="border-t border-border/60 bg-muted/30 px-5 sm:px-6 py-2.5 text-xs text-muted-foreground print:hidden">
            Updated by: {updatedByName}
          </div>
        )}
      </section>

      {/* Print-only BD contact — screen UI uses the sidebar / mobile bar */}
      {hasBdForPdf && (
        <section
          className="hidden print:block print-keep-together rounded-xl border bg-card overflow-hidden"
          style={{ borderColor: `${brand}40` }}
          aria-label="Business development contact"
        >
          <div
            className="px-5 py-2.5 border-b"
            style={{ backgroundColor: `${brand}10`, borderColor: `${brand}22` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: brand }}
            >
              Business Development Contact
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div>
              <p className="font-heading text-lg font-bold tracking-tight text-foreground">
                {repName?.trim() || "Referral Contact"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{repTitle}</p>
            </div>
            <dl className="grid gap-2 text-sm">
              {displayPhone ? (
                <div className="flex items-baseline gap-3 min-w-0">
                  <dt className="inline-flex items-center gap-1.5 w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" style={{ color: brand }} aria-hidden />
                    Phone
                  </dt>
                  <dd className="font-medium text-foreground">{displayPhone}</dd>
                </div>
              ) : null}
              {repEmail?.trim() ? (
                <div className="flex items-baseline gap-3 min-w-0">
                  <dt className="inline-flex items-center gap-1.5 w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" style={{ color: brand }} aria-hidden />
                    Email
                  </dt>
                  <dd className="font-medium text-foreground break-all">{repEmail.trim()}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      )}

      {/* Unified details */}
      {(hasFactsStrip || hasProgramTags || hasServiceArea || repName || repEmail || repPhone) && (
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden lg:overflow-visible">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:grid-cols-[minmax(0,1fr)_340px] print:grid-cols-1">
            <div className="min-w-0 divide-y divide-border/50 lg:rounded-l-2xl lg:overflow-hidden lg:border-r lg:border-border/50 print:border-0 print:rounded-none">
              {hasFactsStrip && (
                <div className="print-keep-together px-4 sm:px-6 py-4 sm:py-5 grid gap-6">
                  <div className="min-w-0">
                    <SectionHeading title="In-Network" headerExtra={contractsHeaderExtra} brand={brand} />
                    {inNetworkPayers.length > 0 ? (
                      <ul className="grid grid-cols-2 xl:grid-cols-3 gap-1 print:grid-cols-3">
                        {inNetworkPayers.map((c) => {
                          const types = formatPlanTypeList(sanitizePlanTypes(c.plan_types));
                          const label = types ? `${c.payer_name} — ${types}` : c.payer_name;
                          return (
                            <li key={c.id} className="min-w-0">
                              <span
                                title={label}
                                className="block truncate whitespace-nowrap rounded-md border border-border/50 bg-background px-2 py-1 text-[11px] sm:text-xs font-semibold"
                              >
                                {c.payer_name}
                                {types ? (
                                  <span className="font-normal text-muted-foreground"> — {types}</span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">None listed</p>
                    )}
                  </div>

                  {facility.levels_of_care?.length > 0 && (
                    <div className="min-w-0">
                      <SectionHeading title="Care Levels" brand={brand} />
                      <ul className="flex flex-wrap gap-1.5">
                        {facility.levels_of_care.map((level) => (
                          <li key={level} className="min-w-0">
                            <span className="inline-flex max-w-full items-center rounded-md border border-border bg-background px-2.5 py-1 text-[12px] sm:text-xs font-medium text-foreground leading-snug break-words">
                              {level}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {hasProgramTags && (
                <div className="print-keep-together px-4 sm:px-6 py-4 sm:py-5">
                  <SectionHeading title="Program Details" brand={brand} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PROGRAM_SECTIONS.map(({ kind, title }) => (
                      <ProgramTagCard
                        key={kind}
                        title={title}
                        items={programTags[kind]}
                        brand={brand}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hasServiceArea && (
                <div className="print-keep-together px-4 sm:px-6 py-4 sm:py-5">
                  <SectionHeading title="Service Area" brand={brand} />
                  <div className="grid grid-cols-1 xl:grid-cols-[160px_1fr] gap-4 print:grid-cols-1">
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-[120px] md:h-full md:min-h-[120px] w-full rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group shrink-0 print:hidden"
                    >
                      <iframe
                        title={`Map for ${facility.name}`}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(address || cityStateZip)}&z=11&output=embed`}
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
                    </a>
                    <div className="min-w-0">
                      {locatedLine && (
                        <p className="text-sm text-foreground/80 leading-relaxed mb-2.5 break-words">
                          {locatedLine}
                        </p>
                      )}
                      {nearbyCitiesLoading ? (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 print:hidden">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <li key={i} className="flex items-center gap-2 min-w-0">
                              <div className="h-3 w-3 rounded-full bg-muted animate-pulse shrink-0" />
                              <div className="h-3 flex-1 rounded bg-muted animate-pulse" />
                            </li>
                          ))}
                        </ul>
                      ) : nearbyCities.length > 0 ? (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                          {nearbyCities.map((nearbyCity) => (
                            <li key={nearbyCity} className="flex items-center gap-1.5 text-sm min-w-0">
                              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: brand }} />
                              <span className="break-words">{nearbyCity}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground break-words">
                          Serving communities throughout {facility.state ?? "the surrounding area"}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop sidebar contact — sits at top of section and pops forward */}
            <aside className="hidden lg:block print:hidden relative z-10 lg:sticky lg:top-20 lg:self-start lg:rounded-r-2xl px-4 pt-4 pb-6 xl:px-5 xl:pt-5">
              {hasContact ? (
                <OrgHeroContactCard
                  contacts={[
                    {
                      name: repName || "BD Representative",
                      title: repTitle,
                      location: cityStateZip || null,
                      phone: repPhone,
                      email: repEmail,
                    },
                  ]}
                  organizationId={org?.id}
                  brand={brand}
                  heading="For Referrals"
                  website={org?.website ?? null}
                  size="lg"
                  className="shadow-lg ring-1"
                />
              ) : (
                <div
                  className="rounded-xl border bg-card p-5 sm:p-6 space-y-3 shadow-lg ring-1 ring-black/5 min-w-0"
                  style={{ borderColor: `${brand}38` }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-center"
                    style={{ color: brand }}
                  >
                    For Referrals
                  </p>
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mode === "internal"
                        ? "Assign a BD rep from the org dashboard so referrals have a contact."
                        : "No BD contact on file yet."}
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      {showMobileActionBar && (
        <MobileContactBar
          repName={repName}
          repPhone={repPhone}
          repEmail={repEmail}
          brand={brand}
          organizationId={org?.id}
          ctaLabel="Refer Patient"
          contextLabel={`Reach the BD rep for ${facility.name}.`}
          bottomOffset={tabBarOffset}
          onFooterVisibilityChange={setFooterVisible}
        />
      )}
    </div>
  );
}

function HeroGallery({
  images,
  fallbackImage,
  facilityName,
  brand,
  canEdit,
  facilityId,
  onPhotosUpdated,
  className,
}: {
  images: string[];
  fallbackImage?: string | null;
  facilityName: string;
  brand: string;
  canEdit: boolean;
  facilityId: string;
  onPhotosUpdated?: (images: string[]) => void;
  className?: string;
}) {
  const list = (images ?? []).filter(Boolean);
  const heroImage = list[0] ?? fallbackImage ?? null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const displayImages = list.length > 0 ? list : fallbackImage ? [fallbackImage] : [];
  const currentImage = displayImages[activeIndex] ?? heroImage;
  const hasMany = displayImages.length > 1;

  useEffect(() => {
    if (activeIndex >= displayImages.length) setActiveIndex(0);
  }, [activeIndex, displayImages.length]);

  const goPrev = () =>
    setActiveIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % displayImages.length);

  return (
    <div className={`relative bg-muted w-full min-w-0 min-h-0 border-b lg:border-b-0 lg:border-l border-border/60 ${HERO_IMAGE_HEIGHT} ${className ?? ""}`}>
      {canEdit && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute top-3 right-3 z-10 h-8 px-2.5 text-xs shadow-md"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3 w-3" /> Edit photos
        </Button>
      )}

      {currentImage ? (
        <div className="relative w-full h-full overflow-hidden">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: brand }}
          >
            <img
              src={currentImage}
              alt={`${facilityName} photo ${activeIndex + 1} of ${displayImages.length}`}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </button>
          {hasMany && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-[1] h-9 w-9 grid place-items-center rounded-full bg-black/45 text-white hover:bg-black/60 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-[1] h-9 w-9 grid place-items-center rounded-full bg-black/45 text-white hover:bg-black/60 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 z-[1] flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/55 to-transparent overflow-x-auto">
                {displayImages.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`relative ${HERO_THUMB_SIZE} shrink-0 rounded-md overflow-hidden transition-all ${
                      activeIndex === i ? "ring-2 ring-white" : "ring-1 ring-white/50 opacity-80 hover:opacity-100"
                    }`}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={activeIndex === i}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                  </button>
                ))}
                <span className="ml-auto rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums shrink-0">
                  {activeIndex + 1}/{displayImages.length}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-full min-h-[200px] p-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 50%, #0f172a 100%)`,
          }}
        >
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ImageIcon className="h-10 w-10" />
              <span className="text-sm font-medium">Add photos</span>
            </button>
          ) : (
            <Building2 className="h-10 w-10 text-white/40" />
          )}
        </div>
      )}

      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm grid place-items-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % displayImages.length);
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={displayImages[activeIndex] ?? currentImage}
            alt={facilityName}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {canEdit && (
        <EditPhotosDialog
          facilityId={facilityId}
          images={images}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(next) => onPhotosUpdated?.(next)}
        />
      )}
    </div>
  );
}
