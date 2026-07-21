import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  User,
  Calendar,
  Award,
  Clock,
  Check,
  Pencil,
  Sparkles,
  ImageIcon,
  X,
  ChevronLeft,
} from "lucide-react";
import { ShareSheetButton } from "@/components/app/ShareSheetButton";
import { EditPhotosDialog } from "@/components/public/FacilityPhotoGallery";
import { MobileContactBar, mobileContactBarPadding } from "@/components/public/MobileContactBar";
import { useOrgBrandColor } from "@/hooks/useOrgBrandColor";
import { useNearbyCities } from "@/hooks/useNearbyCities";
import { formatPhoneDisplay, sanitizePhone } from "@/lib/phone";

/** Fixed hero gallery dimensions — identical for every facility/org. */
const HERO_IMAGE_HEIGHT = "h-[280px]";
const HERO_THUMB_SIZE = "h-14 w-14";
const HERO_THUMB_STRIP = "h-[68px]";

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
  bd_contact_name: string | null;
  bd_contact_phone: string | null;
  bd_contact_email: string | null;
  tagline?: string | null;
  brand_color?: string | null;
  accent_color?: string | null;
  cover_image_url?: string | null;
}

export interface SheetContract {
  id: string;
  payer_name: string;
  in_network: boolean;
  payer_logo_url?: string | null;
}

