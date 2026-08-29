/**
 * Product visual for “What your link answers”:
 * real in-app Search view inside the shared laptop frame (official logo, live UI).
 */
import { ScaledLaptopFrame } from "./LaptopFrame";
import { LinkAnswersSearchMock } from "./LinkAnswersSearchMock";
import { cn } from "@/lib/utils";

export function LinkAnswersDesktopVisual({ className }: { className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <ScaledLaptopFrame
        url="app.centerlinked.com/search/results"
        designWidth={920}
        className="max-w-none"
      >
        <LinkAnswersSearchMock />
      </ScaledLaptopFrame>
    </div>
  );
}
