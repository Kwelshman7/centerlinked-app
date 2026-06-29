import { BadgeCheck, Clock, AlertTriangle, Snowflake, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { verificationState, type VerificationTier } from "@/lib/verification";

interface Props {
  verifiedAt: string | null | undefined;
  frozen: boolean | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

const STYLES: Record<VerificationTier, { cls: string; Icon: typeof BadgeCheck }> = {
  fresh: { cls: "bg-success/15 text-success border-success/30", Icon: BadgeCheck },
  recent: { cls: "bg-success/10 text-success border-success/20", Icon: BadgeCheck },
  stale: { cls: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300", Icon: Clock },
  frozen: { cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: Snowflake },
  never: { cls: "bg-muted text-muted-foreground border-border", Icon: HelpCircle },
};

export function VerificationBadge({ verifiedAt, frozen, size = "sm", className }: Props) {
  const state = verificationState(verifiedAt, frozen);
  const { cls, Icon } = STYLES[state.tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        cls,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {state.label}
    </span>
  );
}

export { verificationState };
export { AlertTriangle };
