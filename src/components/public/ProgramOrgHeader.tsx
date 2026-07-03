import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { orgPublicPath } from "@/lib/public-urls";

interface Props {
  org: {
    name: string;
    slug: string | null;
    logo_url: string | null;
  };
  facilityName: string;
  brand: string;
  trailing?: React.ReactNode;
}

export function ProgramOrgHeader({ org, facilityName, brand, trailing }: Props) {
  const orgHref = org.slug ? orgPublicPath(org.slug) : "/";

  return (
    <header
      className="bg-card/95 backdrop-blur-xl border-b sticky top-0 z-30 print:hidden"
      style={{ borderColor: `${brand}30` }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link to={orgHref} className="flex items-center gap-2.5 min-w-0 group">
          <div
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white border shadow-sm overflow-hidden grid place-items-center shrink-0"
            style={{ borderColor: `${brand}35` }}
          >
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-0.5" />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
              {org.name}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{facilityName}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {trailing}
          <Link
            to="/login"
            className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
