import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { orgPublicPath, programPublicPath } from "@/lib/public-urls";

interface Props {
  slug: string;
  orgSlug?: string | null;
  kind?: "facility" | "org";
  label?: string;
  title?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  style?: React.CSSProperties;
  hideCopy?: boolean;
}

export function ShareSheetButton({
  slug,
  orgSlug,
  kind = "facility",
  label = "Share program sheet",
  title,
  variant = "default",
  size = "default",
  className,
  style,
  hideCopy = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const path =
    kind === "facility" ? programPublicPath(slug, orgSlug) : orgPublicPath(slug);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const shareTitle = title ?? (kind === "facility" ? "Program Sheet" : "Organization Profile");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied", { description: "Paste anywhere — recipient doesn't need an account." });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          url,
          title: shareTitle,
        });
        return;
      } catch {
        // user cancelled — fall back to copy
      }
    }
    await copy();
  };

  if (hideCopy) {
    return (
      <Button type="button" variant={variant} size={size} onClick={share} className={className} style={style}>
        <Share2 className="h-4 w-4" /> {label}
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button type="button" variant={variant} size={size} onClick={share} className="flex-1" style={style}>
        <Share2 className="h-4 w-4" /> {label}
      </Button>
      <Button type="button" variant="outline" size={size} onClick={copy} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
