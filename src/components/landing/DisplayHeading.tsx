import { cn } from "@/lib/utils";

interface DisplayHeadingProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  align?: "left" | "center";
}

export function DisplayHeading({
  children,
  as: Tag = "h2",
  className,
  align = "left",
}: DisplayHeadingProps) {
  return (
    <Tag
      className={cn(
        "font-display font-normal tracking-tight text-foreground leading-[1.12]",
        Tag === "h1" &&
          "text-[2.35rem] sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] leading-[1.05]",
        Tag === "h2" && "text-3xl sm:text-4xl lg:text-[2.75rem]",
        Tag === "h3" && "text-2xl sm:text-3xl",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Italic teal emphasis clause used inside display headlines */
export function DisplayAccent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <em className={cn("italic text-display-accent", className)}>{children}</em>
  );
}
