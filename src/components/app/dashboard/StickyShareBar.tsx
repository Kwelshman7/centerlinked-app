import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function StickyShareBar({ slug, orgName }: { slug: string | null; orgName?: string | null }) {
  const url = slug && typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";

  const handleShare = async () => {
    if (!slug) {
      toast.error("Your organization slug isn't ready yet.");
      return;
    }
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ url, title: orgName ?? "CenterLinked organization" });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div
      className="fixed inset-x-0 z-30 px-4 lg:pl-72 lg:pr-8 pointer-events-none bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6"
    >
      <div className="mx-auto w-full max-w-6xl flex justify-center lg:justify-end">
        <Button
          size="lg"
          onClick={handleShare}
          className="pointer-events-auto shadow-xl shadow-primary/25"
        >
          <Share2 className="h-4 w-4" /> Share organization
        </Button>
      </div>
    </div>
  );
}
