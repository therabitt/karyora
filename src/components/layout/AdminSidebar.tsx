import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/artworks", label: "Artworks" },
  { href: "/dashboard/offerings", label: "Offerings" },
  { href: "/dashboard/commissions", label: "Inquiries" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-ink text-surface flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="block">
          <span className="font-serif text-xl tracking-tight text-surface">
            Karyora
          </span>
          <span className="block text-xs uppercase tracking-wider text-text-muted mt-0.5">
            Admin Studio
          </span>
        </Link>
      </div>

      <nav aria-label="Admin Navigation" className="p-4 space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-3.5 py-2.5 rounded-lg text-sm text-surface/80 hover:text-surface hover:bg-white/10 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          target="_blank"
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
    </aside>
  );
}
