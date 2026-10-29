"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { PublicArtwork } from "@/lib/data/artworks";

interface LivingIndexGalleryProps {
  artworks: PublicArtwork[];
  currentPage: number;
  pageSize: number;
  initialIndex?: number;
}

export function LivingIndexGallery({
  artworks,
  currentPage,
  pageSize,
  initialIndex = 0,
}: LivingIndexGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialIndex >= 0 && initialIndex < artworks.length) {
      return initialIndex;
    }
    return 0;
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const activeArtwork = artworks[activeIndex] || artworks[0];
  const activeImageUrl = activeArtwork
    ? getStoragePublicUrl(activeArtwork.public_image_path)
    : null;
  const activeImageFailed = activeArtwork ? failedImages[activeArtwork.id] : false;

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  // Scroll active item smoothly into view within the synchronized list container
  useEffect(() => {
    if (itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  if (!artworks || artworks.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* ─── Desktop Living Index Composition (Solution 1A: Synchronized Stage) ─── */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-12 items-start">
        {/* Left: Typographic Archive Index (7 Columns) with Compact Editorial Rhythm */}
        <div className="lg:col-span-7 xl:col-span-7 border-t border-b border-border">
          <div
            tabIndex={0}
            role="region"
            aria-label="Artwork index list (use Up and Down arrows to navigate)"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(artworks.length - 1, prev + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(0, prev - 1));
              }
            }}
            className="max-h-[580px] xl:max-h-[640px] overflow-y-auto overscroll-contain pr-1.5 editorial-scroll focus:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            <ol className="divide-y divide-border">
              {artworks.map((artwork, idx) => {
                const isActive = idx === activeIndex;
                const itemNumber = String(
                  (currentPage - 1) * pageSize + idx + 1
                ).padStart(2, "0");
                const year = artwork.published_at
                  ? new Date(artwork.published_at).getFullYear()
                  : "2026";

                return (
                  <li
                    key={artwork.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`relative transition-colors motion-transition-micro motion-transition-micro group ${
                      isActive ? "bg-surface-muted/50" : "hover:bg-surface-muted/25"
                    }`}
                  >
                    {/* Active Visual Indicator Rule */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-accent transition-opacity motion-transition-micro ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />

                    <Link
                      href={`/artworks/${artwork.slug}`}
                      onFocus={() => setActiveIndex(idx)}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`View artwork № ${itemNumber}: ${artwork.title}`}
                      className="block px-4 py-1.5 xl:py-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Identification & Typography */}
                        <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em]">
                            <span
                              className={`font-semibold transition-colors motion-transition-micro ${
                                isActive ? "text-accent" : "text-text-muted"
                              }`}
                            >
                              № {itemNumber}
                            </span>
                            <span className="text-border-strong font-normal">/</span>
                            <span className="text-text-muted">
                              {artwork.category.replace("-", " ")}
                            </span>
                            {artwork.is_featured && (
                              <>
                                <span className="text-border-strong font-normal">/</span>
                                <span className="text-accent font-semibold">
                                  Spotlight
                                </span>
                              </>
                            )}
                          </div>

                          {/* Title */}
                          <h2
                            className={`font-artwork-title text-lg xl:text-xl tracking-tight transition-colors motion-transition-micro truncate leading-tight ${
                              isActive
                                ? "text-accent font-normal"
                                : "text-ink group-hover:text-accent font-normal"
                            }`}
                          >
                            {artwork.title}
                          </h2>

                          {/* Medium & Narrative snippet */}
                          <div className="flex items-center gap-2 text-xs text-ink-soft/80 font-normal">
                            <span className="capitalize shrink-0">
                              {artwork.medium.replace("-", " ")}
                            </span>
                            {artwork.description && (
                              <>
                                <span className="text-border-strong">·</span>
                                <span className="text-text-muted truncate max-w-xs xl:max-w-sm">
                                  {artwork.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Year & Direct Action Indicator */}
                        <div className="flex items-center gap-2.5 shrink-0 text-right">
                          <span className="text-xs font-mono text-text-muted">
                            {year}
                          </span>
                          <span
                            className={`text-sm font-sans transition-transform motion-transition-micro ${
                              isActive
                                ? "text-accent translate-x-1"
                                : "text-border-strong group-hover:text-accent group-hover:translate-x-1"
                            }`}
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Right: Stationary Artwork Presentation Area (5 Columns, Balanced Proportions) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-2.5">
          {activeArtwork && (
            <div className="space-y-2.5">
              {/* Artwork Exhibition Stage - Preserving Native Aspect Ratio with Passe-Partout */}
              <Link
                href={`/artworks/${activeArtwork.slug}`}
                aria-label={`View full case study: ${activeArtwork.title}`}
                className="group/stage relative w-full h-[380px] xl:h-[440px] rounded-xs border border-border/80 bg-paper/80 p-4 sm:p-5 overflow-hidden transition-all motion-transition-ui hover:border-accent/40 hover:shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent flex items-center justify-center block"
              >
                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                  {activeImageUrl && !activeImageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={activeArtwork.id}
                      src={activeImageUrl}
                      alt={activeArtwork.alt_text || activeArtwork.title}
                      onError={() => handleImageError(activeArtwork.id)}
                      className="max-w-full max-h-full object-contain rounded-2xs shadow-sm transition-all motion-transition-image group-hover/stage:scale-[1.01]"
                    />
                  ) : (
                    /* Designed Exhibition Canvas Fallback */
                    <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center select-none border border-border/40 rounded-2xs">
                      <div className="w-12 h-12 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-3 text-accent font-sans text-lg font-semibold">
                        {String(activeIndex + 1).padStart(2, "0")}
                      </div>
                      <span className="font-artwork-title text-lg text-ink font-normal max-w-[220px]">
                        {activeArtwork.title}
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase mt-1">
                        {activeArtwork.category.replace("-", " ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Catalog Index Tag */}
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-paper/95 backdrop-blur-xs text-[10px] font-mono text-ink tracking-wider border border-border/80 rounded-2xs font-semibold shadow-2xs pointer-events-none">
                  № {String(activeIndex + 1).padStart(2, "0")} of{" "}
                  {String(artworks.length).padStart(2, "0")}
                </div>
              </Link>

              {/* Museum Plaque Style Caption - Fully Visible Without Cutoff */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
                  <span>{activeArtwork.category.replace("-", " ")}</span>
                  <span>{activeArtwork.medium.replace("-", " ")}</span>
                </div>

                <h3 className="font-artwork-title text-2xl xl:text-3xl text-ink leading-tight font-normal">
                  <Link
                    href={`/artworks/${activeArtwork.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {activeArtwork.title}
                  </Link>
                </h3>

                {activeArtwork.description && (
                  <p className="text-xs text-ink-soft leading-relaxed font-normal pt-0.5 line-clamp-2">
                    {activeArtwork.description}
                  </p>
                )}

                {/* Understated Editorial Link */}
                <div className="pt-1">
                  <Link
                    href={`/artworks/${activeArtwork.slug}`}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover pb-0.5 border-b border-accent/40 hover:border-accent transition-all group/link"
                  >
                    <span>Explore Case Study</span>
                    <span
                      aria-hidden="true"
                      className="motion-safe:transition-transform motion-transition-micro group-hover/link:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile & Tablet Natural Editorial Flow (Visible on < lg) ─── */}
      <div className="lg:hidden space-y-10">
        <div className="divide-y divide-border border-t border-b border-border">
          {artworks.map((artwork, idx) => {
            const itemNumber = String(
              (currentPage - 1) * pageSize + idx + 1
            ).padStart(2, "0");
            const imageUrl = getStoragePublicUrl(artwork.public_image_path);
            const isFailed = failedImages[artwork.id];

            return (
              <article key={artwork.id} className="py-7 sm:py-8 space-y-3.5">
                {/* Header Line */}
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-accent font-semibold">
                  <span>
                    № {itemNumber} · {artwork.category.replace("-", " ")}
                  </span>
                  <span>{artwork.medium.replace("-", " ")}</span>
                </div>

                {/* Title */}
                <h2 className="font-artwork-title text-3xl sm:text-4xl text-ink leading-tight font-normal">
                  <Link
                    href={`/artworks/${artwork.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {artwork.title}
                  </Link>
                </h2>

                {/* Artwork Stage - Preserving Native Aspect Ratio with Passe-Partout */}
                <Link
                  href={`/artworks/${artwork.slug}`}
                  aria-label={`Open case study: ${artwork.title}`}
                  className="block relative w-full h-[340px] sm:h-[420px] rounded-xs border border-border/70 bg-paper/70 p-2 sm:p-3 overflow-hidden shadow-2xs hover:border-accent/40 transition-colors"
                >
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {imageUrl && !isFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={artwork.alt_text || artwork.title}
                        onError={() => handleImageError(artwork.id)}
                        className="max-w-full max-h-full object-contain rounded-2xs"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-10 h-10 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-2 text-accent font-sans text-base font-semibold">
                          {itemNumber}
                        </div>
                        <span className="font-artwork-title text-lg text-ink font-normal">
                          {artwork.title}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Narrative Snippet */}
                {artwork.description && (
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-normal">
                    {artwork.description}
                  </p>
                )}

                {/* Action Link */}
                <div className="pt-1">
                  <Link
                    href={`/artworks/${artwork.slug}`}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover pb-0.5 border-b border-accent/40 hover:border-accent transition-colors"
                  >
                    <span>Explore Case Study</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}