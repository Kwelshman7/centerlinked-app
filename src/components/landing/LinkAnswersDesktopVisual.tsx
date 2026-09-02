/**
 * Desktop visual for “What your link answers”:
 * professional case-manager desk photo with a sharp in-monitor CenterLinked UI.
 * No CSS upscaling — keeps baked-in screen text readable.
 */
import caseManagerImg from "@/assets/link-answers-case-manager.jpg";
import { cn } from "@/lib/utils";

export function LinkAnswersDesktopVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative hidden w-full overflow-hidden lg:block",
        "lg:min-h-[28rem] xl:min-h-[32rem]",
        className,
      )}
    >
      <img
        src={caseManagerImg}
        alt="Case manager reviewing CenterLinked search results with a referral partner"
        width={1024}
        height={682}
        decoding="async"
        // object-contain-ish cover without scale()>1 so monitor pixels stay sharp
        className="absolute inset-0 h-full w-full object-cover object-[58%_42%]"
        draggable={false}
      />

      {/* Soft edge dissolves — kept off the monitor so UI text stays crisp */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 72% 68% at 55% 45%, transparent 42%, hsl(var(--background) / 0.22) 68%, hsl(var(--background) / 0.82) 88%, hsl(var(--background)) 100%)",
            "linear-gradient(to right, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.18) 8%, transparent 18%, transparent 78%, hsl(var(--background) / 0.35) 90%, hsl(var(--background) / 0.95) 98%, hsl(var(--background)) 100%)",
            "linear-gradient(to bottom, hsl(var(--background) / 0.75) 0%, hsl(var(--background) / 0.28) 8%, transparent 18%)",
            "linear-gradient(to top, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.35) 12%, transparent 26%)",
          ].join(", "),
        }}
        aria-hidden
      />
    </div>
  );
}