interface Props {
  facility: FacilitySheetData;
  org: SheetOrg | null;
  contracts: SheetContract[];
  mode: "public" | "internal";
  canShare: boolean;
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
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function fmtYear(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).getFullYear().toString();
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SectionHeading({
  title,
  headerExtra,
}: {
  title: string;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="font-heading text-sm sm:text-[15px] font-bold tracking-tight">{title}</h2>
      {headerExtra}
    </div>
  );
}

function ExpandableText({
  text,
  brand,
  className = "",
}: {
  text: string;
  brand: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > 320 || text.split("\n").length > 4;

  return (
    <div className={className}>
      <p
        className={`text-sm leading-relaxed whitespace-pre-line text-foreground/80 break-words ${
          !expanded && needsToggle ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold hover:underline"
          style={{ color: brand }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export function FacilitySheetView({
  facility,
  org,
  contracts,
  mode,
  canShare,
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
  const { cities: nearbyCities, loading: nearbyCitiesLoading } = useNearbyCities(facility.city, facility.state);

  const address = [facility.address_line1, [facility.city, facility.state].filter(Boolean).join(", "), facility.zip]
    .filter(Boolean)
    .join(" · ");

  const cityStateZip = [[facility.city, facility.state].filter(Boolean).join(", "), facility.zip].filter(Boolean).join(" ");

  const inNetworkPayers = contracts.filter((c) => c.in_network);
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name} ${address}`)}`;
  const lastUpdated = fmtDate(facility.updated_at);
  const foundedYear = fmtYear(facility.created_at);

  const repName = facility.bd_contact_name || org?.bd_contact_name || null;
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email || org?.bd_contact_email || null;
  const cleanPhone = sanitizePhone(repPhone) || null;
  const hasContact = !!(cleanPhone || repEmail);
  const showMobileActionBar = !!(hasContact || shareNode);

  const summaryText =
    facility.short_description ||
    facility.tagline ||
    facility.description ||
    null;

  const facilityType = facility.treatment_focus || facility.levels_of_care?.[0] || null;
  const accreditationLabel = facility.accreditations?.length
    ? facility.accreditations.join(", ")
    : null;

  const programFeatures = [
    ...(facility.quick_highlights ?? []),
    ...(facility.highlights ?? []),
    ...(facility.specializations ?? []),
  ].filter((item, index, arr) => arr.indexOf(item) === index);

  const shareNode =
    canShare && facility.slug ? (
      <ShareSheetButton
        slug={facility.slug}
        orgSlug={org?.slug}
        kind="facility"
        variant="default"
        size="default"
        label="Share Facility"
        hideCopy
        className="shadow-sm hover:opacity-90"
        style={{ backgroundColor: brand, borderColor: brand }}
      />
    ) : null;

  const hasProgramDetails =
    facility.description ||
    facility.tagline ||
    programFeatures.length > 0 ||
    facility.population_served?.length > 0 ||
    aboutHeaderExtra;

  const hasFactsStrip = (facility.levels_of_care?.length ?? 0) > 0 || contracts.length >= 0;
  const hasServiceArea = !!(address || cityStateZip);

  const tabBarOffset = mode === "internal" ? 64 : 0;

  return (
    <div className={`space-y-5 lg:space-y-6 min-w-0 ${showMobileActionBar ? mobileContactBarPadding(tabBarOffset) : ""}`}>
      {/* Hero */}
      <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-2 lg:items-start">
          <HeroGallery
            images={facility.image_urls ?? []}
            fallbackImage={coverImageUrl}
            facilityName={facility.name}
            brand={brand}
            canEdit={canEditPhotos}
            facilityId={facilityId ?? facility.id}
            onPhotosUpdated={onPhotosUpdated}
            className="order-1 lg:order-2"
          />

          <div className="p-4 sm:p-6 lg:p-7 flex flex-col gap-3 min-w-0 self-start order-2 lg:order-1">
            {mode === "public" && org?.slug && (
              <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Link to={`/o/${org.slug}`} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
                  {org.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground truncate">{facility.name}</span>
              </nav>
            )}

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{facility.name}</h1>

              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {cityStateZip && (
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" style={{ color: brand }} />
                    <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      {cityStateZip}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {summaryText && (
              <p className="text-sm leading-relaxed text-foreground/80 break-words">{summaryText}</p>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-0.5">
              {foundedYear && (
                <MetaItem icon={Calendar} label="Founded" value={foundedYear} brand={brand} />
              )}
              {facilityType && (
                <MetaItem icon={Building2} label="Facility Type" value={facilityType} brand={brand} />
              )}
              {accreditationLabel && (
                <MetaItem icon={Award} label="Accreditation" value={accreditationLabel} brand={brand} />
              )}
              {lastUpdated && (
                <MetaItem icon={Clock} label="Last Updated" value={lastUpdated} brand={brand} />
              )}
            </div>

            {shareNode && <div className="pt-1 hidden lg:block">{shareNode}</div>}
          </div>
        </div>

        {updatedByName && (
          <div className="border-t border-border/60 bg-muted/30 px-5 sm:px-6 py-2.5 text-xs text-muted-foreground">
            Updated by: {updatedByName}
          </div>
        )}
      </section>

      {/* Unified details */}
      {(hasFactsStrip || hasProgramDetails || hasServiceArea || repName || repEmail || repPhone) && (
        <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 divide-y divide-border/50">
              {hasFactsStrip && (
                <div className="px-4 sm:px-6 py-4 sm:py-5 grid sm:grid-cols-2 gap-5 sm:gap-8">
                  <div className="min-w-0">
                    <SectionHeading title="In-Network Contracts" headerExtra={contractsHeaderExtra} />
                    {inNetworkPayers.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {inNetworkPayers.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-semibold max-w-full"
                          >
                            {c.payer_logo_url ? (
                              <img src={c.payer_logo_url} alt={c.payer_name} className="h-3.5 w-3.5 object-contain shrink-0" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: brand }} />
                            )}
                            <span className="truncate">{c.payer_name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        Out-of-Network Only
                      </p>
                    )}
                  </div>

                  {facility.levels_of_care?.length > 0 && (
                    <div className="min-w-0">
                      <SectionHeading title="Levels of Care" />
                      <div className="flex flex-wrap gap-1.5">
                        {facility.levels_of_care.map((level) => (
                          <span
                            key={level}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold"
                            style={{ backgroundColor: `${brand}14`, color: brand }}
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasProgramDetails && (
                <div className="px-4 sm:px-6 py-4 sm:py-5">
                  <SectionHeading title="Program Details" headerExtra={aboutHeaderExtra} />

                  {(facility.tagline || facility.description) && (
                    <div className="mb-4">
                      {facility.tagline && facility.tagline !== summaryText && (
                        <p className="text-sm sm:text-[15px] text-foreground/90 font-medium leading-snug mb-2 break-words">
                          {facility.tagline}
                        </p>
                      )}
                      {facility.description && facility.description !== summaryText && (
                        <ExpandableText text={facility.description} brand={brand} />
                      )}
                    </div>
                  )}

                  {programFeatures.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      {programFeatures.map((item) => (
                        <li key={item} className="flex items-start gap-2 min-w-0">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: brand }} />
                          <span className="text-xs sm:text-sm text-foreground/85 leading-snug break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {facility.population_served?.length > 0 && (
                    <div className={programFeatures.length > 0 ? "pt-4 border-t border-border/50" : ""}>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2.5">
                        What We Treat
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {facility.population_served.map((item) => (
                          <span
                            key={item}
                            className="px-2 py-0.5 rounded-md border border-border bg-background text-foreground text-xs font-medium break-words"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasServiceArea && (
                <div className="px-4 sm:px-6 py-4 sm:py-5">
                  <SectionHeading title="Service Area" />
                  <div className="grid md:grid-cols-[160px_1fr] gap-4">
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-[120px] md:h-full md:min-h-[120px] w-full rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group shrink-0"
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
                      {cityStateZip && (
                        <p className="text-sm text-foreground/80 leading-relaxed mb-2.5 break-words">
                          Located in {cityStateZip}.
                          {facility.address_line1 ? ` ${facility.address_line1}.` : ""}
                        </p>
                      )}
                      {nearbyCitiesLoading ? (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
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

            {/* Desktop sidebar contact — mobile uses sticky Contact now bar + footer card */}
            <aside className="hidden lg:block lg:border-l border-border/50 bg-muted/15 px-4 sm:px-5 py-4 sm:py-5 lg:sticky lg:top-20 lg:self-start">
              <p className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: brand }}>
                For Referrals
              </p>

              {repName ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-11 w-11 rounded-full grid place-items-center shrink-0 font-heading font-bold text-sm border"
                    style={{ backgroundColor: `${brand}14`, color: brand, borderColor: `${brand}30` }}
                  >
                    {getInitials(repName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{repName}</p>
                    <p className="text-xs text-muted-foreground">BD Representative</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">No BD contact on file yet.</p>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {repEmail && (
                  <Button asChild className="w-full h-9 text-sm hover:opacity-90" style={{ backgroundColor: brand, borderColor: brand }}>
                    <a href={`mailto:${repEmail}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                )}
                {repPhone && cleanPhone && (
                  <Button asChild variant="outline" className="w-full h-9 text-sm">
                    <a href={`sms:${cleanPhone}`}>
                      <MessageCircle className="h-4 w-4" /> Text
                    </a>
                  </Button>
                )}
                {repPhone && cleanPhone && (
                  <Button asChild variant="outline" className="w-full h-9 text-sm">
                    <a href={`tel:${cleanPhone}`}>
                      <Phone className="h-4 w-4" /> Call
                      {formatPhoneDisplay(repPhone) ? ` (${formatPhoneDisplay(repPhone)})` : ""}
                    </a>
                  </Button>
                )}
              </div>
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
          contextLabel={`Reach the BD rep for ${facility.name}.`}
          bottomOffset={tabBarOffset}
          shareAction={shareNode ? <div className="lg:hidden w-full">{shareNode}</div> : undefined}
        />
      )}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  brand,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  brand: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: brand }} />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words leading-snug">{value}</p>
      </div>
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
  const thumbs = list.slice(0, 5);
  const extraCount = Math.max(0, list.length - 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const displayImages = list.length > 0 ? list : fallbackImage ? [fallbackImage] : [];
  const currentImage = displayImages[activeIndex] ?? heroImage;

  useEffect(() => {
    if (activeIndex >= displayImages.length) setActiveIndex(0);
  }, [activeIndex, displayImages.length]);

  return (
    <div className={`relative bg-muted shrink-0 self-start w-full border-b lg:border-b-0 lg:border-l border-border/60 ${className ?? ""}`}>
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
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className={`block w-full ${HERO_IMAGE_HEIGHT} overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
            style={{ ["--tw-ring-color" as string]: brand }}
          >
            <img
              src={currentImage}
              alt={facilityName}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </button>

          {displayImages.length > 1 && (
            <div className={`flex items-center gap-2 px-3 ${HERO_THUMB_STRIP} bg-card border-t border-border/60 overflow-x-auto`}>
              {thumbs.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`relative ${HERO_THUMB_SIZE} shrink-0 rounded-md overflow-hidden transition-all ${
                    activeIndex === i ? "ring-2 ring-offset-1" : "ring-1 ring-border/60 opacity-80 hover:opacity-100"
                  }`}
                  style={activeIndex === i ? { boxShadow: `0 0 0 2px ${brand}` } : undefined}
                >
                  <img src={src} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                  {i === 4 && extraCount > 0 && (
                    <span className="absolute inset-0 bg-black/55 text-white text-[10px] font-bold grid place-items-center">
                      +{extraCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center ${HERO_IMAGE_HEIGHT} p-8 text-center`}
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
