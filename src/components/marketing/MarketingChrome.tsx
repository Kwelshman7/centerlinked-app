import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { audiences, company, comparisons, platform, type NavLink as Item } from "./site";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2088b8]/45 focus-visible:ring-offset-2";

function MenuPanel({
  label,
  items,
  open,
  onOpen,
  onClose,
}: {
  label: string;
  items: Item[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-[#16343c] hover:bg-white/70",
          focusRing,
          open && "bg-white/70",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div
            id={menuId}
            role="menu"
            className="w-[340px] rounded-2xl border border-black/5 bg-white p-2 shadow-2xl"
          >
            {items.map((item) => {
              const current = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  onClick={onClose}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 hover:bg-[#e7f3f8]",
                    focusRing,
                    current && "bg-[#e7f3f8]",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      current ? "text-[#2088b8]" : "text-[#0c2c33]",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#4d656c]">{item.description}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function useMarketingMeta(title: string, description: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    const url = `https://www.centerlinked.com${pathname}`;
    const set = (selector: string, value: string) => {
      const el = document.head.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };
    set('meta[name="description"]', description);
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', description);
    set('meta[property="og:url"]', url);
    set('meta[name="twitter:title"]', title);
    set('meta[name="twitter:description"]', description);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", url);
  }, [title, description, pathname]);
}

export function MarketingHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const closeMenus = () => setOpenMenu(null);

  useEffect(() => {
    setMobile(false);
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobile]);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#003048]">
        <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center text-sm leading-snug text-white/90">
          <span>Search is free with a work email.</span>
          <Link
            to="/pricing"
            className={cn(
              "shrink-0 font-semibold text-[#5ebbd4] underline-offset-2 hover:underline",
              focusRing,
              "rounded-sm",
            )}
          >
            See plans
          </Link>
        </div>
      </div>
      <div className="border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="container grid items-center py-2.5 lg:py-3 xl:grid-cols-[minmax(7.5rem,1fr)_auto_minmax(7.5rem,1fr)] xl:gap-3">
          <div className="hidden xl:block" aria-hidden />
          <nav
            className="hidden items-center gap-1 justify-self-center rounded-full bg-[#e7f3f8] px-2 py-1.5 shadow-sm lg:flex"
            aria-label="Primary"
          >
            <Logo to="/" size="md" className="px-3" />
            <MenuPanel
              label="Who we serve"
              items={audiences}
              open={openMenu === "who"}
              onOpen={() => setOpenMenu("who")}
              onClose={closeMenus}
            />
            <MenuPanel
              label="What we do"
              items={platform}
              open={openMenu === "what"}
              onOpen={() => setOpenMenu("what")}
              onClose={closeMenus}
            />
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 text-sm font-medium text-[#16343c] hover:bg-white/70",
                  focusRing,
                  isActive && "bg-white font-semibold text-[#2088b8]",
                )
              }
            >
              Plans & pricing
            </NavLink>
            <MenuPanel
              label="About"
              items={company}
              open={openMenu === "about"}
              onOpen={() => setOpenMenu("about")}
              onClose={closeMenus}
            />
            <Link
              to="/login"
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-[#16343c] hover:bg-white/70 xl:hidden",
                focusRing,
              )}
            >
              Sign in
            </Link>
            <Link
              to="/join"
              className={cn(
                "ml-1 inline-flex h-10 items-center rounded-full bg-[#003048] px-4 text-sm font-semibold text-white hover:bg-[#062838]",
                focusRing,
                "focus-visible:ring-offset-0",
              )}
            >
              Join the network
            </Link>
          </nav>
          <div className="hidden items-center justify-end gap-4 text-sm text-[#33545c] xl:flex">
            <Link to="/login" className={cn("rounded-sm hover:text-[#003048]", focusRing)}>
              Sign in
            </Link>
            <Link to="/contact" className={cn("rounded-sm hover:text-[#003048]", focusRing)}>
              Contact
            </Link>
          </div>
          <div className="flex w-full items-center justify-between lg:hidden">
            <Logo to="/" size="sm" />
            <button
              type="button"
              // min-h/min-w in px, not rem: the fluid root font-size renders
              // h-11 at ~37px on a 375px viewport, under the 44px tap minimum.
              className={cn(
                "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#003048]",
                focusRing,
              )}
              aria-label={mobile ? "Close menu" : "Open menu"}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
            >
              {mobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobile ? (
          <div className="border-t border-black/5 bg-white lg:hidden" id="mobile-nav">
            <div className="container space-y-1 py-4 pb-6">
            <MobileGroup label="Who we serve" items={audiences} />
            <MobileGroup label="What we do" items={platform} />
            <Link
              to="/pricing"
              className={cn(
                "block rounded-lg px-1 py-3 text-sm font-semibold text-[#0c2c33]",
                focusRing,
                location.pathname === "/pricing" && "text-[#2088b8]",
              )}
            >
              Plans & pricing
            </Link>
            <MobileGroup label="About" items={company} />
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                to="/login"
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full border border-[#003048]/15 px-4 text-sm font-semibold text-[#003048]",
                  focusRing,
                )}
              >
                Sign in
              </Link>
              <Link
                to="/contact"
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full border border-[#003048]/15 px-4 text-sm font-semibold text-[#003048]",
                  focusRing,
                )}
              >
                Contact
              </Link>
              <Link
                to="/join"
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full bg-[#003048] px-4 text-sm font-semibold text-white",
                  focusRing,
                  "focus-visible:ring-offset-0",
                )}
              >
                Join the network
              </Link>
            </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function MobileGroup({ label, items }: { label: string; items: Item[] }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="border-b border-black/5 py-1">
      <button
        type="button"
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-lg px-1 py-2.5 text-sm font-semibold text-[#0c2c33]",
          focusRing,
        )}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4", open && "rotate-180")} aria-hidden />
      </button>
      {open
        ? items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "block rounded-lg px-2 py-2.5 text-sm",
                focusRing,
                pathname === item.to ? "font-semibold text-[#2088b8]" : "text-[#33545c]",
              )}
            >
              <span className="block">{item.label}</span>
              {item.description ? (
                <span className="mt-1 block text-sm leading-relaxed text-[#4d656c]">{item.description}</span>
              ) : null}
            </Link>
          ))
        : null}
    </div>
  );
}

