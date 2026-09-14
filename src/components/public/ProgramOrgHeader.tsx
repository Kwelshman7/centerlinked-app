import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { orgPublicPath } from "@/lib/public-urls";
import { contrastingTextColor } from "@/lib/color-contrast";

interface Props {
  org: {
    name: string;
    slug: string | null;
    logo_url: string | null;
  };
  brand: string;
  /** When set, the logo links here. Omit on a one-facility page so it is not a dead click. */
  logoHref?: string | null;
  children?: React.ReactNode;
}

/** Same elevated logo + centered action row as OrgFooter, used as the page heading. */
export function ProgramOrgHeader({ org, brand, logoHref, children }: Props) {
  const text = contrastingTextColor(brand);
  const homeHref =
    logoHref === undefined ? (org.slug ? orgPublicPath(org.slug) : null) : logoHref;

  const logoNode = org.logo_url ? (
    <img
      src={org.logo_url}
      alt={`${org.name} logo`}
      className="h-24 w-auto max-w-[14rem] object-contain lg:h-32 lg:max-w-[18rem]"
    />
  ) : (
    <Building2 className="h-16 w-16 lg:h-20 lg:w-20" style={{ color: text }} aria-hidden />
  );

  const elevatedLogo = (
    <div
      className="rounded-2xl border bg-card p-2.5 shadow-xl shadow-black/20 ring-1 lg:p-4"
      style={{ borderColor: `${brand}38`, ["--tw-ring-color" as string]: "rgba(255,255,255,0.32)" }}
    >
      {logoNode}
    </div>
  );

  return (
    <header className="print:hidden" style={{ backgroundColor: brand, color: text }}>
      <div className="relative flex flex-col items-center px-6 py-8 text-center sm:px-10 lg:gap-10 lg:px-10 lg:pb-12 lg:pt-10">
        {homeHref ? (
          <Link
            to={homeHref}
            className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ["--tw-ring-color" as string]: "rgba(255,255,255,0.7)" }}
            aria-label={`${org.name} home`}
          >
            {elevatedLogo}
          </Link>
        ) : (
          elevatedLogo
        )}

        {children ? (
          <nav
            aria-label="Organization actions"
            className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-3"
          >
            {children}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
