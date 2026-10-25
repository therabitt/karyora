"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PublicNavigationMenuProps = {
  commissionHref?: string;
  buttonClassName?: string;
};

export function PublicNavigationMenu({
  commissionHref = "/commission",
  buttonClassName = "",
}: PublicNavigationMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const items = [
    { key: "home", href: "/", label: "Home" },
    { key: "gallery", href: "/gallery", label: "Gallery" },
    { key: "commission", href: commissionHref, label: "Commissions" },
    { key: "contact", href: "/contact", label: "Contact" },
    { key: "terms", href: "/terms", label: "Terms" },
    { key: "admin", href: "/login", label: "Admin" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  function isCurrent(key: string) {
    if (key === "home") return pathname === "/";
    if (key === "gallery") return pathname.startsWith("/gallery") || pathname.startsWith("/artworks/");
    if (key === "commission") return pathname === "/commission";
    if (key === "contact") return pathname === "/contact";
    if (key === "terms") return pathname === "/terms";
    return pathname === "/login" || pathname.startsWith("/dashboard");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="karyora-public-navigation"
        className={"inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent " + buttonClassName}
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        {isOpen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <div
        ref={overlayRef}
        id="karyora-public-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Karyora navigation"
        aria-hidden={!isOpen}
        className={"fixed inset-0 z-[100] flex flex-col justify-between bg-[#121110] px-6 py-6 text-paper transition-[opacity,transform,visibility] duration-300 sm:px-10 sm:py-9 lg:px-14 lg:py-12 " + (
          isOpen ? "visible translate-y-0 opacity-100 pointer-events-auto" : "invisible -translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <p className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-white/50 sm:text-xs">
            Karyora Studio / Navigation
          </p>
          <Link
            href="/"
            tabIndex={isOpen ? 0 : -1}
            onClick={closeMenu}
            className="font-brand text-3xl leading-none text-paper transition-colors hover:text-accent sm:text-4xl"
            aria-label="Karyora home"
          >
            Karyora
          </Link>
          <button
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              closeMenu();
              triggerRef.current?.focus();
            }}
            aria-label="Close navigation menu"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-paper transition-colors hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex flex-col items-center justify-center gap-3 py-8 sm:gap-5">
          {items.map((item, index) => {
            const active = isCurrent(item.key);
            const linkColor = active
              ? "text-accent"
              : item.key === "admin"
              ? "text-white/40 hover:text-accent"
              : "text-paper/80 hover:text-accent";
            return (
              <Link
                key={item.key}
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                tabIndex={isOpen ? 0 : -1}
                onClick={closeMenu}
                aria-current={active ? "page" : undefined}
                className={"font-sans text-2xl font-light tracking-tight transition-colors sm:text-4xl lg:text-5xl " + linkColor}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 text-center sm:flex-row sm:text-left">
          <p className="font-sans text-xs text-white/55 sm:text-sm">
            A space for art to find its form.
          </p>
          <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-white/40">
            © {new Date().getFullYear()} Karyora
          </p>
        </div>
      </div>
    </>
  );
}
