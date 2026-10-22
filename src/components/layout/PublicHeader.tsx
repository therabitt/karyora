import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-paper/95 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-ink hover:text-accent transition-colors"
        >
          Karyora
        </Link>

        <nav aria-label="Main Navigation" className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/gallery"
            className="text-sm font-medium text-ink-soft hover:text-accent transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/commission"
            className="text-sm font-medium text-ink-soft hover:text-accent transition-colors"
          >
            Commissions
          </Link>
          <Link
            href="/contact"
            className="hidden sm:inline-block text-sm font-medium text-ink-soft hover:text-accent transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/commission"
            className="inline-flex items-center justify-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Inquire
          </Link>
        </nav>
      </div>
    </header>
  );
}
