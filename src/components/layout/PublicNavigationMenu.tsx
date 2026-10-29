"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

type PublicNavigationMenuProps = {
  commissionHref?: string;
  buttonClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function PublicNavigationMenu({
  commissionHref = "/commission",
  buttonClassName = "",
  onOpenChange,
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

  // Memoized state changer to satisfy exhaustive‑deps lint rule
  const changeMenuState = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        changeMenuState(false);
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
  }, [isOpen, changeMenuState]);

  function closeMenu() {
    changeMenuState(false);
  }

  function isCurrent(key: string) {
    if (key === "home") return pathname === "/";
    if (key === "gallery") {
      return pathname.startsWith("/gallery") || pathname.startsWith("/artworks/");
    }
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
        onClick={() => changeMenuState(!isOpen)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="karyora-public-navigation"
        className={"inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors motion-transition-micro focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent " + buttonClassName}
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

      {/* The page itself remains visible, dimmed and desaturated, with no blur. */}
      <div
        className={"fixed inset-0 z-[100] " + (isOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={isOpen ? 0 : -1}
          onClick={() => {
            closeMenu();
            triggerRef.current?.focus();
          }}
          className={"absolute inset-0 h-full w-full bg-[#121110]/45 backdrop-saturate-50 transition-opacity motion-transition-ui motion-reduce:transition-none " + (
            isOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={overlayRef}
          id="karyora-public-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Karyora navigation"
          aria-hidden={!isOpen}
          className={"absolute inset-x-0 top-0 z-[102] flex h-[27vh] min-h-[230px] max-h-[300px] flex-col bg-[#171512] text-paper shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-transform motion-transition-navigation motion-reduce:transition-none " + (
            isOpen ? "translate-y-0" : "-translate-y-full"
          )}
        >
          {/* The original page wordmark stays above this panel. */}
          <div className="relative flex h-16 shrink-0 items-center justify-end px-4 sm:h-20 sm:px-8 lg:px-12">
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                triggerRef.current?.focus();
              }}
              aria-label="Close navigation menu"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-paper transition-colors motion-transition-micro hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Linear, side‑by‑side navigation using the handwritten Caveat font. */}
          <nav
            aria-label="Main navigation"
            className="flex min-h-0 flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 pb-5 pt-2 sm:flex-nowrap sm:gap-x-6 sm:px-7 lg:gap-x-12"
          >
            {items.map((item, index) => {
              const active = isCurrent(item.key);
              const linkColor = active
                ? "text-accent"
                : item.key === "admin"
                ? "text-paper/55 hover:text-accent"
                : "text-paper/90 hover:text-accent";

              return (
                <Link
                  key={item.key}
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={"whitespace-nowrap font-handwritten text-[27px] leading-none transition-colors motion-transition-micro focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent sm:text-3xl lg:text-[40px] " + linkColor}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
