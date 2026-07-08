import { Building2 } from "lucide-react";

interface Props {
  orgName: string;
  logoUrl: string | null;
  brand: string;
}

export function OrgPageHeader({ orgName, logoUrl, brand }: Props) {
  return (
    <header
      className="w-full border-b border-black/10 print:hidden"
      style={{ backgroundColor: brand }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
        <a href="#top" className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white shadow-sm overflow-hidden grid place-items-center shrink-0 p-1">
            {logoUrl ? (
              <img src={logoUrl} alt={`${orgName} logo`} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <span className="font-heading font-semibold text-sm sm:text-base text-white truncate">
            {orgName}
          </span>
        </a>
      </div>
    </header>
  );
}
