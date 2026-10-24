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

  const total = artworks.length;
  const current = artworks[activeIndex] || artworks[0];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!artworks || artworks.length === 0) {
    return null;
  }

  const currentImageUrl = getStoragePublicUrl(current.public_image_path);
  const formattedIndex = String(activeIndex + 1).padStart(2, "0");
  const formattedTotal = String(total).padStart(2, "0");

  return (
    <div className="w-full space-y-8 select-none">
      {/* ─── Alan Menken Style Multi-Strip Exhibition Stage ─── */}
      <div className="relative w-full">
        {/* Desktop Accordion Ribbon (hidden on mobile, visible md+) */}
        <div className="hidden md:flex items-stretch gap-3 lg:gap-4 h-[500px] lg:h-[600px] w-full overflow-hidden px-1">
          {artworks.map((artwork, idx) => {
            const isActive = idx === activeIndex;
            const imageUrl = getStoragePublicUrl(artwork.public_image_path);
            const itemNumber = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={artwork.id}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View artwork ${itemNumber}: ${artwork.title}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group ${
                  isActive
                    ? "flex-[5] lg:flex-[6] rounded-xs border-2 border-accent shadow-2xl z-10"
                    : "flex-1 hover:flex-[1.5] rounded-xs border border-border/60 opacity-40 hover:opacity-85 grayscale hover:grayscale-0 hover:border-ink/30"
                }`}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={artwork.alt_text}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                      isActive ? "scale-100 group-hover:scale-105" : "scale-105"
                    }`}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-muted flex items-center justify-center p-4">
                    <span className="font-serif text-sm text-ink/60">{artwork.title}</span>
                  </div>
                )}

                {/* Inactive vertical tag label */}
                {!isActive && (
                  <div className="absolute inset-0 bg-ink/20 flex flex-col justify-between p-3 pointer-events-none">
                    <span className="text-[10px] font-mono tracking-widest text-white/90">
                      № {itemNumber}
                    </span>
                    <span
                      className="text-[11px] font-serif text-white tracking-wider whitespace-nowrap opacity-90 [writing-mode:vertical-rl] rotate-180"
                    >
                      {artwork.title}
                    </span>
                  </div>
                )}

                {/* Active strip bottom subtle scrim */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent flex items-end justify-between p-6 pointer-events-none">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-white/90 uppercase bg-ink/60 px-2 py-0.5 backdrop-blur-xs">
                      Active Spotlight · {itemNumber}
                    </span>
                    <Link
                      href={`/artworks/${artwork.slug}`}
                      className="pointer-events-auto text-xs uppercase font-mono tracking-wider text-accent-soft hover:text-white bg-accent/80 hover:bg-accent px-3 py-1.5 transition-colors shadow-sm"
                    >
                      View Piece Details ↗
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View: Centered Showcase Slide */}
        <div className="md:hidden space-y-4">
          <div className="relative aspect-4/5 w-full max-w-sm mx-auto overflow-hidden border border-border bg-surface-muted shadow-lg">
            {currentImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={current.alt_text}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-ink/80 text-white font-mono text-[10px]">
              № {formattedIndex} / {formattedTotal}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-ink/90 to-transparent flex items-end justify-between">
              <span className="text-white font-serif text-lg truncate pr-2">
                {current.title}
              </span>
              <Link
                href={`/artworks/${current.slug}`}
                className="shrink-0 text-[10px] uppercase font-mono font-semibold text-white bg-accent px-2.5 py-1"
              >
                Open ↗
              </Link>
            </div>
          </div>

          {/* Mobile Prev / Next Controls */}
          <div className="flex items-center justify-between px-4">
            <button
              type="button"
              onClick={handlePrev}
              className="text-xs uppercase font-mono font-semibold px-4 py-2 border border-border bg-surface text-ink hover:bg-surface-muted"
            >
              ← Prev
            </button>
            <span className="text-xs font-mono text-text-muted">
              {formattedIndex} / {formattedTotal}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="text-xs uppercase font-mono font-semibold px-4 py-2 border border-border bg-surface text-ink hover:bg-surface-muted"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ─── Alan Menken Style Editorial Title & Details ─── */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-accent font-semibold">
          <span>№ {formattedIndex}</span>
          <span>·</span>
          <span>{current.category.replace("-", " ")}</span>
          <span>·</span>
          <span>{current.medium.replace("-", " ")}</span>
        </div>

        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight">
          {current.title}
        </h2>

        {current.alt_text && (
          <p className="text-xs sm:text-sm text-text-muted italic max-w-lg mx-auto line-clamp-2">
            &ldquo;{current.alt_text}&rdquo;
          </p>
        )}

        <div className="pt-2">
          <Link
            href={`/artworks/${current.slug}`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover transition-colors pb-1 border-b border-accent/40 hover:border-accent"
          >
            <span>Explore Artwork Details</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* ─── Kern Inc Inspired Bottom Dock Navigation ─── */}
      <div className="border-t border-dashed border-border-strong/50 pt-5 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Left: Dock Instruction / Status */}
          <div className="flex items-center gap-2 text-text-muted font-mono text-[11px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Archive Index · Click item to spotlight</span>
          </div>

          {/* Center: Interactive Thumb / Icon Ribbon */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full py-2 px-1 scrollbar-none">
            {artworks.map((artwork, idx) => {
              const isSelected = idx === activeIndex;
              const itemNumber = String(idx + 1).padStart(2, "0");
              const thumbUrl = getStoragePublicUrl(artwork.public_image_path);

              return (
                <button
                  key={artwork.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xs transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-ink text-surface border-ink shadow-md"
                      : "bg-surface text-ink-soft border-border hover:border-border-strong hover:bg-surface-muted"
                  }`}
                  aria-label={`Select artwork ${itemNumber}: ${artwork.title}`}
                >
                  {/* Mini thumbnail */}
                  <span className="w-5 h-5 rounded-xs overflow-hidden shrink-0 border border-black/10 bg-surface-muted inline-block">
                    {thumbUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </span>

                  <span className="font-mono text-[10px] tracking-wider font-semibold">
                    {itemNumber}
                  </span>

                  <span
                    className={`text-[11px] font-serif max-w-[100px] truncate hidden lg:inline-block ${
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

          {/* Right: Prev / Next Navigation Arrows */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous artwork"
              className="p-2 border border-border bg-surface hover:bg-surface-muted text-ink transition-colors cursor-pointer rounded-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <span className="px-2 text-[11px] text-text-muted">
              {formattedIndex} / {formattedTotal}
            </span>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next artwork"
              className="p-2 border border-border bg-surface hover:bg-surface-muted text-ink transition-colors cursor-pointer rounded-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}