import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn("relative mx-auto shrink-0 w-[260px]", className)}
      style={{ aspectRatio: "393 / 852" }}
    >
      <div className="absolute inset-0 rounded-[3rem] bg-neutral-900 shadow-2xl shadow-black/20 ring-1 ring-white/10">
        <span className="absolute -left-[2px] top-[118px] h-7 w-[3px] rounded-l-sm bg-neutral-700" />
        <span className="absolute -left-[2px] top-[162px] h-12 w-[3px] rounded-l-sm bg-neutral-700" />
        <span className="absolute -left-[2px] top-[228px] h-12 w-[3px] rounded-l-sm bg-neutral-700" />
        <span className="absolute -right-[2px] top-[188px] h-16 w-[3px] rounded-r-sm bg-neutral-700" />

        <div className="absolute inset-[3px] rounded-[2.75rem] overflow-hidden bg-background">
          {/* Status bar: left/right of Dynamic Island so time & signal never collide */}
          <div className="absolute top-0 inset-x-0 h-11 z-30 text-foreground pointer-events-none grid grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] items-center px-4">
            <span className="text-[10px] font-semibold tracking-tight justify-self-start truncate">
              9:41
            </span>
            <span aria-hidden className="block" />
            <span className="text-[9px] font-semibold justify-self-end tabular-nums whitespace-nowrap">
              5G ●●●
            </span>
          </div>

          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[26px] w-[90px] rounded-full bg-black z-40" />

          <div className="absolute inset-0 pt-11 overflow-hidden bg-background min-h-0">
            <div className="h-full min-h-0 overflow-hidden">{children}</div>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-foreground/80 z-40 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
