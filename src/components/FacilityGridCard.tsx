import { Link } from "react-router-dom";
import { Building2, MapPin, Shield, Users } from "lucide-react";
import { resolveStateCode, stateDisplayName } from "@/lib/us-states";
import { cn } from "@/lib/utils";

export type FacilityGridDensity = "compact" | "comfortable" | "showcase";

export interface FacilityGridCardData {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address_line1?: string | null;
  zip?: string | null;
  image_urls?: string[] | null;
  levels_of_care?: string[] | null;
  short_description?: string | null;
  tagline?: string | null;
  description?: string | null;
  population_served?: string[] | null;
  specializations?: string[] | null;
  highlights?: string[] | null;
  insurance_status?: string | null;
  featured_payer?: string | null;
}

interface FacilityGridCardProps {
  facility: FacilityGridCardData;
  /** Destination when the card is clicked. If omitted, renders a non-link tile. */
  href?: string | null;
  /** Visual density — defaults to compact (dashboard + dense grids). */
  density?: FacilityGridDensity;
  /** Split image/content side-by-side on larger screens (best for a single facility). */
  layout?: "stack" | "split";
}

/** Map facility count → card richness for public org sheets. */
export function facilityGridDensityForCount(count: number): FacilityGridDensity {
  if (count <= 3) return "showcase";
  if (count <= 5) return "comfortable";
  return "compact";
}

