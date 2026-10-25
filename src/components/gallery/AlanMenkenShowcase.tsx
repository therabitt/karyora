"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { PublicArtwork } from "@/lib/data/artworks";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";

export interface AlanMenkenShowcaseProps {
  artworks: PublicArtwork[];
  totalCount: number;
  initialIndex?: number;
  profile?: {
    display_name?: string | null;
    commission_availability?: "open" | "waitlist" | "closed" | null;
    availability_message?: string | null;
  };
}

// Staggered vertical offsets and height percentages to recreate Alan Menken's organic architectural rhythm
const STAGGER_OFFSETS_RIBBONS = [-14, 16, -10, 18, 0, -16, 14, -12, 10];
const STAGGER_HEIGHTS_RIBBONS = [86, 90, 88, 94, 100, 92, 86, 92, 88];

const SLICE_COUNT = 5;
const SLICE_OFFSETS = [14, -16, 18, -10, 12];
const SLICE_HEIGHTS = [88, 95, 100, 92, 86];

export function AlanMenkenShowcase({
  artworks,
  totalCount,
  initialIndex = 0,
  profile,
}: AlanMenkenShowcaseProps) {
  // Support up to 9 artworks for desktop ribbon layout
  const displayArtworks = artworks.slice(0, 9);
  const total = displayArtworks.length;

  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialIndex >= 0 && initialIndex < total) {
      return initialIndex;
    }
    // Default to the middle piece (around 4 or center) if available
    return Math.min(Math.floor(total / 2), total - 1);
  });

  const [viewMode, setViewMode] = useState<"ribbons" | "sliced">("ribbons");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const current = displayArtworks[activeIndex] || displayArtworks[0];
  const prevArtwork = displayArtworks[(activeIndex - 1 + total) % total];
  const nextArtwork = displayArtworks[(activeIndex + 1) % total];

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
      const target = document.activeElement;
      const tag = target?.tagName.toLowerCase();
      if (
        e.defaultPrevented ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag === "button" ||
        tag === "a" ||
        target?.getAttribute("contenteditable") === "true"
      ) return;

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
  }, [handleNext, handlePrev]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  if (!displayArtworks || displayArtworks.length === 0) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-8 text-center bg-paper text-ink">
        <h1 className="font-brand text-3xl mb-2">Karyora</h1>
        <p className="text-sm text-text-muted max-w-sm mb-6">Exhibition in Preparation</p>
        <Link
          href="/gallery"
          className="px-5 py-2.5 bg-ink text-surface text-xs uppercase tracking-widest rounded-xs"
        >
          Browse Archive
        </Link>
      </div>
    );
  }

  const currentImageUrl = current ? getStoragePublicUrl(current.public_image_path) : "";
  const isCommissionOpen = profile?.commission_availability === "open";
  const isWaitlist = profile?.commission_availability === "waitlist";

  return (
    <div className="relative w-full h-[100dvh] min-h-[640px] bg-paper text-ink overflow-hidden flex flex-col justify-between select-none">
      {/* ─── Top Bar ─── */}
      <header className="relative z-30 w-full h-16 sm:h-20 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Left: Availability Status Pill ("other stuff maybe?") */}
        <div className="flex items-center">
          <Link
            href="/commission"
            aria-label="View commission availability status"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-mono uppercase tracking-wider bg-surface/90 border border-border/70 hover:border-accent hover:text-accent transition-all shadow-2xs group"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isCommissionOpen
                  ? "bg-success animate-pulse"
                  : isWaitlist
                  ? "bg-warning animate-pulse"
                  : "bg-text-muted"
              }`}
            />
            <span className="font-medium text-ink-soft group-hover:text-accent hidden sm:inline">
              {isCommissionOpen
                ? "Commissions Open"
                : isWaitlist
                ? "Waitlist Open"
                : "Commissions Closed"}
            </span>
            <span className="font-medium text-ink-soft group-hover:text-accent sm:hidden">
              {isCommissionOpen ? "Open" : isWaitlist ? "Waitlist" : "Closed"}
            </span>
          </Link>
        </div>

        {/* Center: Custom Handwritten/Script Logo ("beautiful custom font logo") */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <Link
            href="/"
            aria-label="Karyora Studio Homepage"
            className="font-brand text-3xl sm:text-4xl lg:text-[44px] tracking-tight text-ink hover:text-accent transition-colors"
          >
            Karyora
          </Link>
        </div>

        {/* Shared hamburger navigation */}
        <div className="flex items-center">
          <PublicNavigationMenu buttonClassName="p-2 sm:p-2.5 text-ink hover:text-accent" />
        </div>
      </header>

      {/* ─── Center Stage ─── */}
      <main className="relative z-20 flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-8 flex flex-col items-center justify-center min-h-0 py-2">
        {viewMode === "ribbons" ? (
          /* ─── Mode 1: Alan Menken Staggered Multi-Artwork Ribbons ─── */
          <div className="w-full flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            {/* The Staggered Ribbons Row */}
            <div
              role="region"
              aria-label="Multi-artwork ribbons stage"
              className="w-full flex items-center justify-center gap-2 sm:gap-3 lg:gap-3.5 h-[340px] sm:h-[400px] md:h-[450px] lg:h-[490px] xl:h-[530px]"
            >
              {displayArtworks.map((artwork, idx) => {
                const isActive = idx === activeIndex;
                const imageUrl = getStoragePublicUrl(artwork.public_image_path);
                const isFailed = failedImages[artwork.id];
                const staggerOffset = STAGGER_OFFSETS_RIBBONS[idx % STAGGER_OFFSETS_RIBBONS.length];
                const heightPercent = STAGGER_HEIGHTS_RIBBONS[idx % STAGGER_HEIGHTS_RIBBONS.length];

                return (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    aria-label={`Select artwork ${idx + 1}: ${artwork.title}`}
                    aria-current={isActive ? "true" : undefined}
                    style={{
                      height: `${heightPercent}%`,
                      transform: `translateY(${staggerOffset}px)`,
                    }}
                    className={`relative overflow-hidden rounded-xs cursor-pointer text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive
                        ? "w-44 sm:w-56 md:w-64 lg:w-72 xl:w-80 z-20 shadow-2xl border-2 border-accent"
                        : "w-10 sm:w-14 md:w-16 lg:w-20 xl:w-22 z-10 opacity-35 hover:opacity-80 grayscale hover:grayscale-0 border border-border/70"
                    }`}
                  >
                    {imageUrl && !isFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={artwork.alt_text || artwork.title}
                        onError={() => handleImageError(artwork.id)}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                          isActive ? "scale-100" : "scale-105"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-muted flex flex-col items-center justify-center p-2 text-center">
                        <span className="font-artwork-title text-xs text-ink">{artwork.title}</span>
                      </div>
                    )}

                    {/* Inactive vertical label strip */}
                    {!isActive && (
                      <div className="absolute inset-0 flex flex-col justify-end p-2 pointer-events-none bg-linear-to-t from-ink/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-artwork-title text-white whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate">
                          {artwork.title}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Below Stage: Centered Title & Metadata (Alan Menken Reference) */}
            <div className="text-center space-y-1 max-w-xl mx-auto px-4 animate-fade-in">
              <span className="text-xs sm:text-sm font-sans italic text-ink-soft block">
                Explore Artwork &amp; Extra Material
              </span>
              <h2 className="font-artwork-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-ink tracking-tight leading-tight">
                <Link
                  href={`/artworks/${current.slug}`}
                  className="hover:text-accent transition-colors"
                >
                  {current.title}
                </Link>
              </h2>
              <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-accent font-semibold pt-0.5">
                <span>Medium: {current.medium.replace("-", " ")}</span>
                <span className="text-border-strong mx-2">·</span>
                <span>Category: {current.category.replace("-", " ")}</span>
              </div>
            </div>
          </div>
        ) : (
          /* ─── Mode 2: Alan Menken Segmented Sliced Artwork Poster (Image 3) ─── */
          <div className="w-full flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            <div className="relative w-full max-w-5xl flex items-center justify-center">
              {/* Left Navigation Arrow */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label={`Previous artwork: ${prevArtwork.title}`}
                className="hidden md:flex flex-col items-start gap-1 p-3 text-text-muted hover:text-ink transition-colors cursor-pointer mr-4 lg:mr-8 group"
              >
                <span className="text-lg font-sans transition-transform group-hover:-translate-x-1">
                  ←
                </span>
                <span className="text-[11px] font-artwork-title max-w-[110px] truncate text-left">
                  {prevArtwork.title}
                </span>
              </button>

              {/* The 5 Sliced Slats of the Active Artwork */}
              <div
                role="region"
                aria-label="Segmented sliced artwork canvas"
                className="flex items-center justify-center gap-1.5 sm:gap-3.5 h-[340px] sm:h-[400px] md:h-[460px] lg:h-[510px] xl:h-[550px]"
              >
                {Array.from({ length: SLICE_COUNT }).map((_, sliceIdx) => {
                  const staggerOffset = SLICE_OFFSETS[sliceIdx];
                  const heightPercent = SLICE_HEIGHTS[sliceIdx];
                  const bgPositionX = `${(sliceIdx / (SLICE_COUNT - 1)) * 100}%`;

                  return (
                    <div
                      key={sliceIdx}
                      style={{
                        height: `${heightPercent}%`,
                        transform: `translateY(${staggerOffset}px)`,
                      }}
                      className="relative w-12 sm:w-20 md:w-28 lg:w-36 xl:w-44 overflow-hidden rounded-xs border border-border/80 shadow-xl transition-all duration-700 ease-out group"
                    >
                      {currentImageUrl && !failedImages[current.id] ? (
                        <div
                          style={{
                            backgroundImage: `url(${currentImageUrl})`,
                            backgroundSize: `${SLICE_COUNT * 100}% 100%`,
                            backgroundPosition: `${bgPositionX} center`,
                            backgroundRepeat: "no-repeat",
                          }}
                          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-muted" />
                      )}

                      {/* On the second slice: Floating Audio / Explore Tag (Like "Just Around the Riverbend" in Reference) */}
                      {sliceIdx === 1 && (
                        <div className="absolute top-4 left-2 right-2 pointer-events-auto">
                          <Link
                            href={`/artworks/${current.slug}`}
                            className="bg-ink/90 text-white text-[10px] font-mono uppercase tracking-widest py-3 px-2 rounded-2xs flex flex-col items-center justify-center gap-1.5 shadow-md hover:bg-accent transition-colors text-center"
                          >
                            <span className="whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate max-h-[140px]">
                              {current.title}
                            </span>
                            <span className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center text-[8px] shrink-0 mt-1">
                              ▶
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Right Slat: Vertical Title Plate (Exact Alan Menken Layout from Image 3) */}
                <div className="hidden lg:flex flex-col items-center justify-center pl-4 pr-2 space-y-4">
                  <div className="[writing-mode:vertical-rl] rotate-180 font-artwork-title text-3xl xl:text-4xl text-ink tracking-tight leading-tight">
                    <Link
                      href={`/artworks/${current.slug}`}
                      className="hover:text-accent transition-colors"
                    >
                      {current.title}
                    </Link>
                  </div>
                  <span className="w-4 h-[1px] bg-border-strong my-2" />
                  <Link
                    href={`/artworks/${current.slug}`}
                    className="text-[10px] font-sans italic text-text-muted hover:text-accent transition-colors [writing-mode:vertical-rl] rotate-180 tracking-wider"
                  >
                    Explore Case Study
                  </Link>
                </div>
              </div>

              {/* Right Navigation Arrow */}
              <button
                type="button"
                onClick={handleNext}
                aria-label={`Next artwork: ${nextArtwork.title}`}
                className="hidden md:flex flex-col items-end gap-1 p-3 text-text-muted hover:text-ink transition-colors cursor-pointer ml-4 lg:mr-8 group"
              >
                <span className="text-lg font-sans transition-transform group-hover:translate-x-1">
                  →
                </span>
                <span className="text-[11px] font-artwork-title max-w-[110px] truncate text-right">
                  {nextArtwork.title}
                </span>
              </button>
            </div>

            {/* Mobile Controls for Sliced Mode */}
            <div className="md:hidden flex items-center justify-between w-full max-w-xs px-2 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="text-xs uppercase font-mono font-semibold px-3 py-1.5 border border-border bg-surface text-ink rounded-xs"
              >
                ← Prev
              </button>
              <Link
                href={`/artworks/${current.slug}`}
                className="text-sm font-artwork-title text-accent font-medium truncate max-w-[160px]"
              >
                {current.title}
              </Link>
              <button
                type="button"
                onClick={handleNext}
                className="text-xs uppercase font-mono font-semibold px-3 py-1.5 border border-border bg-surface text-ink rounded-xs"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── Bottom Bar Controls ─── */}
      <footer className="relative z-30 w-full h-16 sm:h-20 px-4 sm:px-8 lg:px-12 flex items-center justify-between border-t border-border/40 bg-paper/60 backdrop-blur-2xs">
        {/* Left: Gallery Link ("gallery artworks" / "SEE ALL 12 WORKS") */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-muted shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <Link
            href="/gallery"
            className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.16em] sm:tracking-[0.2em] text-ink-soft hover:text-accent font-semibold transition-colors"
          >
            <span className="hidden sm:inline">See All {totalCount} Works</span>
            <span className="sm:hidden">Archive ({totalCount})</span>
          </Link>
        </div>

        {/* Center: The Option Look Design Toggle Pill ("option look design") */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center">
          <div
            role="radiogroup"
            aria-label="Showcase view mode"
            className="flex items-center gap-1 p-1 bg-surface border border-border rounded-full shadow-2xs"
          >
            {/* Mode 2 Button: Sliced Poster Mode */}
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "sliced"}
              onClick={() => setViewMode("sliced")}
              aria-label="Segmented sliced artwork view"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "sliced"
                  ? "bg-ink text-surface shadow-xs"
                  : "text-text-muted hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>

            {/* Mode 1 Button: Staggered Multi-Ribbons Mode */}
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "ribbons"}
              onClick={() => setViewMode("ribbons")}
              aria-label="Multi-artwork ribbons view"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "ribbons"
                  ? "bg-ink text-surface shadow-xs"
                  : "text-text-muted hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="4" y2="18" />
                <line x1="8" y1="4" x2="8" y2="20" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="16" y1="5" x2="16" y2="19" />
                <line x1="20" y1="7" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Quick Inquire Action */}
        <div className="flex items-center">
          <Link
            href="/commission"
            className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-accent hover:text-accent-hover font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Inquire</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </footer>


    </div>
  );
}
