"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";

export function EditorialPageHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <header className="relative z-[101] flex h-16 w-full shrink-0 items-center justify-between px-5 sm:h-[72px] sm:px-8 lg:px-12">
      <span className="h-11 w-11 sm:w-12" aria-hidden="true" />
      <Link
        href="/"
        aria-label="Karyora home"
        className={
          "absolute left-1/2 top-1/2 z-[103] -translate-x-1/2 -translate-y-1/2 font-brand text-3xl leading-none tracking-tight transition-colors motion-transition-micro sm:text-4xl lg:text-[44px] " +
          (isNavigationOpen ? "text-paper" : "text-ink hover:text-accent")
        }
      >
        Karyora
      </Link>
      <PublicNavigationMenu
        buttonClassName={isNavigationOpen ? "text-paper hover:text-accent" : "text-ink hover:text-accent"}
        onOpenChange={setIsNavigationOpen}
      />
    </header>
  );
}
