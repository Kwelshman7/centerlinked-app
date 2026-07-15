import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-4">
        <Logo to="/" size="md" />

        <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="hover:bg-accent rounded-full px-4" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button
            variant="hero"
            size="sm"
            className="shadow-sm whitespace-nowrap h-9 px-5 text-sm"
            asChild
          >
            <Link to="/request-access">Claim Your Profile</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-foreground hover:bg-accent rounded-lg transition-colors shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 animate-fade-in max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary py-3 px-2 transition-colors rounded-lg hover:bg-accent/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="w-full justify-center rounded-full" asChild>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button variant="hero" size="sm" className="w-full justify-center" asChild>
                <Link to="/request-access" onClick={() => setMobileMenuOpen(false)}>
                  Claim Your Profile
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
