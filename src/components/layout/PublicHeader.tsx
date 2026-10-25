import Link from "next/link";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";

export function PublicHeader() {
  return (
    <header className="relative z-[101] w-full border-b border-border/60 bg-paper/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Karyora home"
          className="group flex items-baseline gap-2.5"
        >
          <span className="font-brand text-3xl leading-none tracking-tight text-ink transition-colors group-hover:text-accent sm:text-4xl">
            Karyora
          </span>
          <span className="hidden font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-text-muted sm:inline-block">
            Studio
          </span>
        </Link>

        <PublicNavigationMenu buttonClassName="text-ink hover:bg-surface-muted hover:text-accent" />
      </div>
    </header>
  );
}