const footerColumns = [
  { title: "Who we serve", items: audiences },
  { title: "What we do", items: platform },
  { title: "Company", items: company },
  { title: "Compared", items: comparisons },
];

export function MarketingFooter() {
  const { pathname } = useLocation();
  return (
    <footer className="bg-[#003048] text-white">
      <div className="container grid gap-10 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="inline-flex rounded-full bg-white px-4 py-2">
            <Logo to="/" size="md" />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
            CenterLinked helps behavioral health professionals see which programs accept a plan, where they are, and who to call. People who refer can search free. Programs keep the listing current.
          </p>
          <Link
            to="/join"
            className={cn(
              "mt-6 inline-flex h-11 min-h-[44px] items-center rounded-full bg-white px-5 text-sm font-semibold text-[#003048] hover:bg-[#e7f3f8]",
              focusRing,
              "focus-visible:ring-offset-[#003048]",
            )}
          >
            Join the network
          </Link>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{column.title}</h2>
            <ul className="mt-4 space-y-1">
              {column.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "inline-flex rounded-sm py-1.5 text-sm leading-snug hover:text-white",
                      focusRing,
                      "focus-visible:ring-offset-[#003048]",
                      pathname === item.to ? "font-semibold text-[#5ebbd4]" : "text-white/80",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-5 pb-safe text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CenterLinked. All rights reserved.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            <Link
              to="/privacy"
              className={cn(
                "rounded-sm hover:text-white",
                focusRing,
                "focus-visible:ring-offset-[#003048]",
                pathname === "/privacy" && "font-semibold text-[#5ebbd4]",
              )}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className={cn(
                "rounded-sm hover:text-white",
                focusRing,
                "focus-visible:ring-offset-[#003048]",
                pathname === "/terms" && "font-semibold text-[#5ebbd4]",
              )}
            >
              Terms
            </Link>
            <Link
              to="/pricing"
              className={cn(
                "rounded-sm hover:text-white",
                focusRing,
                "focus-visible:ring-offset-[#003048]",
                pathname === "/pricing" && "font-semibold text-[#5ebbd4]",
              )}
            >
              Pricing
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-white text-[#14343c]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
