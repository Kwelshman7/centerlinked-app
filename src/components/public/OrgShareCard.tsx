import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  slug: string;
  orgName: string;
}

export function OrgShareCard({ slug, orgName }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.host : "centerlinked.com"}/o/${slug}`;
  const fullUrl = `https://${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${orgName} on CenterLinked`,
          url: fullUrl,
        });
        return;
      } catch {}
    }
    copy();
  };

  return (
    <section className="rounded-2xl bg-[#0f1f3d] text-white p-6 sm:p-8 shadow-lg">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold leading-tight">
            Keep your referral network current.
          </h2>
          <p className="text-sm text-white/70 mt-2 max-w-md leading-relaxed">
            One link, always up to date — no more outdated PDFs or phone tag. Share it with case
            managers, discharge planners, and partner clinics.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-lg p-1.5">
            <span className="flex-1 min-w-0 px-3 text-sm truncate text-white/90">{url}</span>
            <Button
              size="sm"
              onClick={copy}
              className="bg-white text-[#0f1f3d] hover:bg-white/90 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </>
              )}
            </Button>
          </div>
          <Button
            onClick={share}
            className="w-full bg-white text-[#0f1f3d] hover:bg-white/90 font-semibold"
          >
            <Share2 className="h-4 w-4" /> Share profile
          </Button>
        </div>
      </div>
    </section>
  );
}