export function FacilityGridCard({
  facility: f,
  href,
  density = "compact",
  layout = "stack",
}: FacilityGridCardProps) {
  const stateLabel = f.state
    ? stateDisplayName(resolveStateCode(f.state) ?? f.state)
    : null;
  const levels = f.levels_of_care ?? [];
  const imageUrl = f.image_urls?.[0] ?? null;
  const locationLine = [f.city, stateLabel].filter(Boolean).join(", ");
  const addressLine = [f.address_line1, f.zip].filter(Boolean).join(", ");
  const blurb = f.short_description || f.tagline || f.description || null;
  const population = f.population_served ?? [];
  const highlights = (f.highlights ?? []).filter(Boolean);
  const specializations = (f.specializations ?? []).filter(Boolean);
  const levelLimit = density === "showcase" ? 8 : density === "comfortable" ? 5 : 3;
  const metaLimit = density === "showcase" ? 4 : 2;

  const className = cn(
    "group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all h-full",
    density === "showcase" && "sm:rounded-2xl",
  );

  const body =
    density === "showcase" ? (
      <ShowcaseBody
        name={f.name}
        imageUrl={imageUrl}
        locationLine={locationLine}
        addressLine={addressLine}
        blurb={blurb}
        levels={levels}
        levelLimit={levelLimit}
        population={population}
        specializations={specializations}
        highlights={highlights}
        metaLimit={metaLimit}
        insuranceStatus={f.insurance_status}
        featuredPayer={f.featured_payer}
        split={layout === "split"}
      />
    ) : density === "comfortable" ? (
      <ComfortableBody
        name={f.name}
        imageUrl={imageUrl}
        locationLine={locationLine}
        addressLine={addressLine}
        blurb={blurb}
        levels={levels}
        levelLimit={levelLimit}
        population={population}
        metaLimit={metaLimit}
        featuredPayer={f.featured_payer}
      />
    ) : (
      <CompactBody
        name={f.name}
        imageUrl={imageUrl}
        locationLine={locationLine}
        levels={levels}
        levelLimit={levelLimit}
      />
    );

  if (href) {
    return (
      <Link to={href} className={className} aria-label={`View ${f.name}`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function CompactBody({
  name,
  imageUrl,
  locationLine,
  levels,
  levelLimit,
}: {
  name: string;
  imageUrl: string | null;
  locationLine: string;
  levels: string[];
  levelLimit: number;
}) {
  return (
    <>
      <FacilityImage imageUrl={imageUrl} name={name} aspect="aspect-[16/10]" iconClass="h-7 w-7" />
      <div className="p-2.5 space-y-1.5">
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </p>
        {locationLine && (
          <p className="text-[11px] text-muted-foreground truncate">{locationLine}</p>
        )}
        <LevelChips levels={levels} limit={levelLimit} size="sm" />
      </div>
    </>
  );
}

function ComfortableBody({
  name,
  imageUrl,
  locationLine,
  addressLine,
  blurb,
  levels,
  levelLimit,
  population,
  metaLimit,
  featuredPayer,
}: {
  name: string;
  imageUrl: string | null;
  locationLine: string;
  addressLine: string;
  blurb: string | null;
  levels: string[];
  levelLimit: number;
  population: string[];
  metaLimit: number;
  featuredPayer?: string | null;
}) {
  return (
    <div className="flex flex-col h-full">
      <FacilityImage imageUrl={imageUrl} name={name} aspect="aspect-[16/9]" iconClass="h-8 w-8" />
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col">
        <div className="space-y-1">
          <p className="font-semibold text-[15px] sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </p>
          {(locationLine || addressLine) && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary/70" aria-hidden />
              <span className="leading-snug">
                {[locationLine, addressLine].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
        </div>

        {blurb && (
          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
            {blurb}
          </p>
        )}

        <LevelChips levels={levels} limit={levelLimit} size="md" />

        <div className="mt-auto pt-1 space-y-1.5">
          {population.length > 0 && (
            <MetaRow
              icon={Users}
              items={population.slice(0, metaLimit)}
              overflow={Math.max(0, population.length - metaLimit)}
            />
          )}
          {featuredPayer && (
            <MetaRow icon={Shield} items={[`Featured: ${featuredPayer}`]} overflow={0} />
          )}
        </div>
      </div>
    </div>
  );
}

function ShowcaseBody({
  name,
  imageUrl,
  locationLine,
  addressLine,
  blurb,
  levels,
  levelLimit,
  population,
  specializations,
  highlights,
  metaLimit,
  insuranceStatus,
  featuredPayer,
  split,
}: {
  name: string;
  imageUrl: string | null;
  locationLine: string;
  addressLine: string;
  blurb: string | null;
  levels: string[];
  levelLimit: number;
  population: string[];
  specializations: string[];
  highlights: string[];
  metaLimit: number;
  insuranceStatus?: string | null;
  featuredPayer?: string | null;
  split?: boolean;
}) {
  const focusItems = [...specializations, ...highlights].filter(Boolean);

  const content = (
    <div className="p-4 sm:p-5 lg:p-6 space-y-3 flex-1 flex flex-col min-w-0">
      <div className="space-y-1.5">
        <p
          className={cn(
            "font-heading font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors",
            split ? "text-xl sm:text-2xl" : "text-lg sm:text-xl",
          )}
        >
          {name}
        </p>
        {(locationLine || addressLine) && (
          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" aria-hidden />
            <span className="leading-snug">
              {[locationLine, addressLine].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}
      </div>

      {blurb && (
        <p
          className={cn(
            "text-sm text-foreground/80 leading-relaxed",
            split ? "line-clamp-4 sm:line-clamp-5" : "line-clamp-3",
          )}
        >
          {blurb}
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Levels of care
        </p>
        <LevelChips levels={levels} limit={levelLimit} size="md" />
      </div>

      <div className="mt-auto space-y-2.5 pt-1">
        {population.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Populations
            </p>
            <MetaRow
              icon={Users}
              items={population.slice(0, metaLimit)}
              overflow={Math.max(0, population.length - metaLimit)}
            />
          </div>
        )}

        {focusItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {focusItems.slice(0, metaLimit).map((item) => (
              <span
                key={item}
                className="text-[11px] font-medium bg-muted text-foreground/80 px-2 py-0.5 rounded-md"
              >
                {item}
              </span>
            ))}
            {focusItems.length > metaLimit && (
              <span className="text-[11px] text-muted-foreground font-semibold self-center">
                +{focusItems.length - metaLimit}
              </span>
            )}
          </div>
        )}

        {(featuredPayer || insuranceStatus) && (
          <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 text-xs leading-snug">
              {featuredPayer && (
                <p className="font-semibold text-foreground truncate">
                  Featured payer: {featuredPayer}
                </p>
              )}
              {insuranceStatus && (
                <p className="text-muted-foreground line-clamp-2">{insuranceStatus}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (split) {
    return (
      <div className="flex flex-col md:grid md:grid-cols-2 md:min-h-[320px] lg:min-h-[360px] h-full">
        <FacilityImage
          imageUrl={imageUrl}
          name={name}
          aspect="aspect-[16/9] md:aspect-auto md:h-full md:min-h-[320px]"
          iconClass="h-12 w-12"
        />
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[22rem]">
      <FacilityImage
        imageUrl={imageUrl}
        name={name}
        aspect="aspect-[16/9] sm:aspect-[5/3]"
        iconClass="h-10 w-10"
      />
      {content}
    </div>
  );
}

function FacilityImage({
  imageUrl,
  name,
  aspect,
  iconClass,
}: {
  imageUrl: string | null;
  name: string;
  aspect: string;
  iconClass: string;
}) {
  return (
    <div className={cn(aspect, "bg-muted overflow-hidden shrink-0")}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full grid place-items-center">
          <Building2 className={cn(iconClass, "text-muted-foreground")} />
        </div>
      )}
    </div>
  );
}

function LevelChips({
  levels,
  limit,
  size,
}: {
  levels: string[];
  limit: number;
  size: "sm" | "md";
}) {
  if (levels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {levels.slice(0, limit).map((l) => (
        <span
          key={l}
          className={cn(
            "font-bold uppercase tracking-wide bg-primary/10 text-primary rounded",
            size === "sm" && "text-[9px] px-1.5 py-0.5",
            size === "md" && "text-[10px] px-2 py-0.5",
          )}
        >
          {l}
        </span>
      ))}
      {levels.length > limit && (
        <span
          className={cn(
            "text-muted-foreground font-semibold",
            size === "sm" ? "text-[9px]" : "text-[10px]",
          )}
        >
          +{levels.length - limit}
        </span>
      )}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  items,
  overflow,
}: {
  icon: typeof Users;
  items: string[];
  overflow: number;
}) {
  if (items.length === 0) return null;
  return (
    <p className="text-[11px] sm:text-xs text-muted-foreground flex items-start gap-1.5">
      <Icon className="h-3 w-3 mt-0.5 shrink-0 text-primary/70" aria-hidden />
      <span className="leading-snug">
        {items.join(" · ")}
        {overflow > 0 ? ` +${overflow}` : ""}
      </span>
    </p>
  );
}

/** Shared grid wrapper — optional count drives column density for public sheets. */
export function FacilityGrid({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  /** When set, columns adapt so few facilities fill the page width. */
  count?: number;
  className?: string;
}) {
  const gridClass =
    count == null
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      : count === 1
        ? "grid grid-cols-1 gap-4 sm:gap-5"
        : count === 2
          ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
          : count === 3
            ? "grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
            : count <= 5
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";

  return <div className={cn(gridClass, className)}>{children}</div>;
}
