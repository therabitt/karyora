"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Artwork detail (/artworks/slug) and Homepage (/) operate as dedicated full-viewport exhibition canvases
  const isArtworkDetail = pathname.startsWith("/artworks/");
  const isHome = pathname === "/";

  if (isArtworkDetail || isHome) {
    return <div className="min-h-screen flex flex-col bg-paper">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <PublicHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <PublicFooter />
    </div>
  );
}
