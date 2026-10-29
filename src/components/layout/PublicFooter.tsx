import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border mt-auto bg-surface py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="font-brand text-2xl text-ink">Karyora</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
                · Studio
              </span>
            </div>
            <p className="text-xs text-text-muted max-w-sm">
              Where imagination finds its deliberate form. Independent digital & traditional art archive.
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-wider font-mono text-text-muted">
            <Link href="/gallery" className="hover:text-accent transition-colors motion-transition-micro">
              Gallery
            </Link>
            <Link href="/commission" className="hover:text-accent transition-colors motion-transition-micro">
              Commissions
            </Link>
            <Link href="/contact" className="hover:text-accent transition-colors motion-transition-micro">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-accent transition-colors motion-transition-micro">
              Terms
            </Link>
            <Link href="/login" className="hover:text-accent transition-colors motion-transition-micro opacity-40 hover:opacity-100">
              Admin
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-text-muted">
          <p>© {currentYear} Karyora. All rights reserved.</p>
          <p className="tracking-widest uppercase text-[10px]">
            Curated Portfolio & Inquiry Engine
          </p>
        </div>
      </div>
    </footer>
  );
}