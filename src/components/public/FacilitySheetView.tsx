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
} from "lucide-react";
import { ShareSheetButton } from "@/components/app/ShareSheetButton";
import { FacilityPhotoGallery } from "@/components/public/FacilityPhotoGallery";


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
}: Props) {
  const address = [facility.address_line1, [facility.city, facility.state].filter(Boolean).join(", "), facility.zip]
    .filter(Boolean)
    .join(" · ");
  
  const cityStateZip = [
    [facility.city, facility.state].filter(Boolean).join(", "),
    facility.zip,
  ]
    .filter(Boolean)
    .join(" ");
  const inNetworkPayers = contracts.filter((c) => c.in_network);

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${facility.name} ${address}`,
  )}`;
  const lastUpdated = fmtDate(facility.updated_at);

  // BD rep falls back to org
  const repName = facility.bd_contact_name || org?.bd_contact_name || null;
  const repPhone = facility.bd_contact_phone || org?.bd_contact_phone || null;
  const repEmail = facility.bd_contact_email || org?.bd_contact_email || null;
  const cleanPhone = repPhone?.replace(/[^\d+]/g, "") ?? null;

  const breadcrumb = mode === "public" ? (
    <nav
      className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-white/90"
      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
    >
      {org?.slug ? (
        <Link to={`/o/${org.slug}`} className="hover:text-white transition-colors underline-offset-2 hover:underline">
          {org.name}
        </Link>
      ) : (
        <span>{org?.name ?? "Facilities"}</span>
      )}
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="font-medium truncate">{facility.name}</span>
    </nav>
  ) : null;

  const shareNode = canShare && facility.slug ? (
    <ShareSheetButton
      slug={facility.slug}
      kind="facility"
      variant="default"
      size="sm"
      label="Share Facility"
      hideCopy
    />
  ) : null;

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <FacilityHeroImage
          images={facility.image_urls ?? []}
          name={facility.name}
          location={cityStateZip}
          breadcrumb={breadcrumb}
          share={shareNode}
        />

        {(lastUpdated || updatedByName) && (
          <div className="border-t border-border/60 bg-muted/30 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {lastUpdated && <span>Last updated: {lastUpdated}</span>}
            {updatedByName && <span>Updated by: {updatedByName}</span>}
          </div>
        )}
      </section>


      {/* Body */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 lg:gap-6 lg:items-stretch lg:min-h-[680px]">
        <div className="flex flex-col gap-5 lg:h-full lg:min-h-0">


          {/* In-Network Contracts (above About) */}
          <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="font-heading text-base font-bold">In-Network Contracts</h2>
              {contractsHeaderExtra}
            </div>
            {inNetworkPayers.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {inNetworkPayers.slice(0, 12).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {c.payer_logo_url ? (
                      <img
                        src={c.payer_logo_url}
                        alt={c.payer_name}
                        className="h-4 w-4 object-contain"
                      />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    )}
                    <span>{c.payer_name}</span>
                  </span>
                ))}
                {inNetworkPayers.length > 12 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    +{inNetworkPayers.length - 12} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Out-of-Network Only
              </p>
            )}
          </section>

          {/* Program Details: Programs / Population / Type of Therapy / Amenities */}
          {(facility.levels_of_care?.length ||
            facility.population_served?.length ||
            facility.specializations?.length ||
            (facility.highlights && facility.highlights.length > 0) ||
            (facility.accreditations && facility.accreditations.length > 0) ||
            facility.description ||
            facility.tagline ||
            aboutHeaderExtra) && (
            <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="font-heading text-base font-bold">Program Details</h2>
                {aboutHeaderExtra}
              </div>

              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                {(facility.tagline || facility.description) && (
                  <div className="mb-5 pb-5 border-b border-border/60">
                    {facility.tagline && (
                      <p className="text-base text-foreground/90 font-medium leading-snug mb-2">
                        {facility.tagline}
                      </p>
                    )}
                    {facility.description && (
                      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                        {facility.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="relative grid sm:grid-cols-2 gap-x-8 gap-y-5 sm:before:content-[''] sm:before:absolute sm:before:top-0 sm:before:bottom-0 sm:before:left-1/2 sm:before:-translate-x-1/2 sm:before:w-px sm:before:bg-border/60">
                  {facility.levels_of_care?.length > 0 && (
                    <PillBlock title="Programs" items={facility.levels_of_care} variant="primary" />
                  )}
                  {facility.population_served?.length > 0 && (
                    <PillBlock title="Population" items={facility.population_served} variant="muted" />
                  )}
                  {facility.specializations?.length > 0 && (
                    <PillBlock title="Type of Therapy" items={facility.specializations} variant="muted" />
                  )}
                  {facility.highlights && facility.highlights.length > 0 && (
                    <PillBlock title="Amenities" items={facility.highlights} variant="muted" />
                  )}
                  {facility.accreditations && facility.accreditations.length > 0 && (
                    <PillBlock title="Accreditations" items={facility.accreditations} variant="primary" />
                  )}
                </div>
              </div>
            </section>
          )}

        </div>


        {/* BD Representative */}
        <aside className="lg:flex lg:flex-col lg:gap-5 lg:h-full lg:min-h-0">
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden lg:shrink-0">

            <div className="border-b border-border/60 bg-primary/10 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-primary">
                For Referrals
              </p>
            </div>

            <div className="p-5">
              {repName ? (
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 font-heading font-bold text-lg border border-primary/20">
                    {getInitials(repName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-[15px]">{repName}</p>
                    <p className="text-xs text-muted-foreground">
                      BD Representative
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No BD contact on file yet.
                  </p>
                </div>
              )}




              <div className="mt-4 space-y-2">
                {repEmail && (
                  <Button asChild className="w-full">
                    <a href={`mailto:${repEmail}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                )}
                {repPhone && cleanPhone && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={`sms:${cleanPhone}`}>
                      <MessageCircle className="h-4 w-4" /> Text
                    </a>
                  </Button>
                )}
                {repPhone && cleanPhone && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={`tel:${cleanPhone}`}>
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </Button>
                )}
              </div>

            </div>
          </div>

          <div className="mt-5 lg:mt-0 lg:flex-1 lg:min-h-0 lg:flex">
            <FacilityPhotoGallery
              facilityId={facilityId ?? facility.id}
              facilityName={facility.name}
              images={facility.image_urls ?? []}
              canEdit={canEditPhotos}
              onUpdated={onPhotosUpdated}
            />
          </div>

        </aside>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


function FacilityHeroImage({
  images,
  name,
  location,
  breadcrumb,
  share,
}: {
  images: string[];
  name: string;
  location?: string;
  breadcrumb?: React.ReactNode;
  share?: React.ReactNode;
}) {
  const list = (images ?? []).filter(Boolean);
  const Overlay = (
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 lg:p-8">
        <h1
          className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.55)" }}
        >
          {name}
        </h1>
        {location && (
          <p
            className="mt-1.5 text-sm sm:text-base text-white/95 inline-flex items-center gap-1.5"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
          >
            <MapPin className="h-4 w-4" />
            {location}
          </p>
        )}
        {breadcrumb}
      </div>
      {share && (
        <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-10">
          {share}
        </div>
      )}
    </div>
  );

  if (list.length === 0) {
    return (
      <div className="relative h-56 sm:h-72 lg:h-[26rem] w-full bg-muted">
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <Building2 className="h-12 w-12" />
        </div>
        {Overlay}
      </div>
    );
  }
  return (
    <div className="relative h-56 sm:h-80 lg:h-[26rem] w-full bg-muted overflow-hidden">
      <img
        src={list[0]}
        alt={name}
        className="w-full h-full object-cover object-center"
        loading="eager"
      />
      {Overlay}
    </div>
  );
}



function PillBlock({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "primary" | "muted";
}) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2 underline underline-offset-4 decoration-border">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((x) => (
          <span
            key={x}
            className={
              variant === "primary"
                ? "px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold"
                : "px-2.5 py-1 rounded-md border border-border bg-background text-foreground text-xs font-medium"
            }
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
