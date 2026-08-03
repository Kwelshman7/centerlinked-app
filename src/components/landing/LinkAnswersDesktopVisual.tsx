/**
 * Desktop-only left visual for “What your link answers”:
 * case manager lifestyle photo (women reviewing CenterLinked on desktop).
 */
import caseManagerImg from "@/assets/link-answers-case-manager.jpg";

export function LinkAnswersDesktopVisual() {
  return (
    <div className="relative hidden lg:block h-full min-h-[36rem] xl:min-h-[42rem] overflow-hidden">
      <img
        src={caseManagerImg}
        alt=""
        width={1104}
        height={1086}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[38%_center]"
        draggable={false}
      />

      {/* Soft dissolves into the shared white page / copy column */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(to right, transparent 0%, transparent 58%, hsl(var(--background) / 0.35) 80%, hsl(var(--background) / 0.9) 92%, hsl(var(--background)) 100%)",
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.5) 10%, transparent 26%)",
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.5) 12%, transparent 30%)",
          ].join(", "),
        }}
        aria-hidden
      />
    </div>
  );
}
