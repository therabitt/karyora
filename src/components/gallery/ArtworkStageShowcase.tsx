"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { PublicArtwork } from "@/lib/data/artworks";
import { Badge } from "@/components/ui/Badge";

export interface ArtworkStageShowcaseProps {
  artworks: PublicArtwork[];
  initialIndex?: number;
  profile?: {
    display_name?: string | null;
    commission_availability?: "open" | "waitlist" | "closed" | null;
    availability_message?: string | null;
  };
}

export function ArtworkStageShowcase({
  artworks,
  initialIndex = 0,
  profile,
}: ArtworkStageShowcaseProps) {
  // Limit showcase to 5 curated featured works
  const displayArtworks = artworks.slice(0, 5);
  const total = displayArtworks.length;

  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialIndex >= 0 && initialIndex < total) {
      return initialIndex;
    }
    return 0;
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

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

  const handleImageLoad = (id: string, naturalWidth: number, naturalHeight: number) => {
    if (naturalWidth && naturalHeight) {
      const ratio = naturalHeight / naturalWidth;
      setAspectRatios((prev) => {
        if (prev[id] === ratio) return prev;
        return { ...prev, [id]: ratio };
      });
    }
  };

  if (!displayArtworks || displayArtworks.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center border border-dashed border-border bg-surface-muted/30 rounded-xs">
        <p className="font-sans text-2xl text-ink">Exhibition in Preparation</p>
        <p className="text-xs text-text-muted mt-2 max-w-sm">
          New original works will be presented here shortly.
        </p>
        <Link
          href="/gallery"
          className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold px-4 py-2 bg-ink text-surface hover:bg-accent rounded-xs transition-colors motion-transition-micro"
        >
          <span>Browse Archive</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const currentImageUrl = current ? getStoragePublicUrl(current.public_image_path) : null;
  const currentImageFailed = current ? failedImages[current.id] : false;
  const currentRatio = current ? aspectRatios[current.id] || 1 : 1;
  const isCurrentPortrait = currentRatio > 1.15;
  const formattedIndex = String(activeIndex + 1).padStart(2, "0");
  const formattedTotal = String(total).padStart(2, "0");

  const isCommissionOpen = profile?.commission_availability === "open";
  const isWaitlist = profile?.commission_availability === "waitlist";

  return (
    <div className="w-full flex flex-col">
      {/* ─── Screen 1: Full-Viewport Editorial Exhibition Stage ─── */}
      <section
        role="region"
        aria-label="Featured Artworks Showcase"
        className="w-full min-h-[100dvh] flex flex-col justify-between pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto select-none"
      >
        {/* Masthead Bar Underneath Floating Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.22em] text-accent font-semibold">
            <span>{profile?.display_name || "Karyora Studio"}</span>
            <span className="text-border-strong font-normal">/</span>
            <span className="text-text-muted">Curated Exhibition</span>
          </div>

          <div className="flex items-center gap-3">
            {profile?.commission_availability && (
              <Badge variant={profile.commission_availability}>
                {isCommissionOpen
                  ? "● Commissions Open"
                  : isWaitlist
                  ? "● Waitlist Open"
                  : "○ Currently Closed"}
              </Badge>
            )}
            <Link
              href="/gallery"
              className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-accent transition-colors motion-transition-micro hidden sm:inline-flex items-center gap-1"
            >
              <span>Catalog № {formattedTotal}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Desktop Accordion Ribbon (Dominant Selected Artwork + Supporting Panels) */}
        <div className="hidden md:flex items-stretch gap-2.5 lg:gap-3.5 my-3 sm:my-4 w-full flex-1 min-h-[460px] max-h-[72vh] overflow-hidden">
          {displayArtworks.map((artwork, idx) => {
            const isActive = idx === activeIndex;
            const imageUrl = getStoragePublicUrl(artwork.public_image_path);
            const isFailed = failedImages[artwork.id];
            const itemNumber = String(idx + 1).padStart(2, "0");
            const ratio = aspectRatios[artwork.id] || 1;
            const isPortrait = ratio > 1.15;

            return (
              <button
                key={artwork.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Select artwork ${itemNumber}: ${artwork.title}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative overflow-hidden text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-safe:transition-all motion-transition-spotlight group ${
                  isActive
                    ? isPortrait
                      ? "flex-[2.8] lg:flex-[3.2] xl:flex-[3.6] rounded-xs border-2 border-accent shadow-2xl z-10 cursor-default"
                      : "flex-[4.2] lg:flex-[5] xl:flex-[5.6] rounded-xs border-2 border-accent shadow-2xl z-10 cursor-default"
                    : "flex-1 hover:flex-[1.2] rounded-xs border border-border/80 opacity-60 hover:opacity-90 grayscale hover:grayscale-0 hover:border-ink/40 cursor-pointer"
                }`}
              >
                {imageUrl && !isFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={artwork.alt_text || artwork.title}
                    onLoad={(e) => {
                      handleImageLoad(
                        artwork.id,
                        e.currentTarget.naturalWidth,
                        e.currentTarget.naturalHeight
                      );
                    }}
                    ref={(img) => {
                      if (
                        img &&
                        img.complete &&
                        img.naturalWidth &&
                        !aspectRatios[artwork.id]
                      ) {
                        handleImageLoad(
                          artwork.id,
                          img.naturalWidth,
                          img.naturalHeight
                        );
                      }
                    }}
                    onError={() => handleImageError(artwork.id)}
                    className={`w-full h-full motion-safe:transition-transform motion-transition-image ${
                      isPortrait ? "object-cover object-top" : "object-cover object-center"
                    } ${isActive ? "scale-100" : "scale-105"}`}
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center border border-border/40">
                    <div className="w-10 h-10 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-2.5 text-accent font-sans text-base">
                      {itemNumber}
                    </div>
                    <span className="font-artwork-title text-base md:text-lg text-ink font-normal max-w-[180px] line-clamp-2">
                      {artwork.title}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase mt-1">
                      {artwork.category.replace("-", " ")}
                    </span>
                  </div>
                )}

                {/* Inactive vertical label strip */}
                {!isActive && (
                  <div
                    className={`absolute inset-0 flex flex-col justify-between p-3.5 pointer-events-none transition-colors motion-transition-micro ${
                      imageUrl && !isFailed
                        ? "bg-ink/40 group-hover:bg-ink/15"
                        : "bg-paper/30 group-hover:bg-paper/10"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono tracking-widest font-semibold ${
                        imageUrl && !isFailed ? "text-white/95" : "text-ink font-bold"
                      }`}
                    >
                      № {itemNumber}
                    </span>
                    <span
                      className={`text-[11px] font-artwork-title tracking-wider whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate ${
                        imageUrl && !isFailed
                          ? "text-white/95"
                          : "text-ink group-hover:text-accent font-medium"
                      }`}
                    >
                      {artwork.title}
                    </span>
                  </div>
                )}

                {/* Active strip spotlight tag */}
                {isActive && (
                  <div className="absolute top-3.5 left-3.5 pointer-events-none">
                    <span className="text-[10px] font-mono tracking-[0.22em] text-white uppercase bg-ink/85 px-3 py-1 rounded-xs backdrop-blur-xs shadow-xs font-semibold">
                      Spotlight · {itemNumber} of {formattedTotal}
                    </span>
                  </div>
                )}

                {/* Active Artwork Integrated Lower Plaque */}
                {isActive && (
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-auto">
                    <div className="bg-paper/92 backdrop-blur-md border border-border/80 px-4 sm:px-5 py-3 rounded-xs shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-accent font-semibold">
                          <span>{artwork.category.replace("-", " ")}</span>
                          <span className="text-border-strong font-normal">/</span>
                          <span>{artwork.medium.replace("-", " ")}</span>
                        </div>
                        <h2 className="font-artwork-title text-xl sm:text-2xl md:text-3xl text-ink tracking-tight truncate font-normal">
                          {artwork.title}
                        </h2>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <Link
                          href={`/artworks/${artwork.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-semibold px-3.5 py-1.5 bg-ink text-surface hover:bg-accent hover:text-white rounded-xs transition-all motion-transition-ui shadow-xs group/link"
                        >
                          <span>Case Study</span>
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
              </button>
            );
          })}
        </div>

        {/* Mobile View: Dedicated Touch Focal Card */}
        <div className="md:hidden space-y-3 my-4 flex-1 flex flex-col justify-center">
          <div
            className={`relative ${
              isCurrentPortrait ? "aspect-3/4 max-w-xs" : "aspect-4/3 max-w-sm"
            } mx-auto w-full overflow-hidden rounded-xs border border-border bg-surface-muted shadow-md`}
          >
            {currentImageUrl && !currentImageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={current.alt_text || current.title}
                onLoad={(e) => {
                  handleImageLoad(
                    current.id,
                    e.currentTarget.naturalWidth,
                    e.currentTarget.naturalHeight
                  );
                }}
                onError={() => handleImageError(current.id)}
                className={`w-full h-full ${
                  isCurrentPortrait
                    ? "object-cover object-top"
                    : "object-cover object-center"
                }`}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-2 text-accent font-sans text-base">
                  {formattedIndex}
                </div>
                <span className="font-artwork-title text-xl text-ink font-normal max-w-[220px]">
                  {current.title}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase mt-1">
                  {current.category.replace("-", " ")}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-ink/85 text-white font-mono text-[10px] tracking-wider rounded-xs font-semibold">
              № {formattedIndex} / {formattedTotal}
            </div>
          </div>

          {/* Mobile Prev / Next Controls & Direct Title Action */}
          <div className="space-y-3 max-w-sm mx-auto w-full">
            <div className="text-center space-y-0.5 px-2">
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-accent font-semibold">
                <span>{current.category.replace("-", " ")}</span>
                <span className="text-border-strong font-normal">/</span>
                <span>{current.medium.replace("-", " ")}</span>
              </div>
              <h2 className="font-artwork-title text-xl text-ink tracking-tight font-normal">
                {current.title}
              </h2>
              <div className="pt-0.5">
                <Link
                  href={`/artworks/${current.slug}`}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-accent hover:text-accent-hover"
                >
                  <span>Explore Case Study</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
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

        {/* Lower Viewport Editorial Bar */}
        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-sans text-ink-soft">
            <span className="italic font-normal">&ldquo;Where imagination finds its deliberate form.&rdquo;</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted ml-auto">
            <span>Scroll for Archive & Offerings</span>
            <span aria-hidden="true" className="animate-bounce inline-block text-accent font-semibold">
              ↓
            </span>
          </div>
        </div>
      </section>

      {/* ─── Screen 2: Curated Exhibition Index & Detailed Metadata Plate ─── */}
      <section className="w-full border-t border-border bg-surface/50 pt-18 sm:pt-24 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Active Piece Detailed Dossier */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
                <span>
                  № {formattedIndex} of {formattedTotal}
                </span>
                <span className="text-border-strong font-normal">/</span>
                <span>{current.category.replace("-", " ")}</span>
                <span className="text-border-strong font-normal">/</span>
                <span>{current.medium.replace("-", " ")}</span>
              </div>

              <h2 className="font-artwork-title text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight leading-[1.1]">
                <Link
                  href={`/artworks/${current.slug}`}
                  className="hover:text-accent transition-colors motion-transition-micro"
                >
                  {current.title}
                </Link>
              </h2>

              {current.description && (
                <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-xl font-normal pt-1">
                  {current.description}
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-4">
              <Link
                href={`/artworks/${current.slug}`}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover pb-1 border-b-2 border-accent/40 hover:border-accent transition-all motion-transition-ui group"
              >
                <span>Explore Full Case Study & Palette</span>
                <span
                  aria-hidden="true"
                  className="motion-safe:transition-transform motion-transition-micro group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Exhibition Index Switcher Ribbon */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-muted font-semibold">
                Curated Exhibition Switcher
              </span>
              <Link
                href="/gallery"
                className="text-xs font-mono uppercase tracking-wider text-accent hover:text-accent-hover font-semibold flex items-center gap-1.5 transition-colors motion-transition-micro"
              >
                <span>Complete Archive (21 Works)</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div
              role="tablist"
              aria-label="Exhibition index navigation"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
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
                    className={`group relative flex items-center gap-3 p-3 rounded-xs transition-all motion-transition-ui text-left border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                      isSelected
                        ? "bg-ink text-surface border-ink shadow-md"
                        : "bg-surface text-ink-soft border-border hover:border-border-strong hover:bg-surface-muted"
                    }`}
                    aria-label={`Select exhibition piece ${itemNumber}: ${artwork.title}`}
                  >
                    <span className="w-10 h-10 rounded-2xs overflow-hidden shrink-0 border border-black/10 bg-surface-muted inline-flex items-center justify-center">
                      {thumbUrl && !thumbFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt=""
                          onError={() => handleImageError(artwork.id)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-mono font-semibold text-accent">
                          {itemNumber}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span
                        className={`text-[10px] font-mono tracking-widest uppercase block ${
                          isSelected ? "text-accent" : "text-text-muted"
                        }`}
                      >
                        № {itemNumber}
                      </span>
                      <span
                        className={`text-sm font-artwork-title truncate block ${
                          isSelected ? "text-surface font-medium" : "text-ink group-hover:text-accent"
                        }`}
                      >
                        {artwork.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
