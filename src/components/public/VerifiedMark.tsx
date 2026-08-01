import logoFull from "@/assets/centerlinked-logo-full.png";
import { cn } from "@/lib/utils";

function formatUpdatedDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return null;
  }
}

/** CenterLinked ball mark — cropped from the full wordmark. */
function CenterLinkedBall({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/10",
        className,
      )}
      aria-hidden
    >
      <img
        src={logoFull}
        alt=""
        className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-auto max-w-none -translate-x-[13%] -translate-y-1/2 select-none"
        draggable={false}
      />
    </span>
  );
}

interface Props {
  verifiedAt?: string | null;
  className?: string;
  /** Compact for dense layouts; default suits the desktop identity band. */
  size?: "sm" | "md";
  /** `onBrand` for use on dark branded footer surfaces. */
  tone?: "default" | "onBrand";
}

/**
 * Verified trust line — CenterLinked ball + “Verified — last updated {date}”.
 */
export function VerifiedMark({
  verifiedAt,
  className,
  size = "md",
  tone = "default",
}: Props) {
  const dateLabel = formatUpdatedDate(verifiedAt);
  const sm = size === "sm";
  const onBrand = tone === "onBrand";
  const label = dateLabel ? `Verified — last updated ${dateLabel}` : "Verified";

  return (
    <div
      className={cn(
        "inline-flex items-center",
        sm ? "gap-1.5" : "gap-2",
        className,
      )}
    >
      <CenterLinkedBall className={sm ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span
        className={cn(
          "font-semibold tracking-wide",
          sm ? "text-[11px]" : "text-xs sm:text-[13px]",
          onBrand ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
