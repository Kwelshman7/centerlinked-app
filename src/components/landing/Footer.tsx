import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const productLinkColumns = [
  [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ],
  [
    { label: "Create Your Profile", href: "/request-access", isRoute: true },
    { label: "Sign In", href: "/login", isRoute: true },
  ],
] as const;

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10 sm:py-12">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo to="/" size="lg" />
            <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
              One live referral profile that stays current, is easy to share, and helps
              referral partners quickly determine if you&apos;re the right fit.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions?{" "}
              <Link to="/request-access" className="text-primary hover:underline">
                Create Your Profile
              </Link>{" "}
              and we&apos;ll follow up.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm tracking-wide">Product</h4>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {productLinkColumns.map((column) => (
                <ul key={column[0].label} className="space-y-3">
                  {column.map((link) => (
                    <li key={link.label}>
                      {"isRoute" in link && link.isRoute ? (
                        <Link
                          to={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            © 2026 CenterLinked. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex items-center gap-4 sm:gap-5">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
