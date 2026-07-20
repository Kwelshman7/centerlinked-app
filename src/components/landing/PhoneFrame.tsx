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
      {/* Device shell */}
      <div
        className="absolute inset-0 rounded-[2.75rem] p-[2px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        style={{
          background:
            "linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 35%, #0a0a0b 70%, #2c2c2e 100%)",
        }}
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-[108px] h-[26px] w-[3px] rounded-l-md bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-sm" />
        <span className="absolute -left-[3px] top-[152px] h-[46px] w-[3px] rounded-l-md bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-sm" />
        <span className="absolute -left-[3px] top-[210px] h-[46px] w-[3px] rounded-l-md bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-sm" />
        <span className="absolute -right-[3px] top-[168px] h-[72px] w-[3px] rounded-r-md bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-sm" />

        {/* Screen inset */}
        <div className="absolute inset-[3px] rounded-[2.55rem] overflow-hidden bg-black ring-1 ring-black/80">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-11 z-30 text-white pointer-events-none grid grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-center px-[18px]">
            <span className="text-[11px] font-semibold tracking-tight justify-self-start">9:41</span>
            <span aria-hidden className="block" />
            <span className="text-[10px] font-semibold justify-self-end tabular-nums flex items-center gap-1">
              <span className="text-[9px]">5G</span>
              <span className="flex gap-[2px]" aria-hidden>
                <span className="w-[3px] h-[3px] rounded-full bg-white" />
                <span className="w-[3px] h-[3px] rounded-full bg-white" />
                <span className="w-[3px] h-[3px] rounded-full bg-white/40" />
              </span>
              <span className="ml-0.5 w-[22px] h-[10px] rounded-[3px] border border-white/90 relative">
                <span className="absolute inset-[1.5px] right-[3px] rounded-[1px] bg-white" />
              </span>
            </span>
          </div>

          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 h-[24px] w-[84px] rounded-full bg-black z-40 ring-1 ring-white/5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]" />

          {/* App viewport */}
          <div className="absolute inset-0 pt-11 overflow-hidden bg-background">
            <div className="h-full min-h-0 overflow-hidden">{children}</div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 h-[4px] w-[108px] rounded-full bg-white/90 z-40 pointer-events-none" />
        </div>
      </div>

      {/* Floor reflection */}
      <div
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 w-[72%] h-8 rounded-full bg-black/15 blur-xl"
        aria-hidden
      />
    </div>
  );
}
