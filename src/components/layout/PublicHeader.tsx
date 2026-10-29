"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";

export function PublicHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <header className="relative z-[101] w-full border-b border-border/60 bg-paper/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Karyora home"
          className={
            "group relative z-[103] flex items-baseline gap-2.5 font-brand text-3xl leading-none tracking-tight transition-colors motion-transition-micro sm:text-4xl " +
            (isNavigationOpen ? "text-paper" : "text-ink hover:text-accent")
          }
        >
          Karyora
        </Link>

        <PublicNavigationMenu
          buttonClassName="text-ink hover:bg-surface-muted hover:text-accent"
          onOpenChange={setIsNavigationOpen}
        />
      </div>
    </header>
  );
}
