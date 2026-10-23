"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/artworks", label: "Artworks" },
  { href: "/dashboard/offerings", label: "Offerings" },
  { href: "/dashboard/commissions", label: "Inquiries" },
  { href: "/dashboard/settings", label: "Settings" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin Navigation" className="p-4 space-y-1 flex-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-white/15 text-surface font-medium"
                : "text-surface/70 hover:text-surface hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="block" onClick={onNavigate}>
          <span className="font-serif text-xl tracking-tight text-surface">
            Karyora
          </span>
          <span className="block text-xs uppercase tracking-wider text-surface/40 mt-0.5">
            Admin Studio
          </span>
        </Link>
      </div>

      <NavLinks onNavigate={onNavigate} />

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center justify-between px-3.5 py-2 text-xs text-surface/60 hover:text-surface hover:bg-white/5 rounded-lg transition-colors"
        >
          <span>View Public Site</span>
          <span aria-hidden="true">↗</span>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-center px-3.5 py-2 text-xs font-medium text-surface/80 hover:text-danger bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent body scroll when mobile menu open
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
      {/* ─── Desktop Sidebar (lg+) ─── */}
      <aside className="hidden lg:flex w-64 bg-ink text-surface flex-col shrink-0 min-h-screen">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-ink text-surface flex items-center justify-between px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-serif text-lg tracking-tight text-surface">Karyora</span>
          <span className="text-[10px] uppercase tracking-wider text-surface/40">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 text-surface/80 hover:text-surface transition-colors"
        >
          {mobileOpen ? (
            /* X icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* ─── Mobile Drawer Overlay ─── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Mobile Drawer Panel ─── */}
      <aside
        className={`lg:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-ink text-surface flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile Admin Navigation"
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
