import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const productLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Request Access", href: "/request-access", isRoute: true },
  { label: "Sign In", href: "/login", isRoute: true },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy", isRoute: true },
  { label: "Terms of Service", href: "/terms", isRoute: true },
  { label: "Acceptable Use", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Privacy Rights", href: "#" },
  { label: "Legal Notice", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10 sm:py-12">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo to="/" size="lg" />
            <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
              The private professional network for behavioral-health and addiction-treatment organizations.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions:{" "}
              <a href="mailto:legal@centerlinked.com" className="text-primary hover:underline">
                legal@centerlinked.com
              </a>
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Product</h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  {"isRoute" in link && link.isRoute ? (
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  {"isRoute" in link && link.isRoute ? (
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            © 2026 CenterLinked. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for the behavioral health industry. Not a patient-facing directory.
          </p>
        </div>
      </div>
    </footer>
  );
}
