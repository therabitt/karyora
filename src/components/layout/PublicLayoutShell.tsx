"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // These pages own their shared exhibition-style header and composition.
  const isArtworkDetail = pathname.startsWith("/artworks/");
  const isHome = pathname === "/";
  const isEditorialPage = pathname === "/contact" || pathname === "/commission";

  if (isArtworkDetail || isHome || isEditorialPage) {
    return <div className="min-h-screen flex flex-col bg-paper">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <PublicHeader />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}