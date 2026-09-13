import { BadgeCheck, Clock, HelpCircle, MinusCircle, ShieldAlert, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  insuranceMatchLabel,
  type InsuranceMatchStatus,
} from "@/lib/insurance-contract-status";

const STYLES: Record<
  InsuranceMatchStatus,
  { cls: string; Icon: typeof BadgeCheck }
> = {
  verified: { cls: "bg-success/15 text-success border-success/30", Icon: BadgeCheck },
  reported: {
    cls: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-200",
    Icon: Clock,
  },
  pending: {
    cls: "bg-sky-500/10 text-sky-800 border-sky-500/30 dark:text-sky-200",
    Icon: ShieldAlert,
  },
  out_of_network: {
    cls: "bg-muted text-muted-foreground border-border",
    Icon: MinusCircle,
  },
  unknown: { cls: "bg-muted text-muted-foreground border-border", Icon: HelpCircle },
  self_pay: {
    cls: "bg-primary/10 text-primary border-primary/20",
    Icon: Wallet,
  },
};

interface Props {
  status: InsuranceMatchStatus;
  payerName?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function InsuranceMatchBadge({
  status,
  payerName,
  size = "sm",
  className,
}: Props) {
  const { cls, Icon } = STYLES[status];
  const label = insuranceMatchLabel(status);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        cls,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      <span className="truncate">
        {payerName ? `${payerName} · ${label}` : label}
      </span>
    </span>
  );
}
