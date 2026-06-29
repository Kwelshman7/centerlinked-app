import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/centerlinked-logo-full.png";

interface LogoProps {
  className?: string;
  to?: string;
  /** Kept for API compatibility — the wordmark is baked into the logo image. */
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

// The image is tightly cropped (≈3.8:1), so these heights translate to
// visually substantial widths without growing the host container.
const sizes = {
  sm: "h-7",
  md: "h-9",
  lg: "h-11",
  xl: "h-14",
};

export function Logo({ className, to = "/", size = "md" }: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center group", className)}>
      <img
        src={logoFull}
        alt="CenterLinked"
        className={cn("w-auto object-contain select-none", sizes[size])}
        draggable={false}
      />
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  );
}
