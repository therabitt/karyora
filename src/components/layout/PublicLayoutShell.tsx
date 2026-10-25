"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if on an artwork detail page (e.g. /artworks/slug)
  // Dedicated KERN Inc. exhibition layout operates as a full-viewport canvas
  const isArtworkDetail = pathname.startsWith("/artworks/");

  if (isArtworkDetail) {
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
