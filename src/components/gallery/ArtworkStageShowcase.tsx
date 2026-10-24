"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { PublicArtwork } from "@/lib/data/artworks";

interface ArtworkStageShowcaseProps {
  artworks: PublicArtwork[];
}

export function ArtworkStageShowcase({ artworks }: ArtworkStageShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Limit desktop and mobile showcase to a maximum of 5 works
  const displayArtworks = artworks.slice(0, 5);
  const total = displayArtworks.length;
  const current = displayArtworks[activeIndex] || displayArtworks[0];

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation (ArrowLeft / ArrowRight) with input element guard
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || total <= 1) return;
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, total]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  if (!displayArtworks || displayArtworks.length === 0) {
    return (
      <div className="w-full py-16 text-center border border-dashed border-border bg-surface-muted/50 rounded-xs">
        <p className="font-serif text-xl text-ink">Exhibition in preparation</p>
        <p className="text-xs text-text-muted mt-2">New original works will be presented here shortly.</p>
      </div>
    );
  }

  const currentImageUrl = getStoragePublicUrl(current.public_image_path);
  const currentImageFailed = failedImages[current.id];
  const formattedIndex = String(activeIndex + 1).padStart(2, "0");
  const formattedTotal = String(total).padStart(2, "0");

  return (
    <div className="w-full space-y-5 select-none">
      {/* ─── Artwork Exhibition Stage ─── */}
      <div className="relative w-full">
        {/* Desktop Accordion Ribbon (hidden on mobile, visible md+) */}
        <div 
          role="region"
          aria-label="Featured Artworks Showcase"
          className="hidden md:flex items-stretch gap-2.5 lg:gap-3.5 h-[340px] md:h-[380px] lg:h-[430px] xl:h-[460px] w-full overflow-hidden"
        >
          {displayArtworks.map((artwork, idx) => {
            const isActive = idx === activeIndex;
            const imageUrl = getStoragePublicUrl(artwork.public_image_path);
            const isFailed = failedImages[artwork.id];
            const itemNumber = String(idx + 1).padStart(2, "0");

            return (
              <button
                key={artwork.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Select artwork ${itemNumber}: ${artwork.title}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative overflow-hidden text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.25,1,0.5,1)] group ${
                  isActive
                    ? "flex-[4] lg:flex-[5] rounded-xs border-2 border-accent shadow-xl z-10 cursor-default"
                    : "flex-1 hover:flex-[1.25] rounded-xs border border-border/80 opacity-60 hover:opacity-90 grayscale hover:grayscale-0 hover:border-ink/40 cursor-pointer"
                }`}
              >
                {imageUrl && !isFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={artwork.alt_text || artwork.title}
                    onError={() => handleImageError(artwork.id)}
                    className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out ${
                      isActive ? "scale-100" : "scale-105"
                    }`}
                  />
                ) : (
                  /* Designed Exhibition Placeholder Canvas */
                  <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center border border-border/40">
                    <div className="w-10 h-10 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-2.5 text-accent font-serif text-base">
                      {itemNumber}
                    </div>
                    <span className="font-serif text-sm md:text-base text-ink font-medium max-w-[180px] line-clamp-2">
                      {artwork.title}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase mt-1">
                      {artwork.category.replace("-", " ")}
                    </span>
                  </div>
                )}

                {/* Inactive vertical label strip */}
                {!isActive && (
                  <div className={`absolute inset-0 flex flex-col justify-between p-3.5 pointer-events-none transition-colors ${
                    imageUrl && !isFailed ? "bg-ink/35 group-hover:bg-ink/15" : "bg-paper/30 group-hover:bg-paper/10"
                  }`}>
                    <span className={`text-[10px] font-mono tracking-widest font-semibold ${
                      imageUrl && !isFailed ? "text-white/95" : "text-ink font-bold"
                    }`}>
                      № {itemNumber}
                    </span>
                    <span className={`text-[11px] font-serif tracking-wider whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate ${
                      imageUrl && !isFailed ? "text-white/95" : "text-ink group-hover:text-accent font-medium"
                    }`}>
                      {artwork.title}
                    </span>
                  </div>
                )}

                {/* Active strip spotlight tag */}
                {isActive && (
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-white uppercase bg-ink/80 px-2.5 py-1 rounded-xs backdrop-blur-xs shadow-xs">
                      Spotlight · {itemNumber}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile View: Dedicated Touch Focal Card */}
        <div className="md:hidden space-y-3">
          <div className="relative aspect-4/3 sm:aspect-4/5 w-full max-w-sm mx-auto overflow-hidden rounded-xs border border-border bg-surface-muted shadow-md">
            {currentImageUrl && !currentImageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={current.alt_text || current.title}
                onError={() => handleImageError(current.id)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-2 text-accent font-serif text-base">
                  {formattedIndex}
                </div>
                <span className="font-serif text-lg text-ink font-medium max-w-[220px]">
                  {current.title}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase mt-1">
                  {current.category.replace("-", " ")}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-ink/85 text-white font-mono text-[10px] tracking-wider rounded-xs">
              № {formattedIndex} / {formattedTotal}
            </div>
          </div>

          {/* Mobile Prev / Next Controls */}
          <div className="flex items-center justify-between px-1 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handlePrev}
              disabled={total <= 1}
              aria-label="Previous artwork"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-xs uppercase font-mono font-semibold px-4 py-2 border border-border bg-surface text-ink hover:bg-surface-muted disabled:opacity-40 rounded-xs"
            >
              ← Prev
            </button>
            <span className="text-xs font-mono text-text-muted">
              {formattedIndex} / {formattedTotal}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={total <= 1}
              aria-label="Next artwork"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-xs uppercase font-mono font-semibold px-4 py-2 border border-border bg-surface text-ink hover:bg-surface-muted disabled:opacity-40 rounded-xs"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Artwork Information & Dedicated Detail Action ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 pb-1">
        <div className="space-y-1.5 max-w-2xl">
          {/* Metadata pill */}
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] text-accent font-semibold">
            <span>№ {formattedIndex} of {formattedTotal}</span>
            <span className="text-border-strong font-normal">/</span>
            <span>{current.category.replace("-", " ")}</span>
            <span className="text-border-strong font-normal">/</span>
            <span>{current.medium.replace("-", " ")}</span>
          </div>

          {/* Title */}
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight leading-tight">
            {current.title}
          </h2>

          {/* Visible Artwork Narrative (using description, never alt_text) */}
          {current.description && (
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-xl font-normal pt-0.5 line-clamp-2">
              {current.description}
            </p>
          )}
        </div>

        {/* Dedicated Single Detail Link */}
        <div className="shrink-0 pt-1 md:pt-0">
          <Link
            href={`/artworks/${current.slug}`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover pb-1 border-b-2 border-accent/40 hover:border-accent transition-all group"
          >
            <span>Explore Artwork Details</span>
            <span aria-hidden="true" className="motion-safe:transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* ─── KERN Inc. Inspired Compact Catalog Dock ─── */}
      <div className="border-t border-border pt-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Dock Status / Index */}
          <div className="flex items-center gap-2 text-text-muted font-mono text-[11px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Curated Exhibition Index</span>
          </div>

          {/* Interactive Thumb & Number Ribbon */}
          <div 
            role="tablist" 
            aria-label="Exhibition index navigation"
            className="flex items-center gap-2 overflow-x-auto max-w-full py-1 scrollbar-none"
          >
            {displayArtworks.map((artwork, idx) => {
              const isSelected = idx === activeIndex;
              const itemNumber = String(idx + 1).padStart(2, "0");
              const thumbUrl = getStoragePublicUrl(artwork.public_image_path);
              const thumbFailed = failedImages[artwork.id];

              return (
                <button
                  key={artwork.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xs transition-all cursor-pointer border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? "bg-ink text-surface border-ink shadow-sm"
                      : "bg-surface text-ink-soft border-border hover:border-border-strong hover:bg-surface-muted"
                  }`}
                  aria-label={`Switch to piece ${itemNumber}: ${artwork.title}`}
                >
                  {/* Micro Thumbnail or Glyph */}
                  <span className="w-4 h-4 rounded-xs overflow-hidden shrink-0 border border-black/10 bg-surface-muted inline-flex items-center justify-center">
                    {thumbUrl && !thumbFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt=""
                        onError={() => handleImageError(artwork.id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    )}
                  </span>

                  <span className="font-mono text-[11px] tracking-wider font-semibold">
                    {itemNumber}
                  </span>

                  <span
                    className={`text-xs font-serif max-w-[120px] truncate hidden xl:inline-block ${
                      isSelected ? "text-surface" : "text-ink group-hover:text-accent"
                    }`}
                  >
                    {artwork.title}
                  </span>

                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Direct Link to Complete Archive */}
          <div className="shrink-0">
            <Link
              href="/gallery"
              className="text-xs font-mono uppercase tracking-wider text-ink-soft hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <span>Full Archive</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
