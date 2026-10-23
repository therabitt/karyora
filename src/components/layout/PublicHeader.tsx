"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/gallery", label: "Gallery" },
  { href: "/commission", label: "Commissions" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-paper/95 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl tracking-tight text-ink hover:text-accent transition-colors"
          >
            Karyora
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main Navigation" className="hidden sm:flex items-center gap-6 sm:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-soft hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/commission"
              className="inline-flex items-center justify-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Inquire
            </Link>
          </nav>

          {/* Mobile: Inquire CTA + Hamburger */}
          <div className="sm:hidden flex items-center gap-3">
            <Link
              href="/commission"
              className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors"
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
          className="sm:hidden fixed inset-0 z-30 bg-black/40"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        aria-label="Mobile Navigation"
        className={`sm:hidden fixed top-16 left-0 right-0 z-30 bg-paper border-b border-border shadow-lg transition-all duration-200 ${
          mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col divide-y divide-border">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center px-6 py-4 text-sm font-medium text-ink-soft hover:text-accent hover:bg-surface-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
