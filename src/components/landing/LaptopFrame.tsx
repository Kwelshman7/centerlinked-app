import { cn } from "@/lib/utils";

interface LaptopFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Optional browser URL shown in the chrome bar. */
  url?: string;
}

export function LaptopFrame({
  children,
  className,
  url = "app.centerlinked.com/dashboard",
}: LaptopFrameProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-5xl", className)}>
      {/* Screen bezel */}
      <div className="relative rounded-t-xl sm:rounded-t-2xl bg-neutral-800 p-1.5 sm:p-2 shadow-2xl shadow-black/25 ring-1 ring-black/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-16 sm:w-20 rounded-b-md bg-neutral-700/80" />

        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-background border border-neutral-700/80">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 h-8 sm:h-9 bg-neutral-100 border-b border-border/80">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mx-auto max-w-md h-5 sm:h-6 rounded-md bg-white border border-border/70 px-2 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate font-medium">
                  {url}
                </span>
              </div>
            </div>
            <div className="w-8 sm:w-12 shrink-0" />
          </div>

          {/* App content */}
          <div className="aspect-[16/10] overflow-hidden bg-muted/30">{children}</div>
        </div>
      </div>

      {/* Hinge / base */}
      <div className="relative mx-auto">
        <div className="h-2 sm:h-2.5 bg-gradient-to-b from-neutral-700 to-neutral-800 rounded-b-sm" />
        <div className="mx-auto h-3 sm:h-4 w-[108%] -translate-x-[3.7%] rounded-b-xl bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-lg" />
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-16 sm:w-24 rounded-full bg-neutral-500/40" />
      </div>
    </div>
  );
}
