/**
 * Desktop-only left visual for “What your link answers”:
 * case manager lifestyle photo (women reviewing CenterLinked on desktop).
 * Asset logo is the official CenterLinked mark (patched into the monitor UI).
 */
import caseManagerImg from "@/assets/link-answers-case-manager.jpg";

export function LinkAnswersDesktopVisual() {
  return (
    <div className="relative hidden lg:block h-full min-h-[32rem] xl:min-h-[36rem] overflow-hidden">
      <img
        src={caseManagerImg}
        alt=""
        width={1104}
        height={1086}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[46%_42%] scale-[1.04]"
        draggable={false}
      />

      {/* Soft edge dissolves — keep the right fade late so copy sits closer to the photo */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(to right, transparent 0%, transparent 78%, hsl(var(--background) / 0.45) 90%, hsl(var(--background) / 0.92) 97%, hsl(var(--background)) 100%)",
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.55) 6%, transparent 18%)",
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.55) 8%, transparent 20%)",
          ].join(", "),
        }}
        aria-hidden
      />
    </div>
  );
}
