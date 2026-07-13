import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionBadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function SectionBadge({ children, icon: Icon, className }: SectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden /> : null}
      {children}
    </span>
  );
}
