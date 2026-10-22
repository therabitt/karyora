import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border mt-auto bg-surface-muted/50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-serif text-lg text-ink">Karyora</p>
            <p className="text-xs text-text-muted">
              A space for art to find its form. Portfolio & commission inquiries.
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
            <Link href="/gallery" className="hover:text-ink transition-colors">
              Gallery
            </Link>
            <Link href="/commission" className="hover:text-ink transition-colors">
              Commissions
            </Link>
            <Link href="/contact" className="hover:text-ink transition-colors">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/login" className="hover:text-ink transition-colors opacity-60">
              Admin
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs text-text-muted">
          <p>© {currentYear} Karyora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
