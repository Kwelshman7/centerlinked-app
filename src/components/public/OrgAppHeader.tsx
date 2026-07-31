import { Logo } from "@/components/Logo";

interface Props {
  brand?: string;
}

/**
 * Minimal top bar for public shared org profiles.
 * No app navigation or sign-in — the page is a standalone shareable link.
 */
export function OrgAppHeader(_props: Props) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/60 print:hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center">
          <Logo to="/" size="md" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
