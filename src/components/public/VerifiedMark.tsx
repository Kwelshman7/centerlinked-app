import logoFull from "@/assets/centerlinked-logo-full.png";
import { cn } from "@/lib/utils";

function formatVerifiedDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
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
  /** Compact for mobile logo strip; default suits desktop logo tile. */
  size?: "sm" | "md";
}

/**
 * Verified trust mark — CenterLinked ball + Verified, with a subtle date underneath.
 * Meant to sit in the top-right corner over the org logo.
 */
export function VerifiedMark({ verifiedAt, className, size = "md" }: Props) {
  const dateLabel = formatVerifiedDate(verifiedAt);
  const sm = size === "sm";

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border/70 bg-white/95 shadow-sm backdrop-blur-sm",
          sm ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1",
        )}
      >
        <CenterLinkedBall className={sm ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span
          className={cn(
            "font-bold uppercase tracking-wider text-foreground",
            sm ? "text-[9px]" : "text-[10px]",
          )}
        >
          Verified
        </span>
      </span>
      {dateLabel ? (
        <span
          className={cn(
            "text-muted-foreground/70 font-medium tracking-wide",
            sm ? "text-[8px]" : "text-[9px]",
          )}
        >
          {dateLabel}
        </span>
      ) : null}
    </div>
  );
}
