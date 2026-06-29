import { Link } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetInTouchSheet } from "@/components/public/GetInTouchSheet";
import { useState } from "react";

interface Props {
  org: {
    id?: string;
    name: string;
    logo_url: string | null;
    bd_contact_name: string | null;
    bd_contact_phone: string | null;
    bd_contact_email: string | null;
  };
  brand: string;
  ctaPrimary: string;
}

const links = [
  { href: "#about", label: "About" },
  { href: "#facilities", label: "Our Facilities" },
];

export function OrgTopNav({ org, brand, ctaPrimary }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="bg-card/95 backdrop-blur-xl border-b sticky top-0 z-30 print:hidden"
      style={{ borderColor: `${brand}25` }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-white border border-border/60 shadow-sm overflow-hidden grid place-items-center shrink-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-0.5" />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <span className="font-heading font-bold text-base sm:text-lg truncate">{org.name}</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/75 hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GetInTouchSheet
              orgName={org.name}
              contactName={org.bd_contact_name}
              phone={org.bd_contact_phone}
              email={org.bd_contact_email}
              triggerLabel={ctaPrimary}
              triggerClassName="shadow-sm"
              organizationId={org.id}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-card">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium py-2 text-foreground/80 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link to="/login" className="text-xs text-muted-foreground py-2">
              Sign in to CenterLinked
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
