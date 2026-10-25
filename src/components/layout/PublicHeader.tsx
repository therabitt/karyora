"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/gallery", label: "Gallery" },
  { href: "/commission", label: "Commissions" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Scroll listener for homepage transparent-to-solid overlay transition
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`w-full transition-all duration-300 ${
          isHome
            ? isScrolled
              ? "fixed top-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-b border-border shadow-2xs"
              : "fixed top-0 left-0 right-0 z-40 bg-linear-to-b from-paper/90 via-paper/50 to-transparent border-b border-transparent pointer-events-auto"
            : "sticky top-0 z-40 bg-paper border-b border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Editorial Logo */}
          <Link href="/" className="group flex items-baseline gap-2.5">
            <span className="font-serif text-2xl sm:text-3xl tracking-tight text-ink group-hover:text-accent transition-colors">
              Karyora
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase text-text-muted font-sans font-medium">
              · Studio
            </span>
          </Link>

          {/* Desktop Nav - Centered & Refined */}
          <nav aria-label="Main Navigation" className="hidden sm:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive =
                item.href === "/gallery"
                  ? pathname.startsWith("/gallery") || pathname.startsWith("/artworks")
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs uppercase tracking-[0.15em] font-medium transition-colors relative py-1 ${
                    isActive
                      ? "text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-accent"
                      : "text-ink-soft hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/commission"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-4 py-1.5 rounded-sm border border-accent text-accent hover:bg-accent hover:text-white transition-all shadow-xs"
            >
              Inquire
            </Link>
          </div>

          {/* Mobile: Inquire CTA + Hamburger */}
          <div className="sm:hidden flex items-center gap-3">
            <Link
              href="/commission"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm border border-accent text-accent hover:bg-accent hover:text-white transition-all"
            >
              Inquire
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="p-1.5 text-ink-soft hover:text-ink transition-colors"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        aria-label="Mobile Navigation"
        className={`sm:hidden fixed top-16 left-0 right-0 z-30 bg-paper border-b border-border shadow-xl transition-all duration-200 ${
          mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col divide-y divide-border">
          {navItems.map((item) => {
            const isActive =
              item.href === "/gallery"
                ? pathname.startsWith("/gallery") || pathname.startsWith("/artworks")
                : pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-6 py-4 text-xs uppercase tracking-wider font-medium transition-colors ${
                    isActive
                      ? "text-accent bg-accent-soft/30 font-semibold"
                      : "text-ink-soft hover:text-accent hover:bg-surface-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
