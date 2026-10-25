"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { PublicArtwork } from "@/lib/data/artworks";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";
import {
  fitArtworkWithinBounds,
  getArtworkWindow,
  getResponsivePanelCount,
  resolveArtworkDimensions,
  type ArtworkDimensions,
} from "@/lib/gallery/artwork-layout";

export interface AlanMenkenShowcaseProps {
  artworks: PublicArtwork[];
  totalCount: number;
  initialIndex?: number;
}

const STAGGER_OFFSETS_RIBBONS = [-14, 16, -10, 18, 0, -16, 14, -12, 10];
const STAGGER_HEIGHTS_RIBBONS = [86, 90, 88, 94, 100, 92, 86, 92, 88];
const SLICE_COUNT = 5;
const SLICE_OFFSETS = [14, -16, 18, -10, 12];
const SLICE_HEIGHTS = [88, 95, 100, 92, 86];

type ViewMode = "ribbons" | "sliced";

function getPanelVisibilityClass(offset: number): string {
  const distance = Math.abs(offset);
  if (distance <= 1) return "flex";
  if (distance === 2) return "hidden sm:flex";
  if (distance === 3) return "hidden lg:flex";
  return "hidden xl:flex";
}

export function AlanMenkenShowcase({
  artworks,
  totalCount,
  initialIndex = 0,
}: AlanMenkenShowcaseProps) {
  const displayArtworks = artworks;
  const total = displayArtworks.length;
  const [rawActiveIndex, setRawActiveIndex] = useState(() =>
    initialIndex >= 0 && initialIndex < total ? initialIndex : 0
  );
  const activeIndex = total > 0 ? ((rawActiveIndex % total) + total) % total : 0;

  const [viewMode, setViewMode] = useState<ViewMode>("ribbons");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [measuredDimensions, setMeasuredDimensions] = useState<Record<string, ArtworkDimensions>>({});
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.round(rect.width));
      const height = Math.max(0, Math.round(rect.height));
      setStageSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height }
      );
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setRawActiveIndex((previous) => (previous + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setRawActiveIndex((previous) => (previous - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isNavigationOpen || event.defaultPrevented) return;

      const target = document.activeElement;
      const tag = target?.tagName.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag === "button" ||
        tag === "a" ||
        target?.getAttribute("contenteditable") === "true"
      ) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isNavigationOpen]);

  const handleImageError = useCallback((id: string) => {
    setFailedImages((previous) => ({ ...previous, [id]: true }));
  }, []);

  const handleImageLoad = useCallback((id: string, image: HTMLImageElement) => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (width <= 0 || height <= 0) return;

    setMeasuredDimensions((previous) => {
      const current = previous[id];
      if (current?.width === width && current?.height === height) return previous;
      return { ...previous, [id]: { width, height } };
    });
  }, []);

  const getDimensions = useCallback((artwork: PublicArtwork): ArtworkDimensions => {
    if (
      Number.isFinite(artwork.image_width) &&
      Number.isFinite(artwork.image_height) &&
      (artwork.image_width ?? 0) > 0 &&
      (artwork.image_height ?? 0) > 0
    ) {
      return resolveArtworkDimensions(artwork.image_width, artwork.image_height);
    }

    const measured = measuredDimensions[artwork.id];
    if (measured) return measured;

    return resolveArtworkDimensions(null, null);
  }, [measuredDimensions]);

  if (total === 0) {
    return (
      <div className="flex min-h-[100svh] w-full flex-col items-center justify-center bg-paper p-8 text-center text-ink">
        <h1 className="mb-2 font-brand text-3xl">Karyora</h1>
        <p className="mb-6 max-w-sm text-sm text-text-muted">Exhibition in Preparation</p>
        <Link
          href="/gallery"
          className="rounded-xs bg-ink px-5 py-2.5 text-xs uppercase tracking-widest text-surface transition-colors hover:bg-accent"
        >
          Browse Archive
        </Link>
      </div>
    );
  }

  const current = displayArtworks[activeIndex];
  const previousArtwork = displayArtworks[(activeIndex - 1 + total) % total];
  const nextArtwork = displayArtworks[(activeIndex + 1) % total];
  const currentImageUrl = getStoragePublicUrl(current.public_image_path);
  const stageWidth = stageSize.width || 1440;
  const stageHeight = stageSize.height || 520;
  const visiblePanelCount = getResponsivePanelCount(stageWidth, total);
  const stageWindow = getArtworkWindow(total, activeIndex, visiblePanelCount);
  const ribbonGap = Math.max(5, Math.min(10, stageWidth * 0.006));
  const previewPanelCount = Math.max(0, visiblePanelCount - 1);
  const activeDimensions = getDimensions(current);
  const activeAspectRatio = activeDimensions.width / activeDimensions.height;
  const preferredActiveWidth =
    stageWidth < 640
      ? stageWidth * (activeAspectRatio >= 1.2 ? 0.76 : 0.54)
      : stageWidth * (activeAspectRatio >= 1.3 ? 0.54 : activeAspectRatio >= 0.85 ? 0.42 : 0.36);
  const activeSize = fitArtworkWithinBounds(
    activeDimensions.width,
    activeDimensions.height,
    preferredActiveWidth,
    stageHeight * 0.86
  );
  const availablePreviewWidth = previewPanelCount > 0
    ? (stageWidth - activeSize.width - previewPanelCount * ribbonGap - 12) / previewPanelCount
    : 0;
  const maxPreviewWidth = stageWidth < 640
    ? stageWidth * 0.31
    : stageWidth < 1024
    ? stageWidth * 0.18
    : 140;
  const previewWidth = previewPanelCount > 0
    ? Math.max(18, Math.min(maxPreviewWidth, availablePreviewWidth))
    : 0;

  const sliceGap = stageWidth < 640 ? 3 : stageWidth < 1024 ? 6 : 8;
  const sliceControlsGutter = stageWidth < 640 ? 46 : Math.min(112, stageWidth * 0.08);
  const sliceMaxWidth = Math.max(
    120,
    Math.min(
      stageWidth * (stageWidth < 640 ? 0.78 : 0.8),
      stageWidth - 2 * sliceControlsGutter - sliceGap * (SLICE_COUNT - 1)
    )
  );
  const sliceSize = fitArtworkWithinBounds(
    activeDimensions.width,
    activeDimensions.height,
    sliceMaxWidth,
    stageHeight * 0.82
  );
  const slicePanelWidth = sliceSize.width / SLICE_COUNT;
  const scaledSliceOffsets = SLICE_OFFSETS.map((offset) =>
    Math.round(offset * Math.min(1.35, Math.max(0.65, stageHeight / 480)))
  );
  const maxSliceOffset = Math.max(...scaledSliceOffsets.map(Math.abs), 0);
  const sliceGroupWidth = sliceSize.width + sliceGap * (SLICE_COUNT - 1);
  const sliceGroupHeight = sliceSize.height + maxSliceOffset * 2;

  return (
    <div className="relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-paper text-ink">
      <header className="relative z-[101] flex h-16 shrink-0 items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-12">
        <div className="w-11 sm:w-12" aria-hidden="true" />

        <Link
          href="/"
          aria-label="Karyora home"
          className={
            "absolute left-1/2 top-1/2 z-[103] -translate-x-1/2 -translate-y-1/2 font-brand text-3xl leading-none tracking-tight transition-colors sm:text-4xl lg:text-[44px] " +
            (isNavigationOpen ? "text-paper" : "text-ink hover:text-accent")
          }
        >
          Karyora
        </Link>

        <PublicNavigationMenu
          buttonClassName="text-ink hover:text-accent"
          onOpenChange={setIsNavigationOpen}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <section
          ref={stageRef}
          aria-label="Artwork viewport"
          className="relative min-h-0 w-full flex-1 overflow-hidden"
        >
          {viewMode === "ribbons" ? (
            <div className="absolute inset-0 flex items-center overflow-hidden">
              <div
                className="flex h-full w-max min-w-full items-center justify-center"
                style={{ gap: ribbonGap + "px" }}
                role="group"
                aria-label="Select an artwork"
              >
                {stageWindow.map(({ index, offset }) => {
                  const artwork = displayArtworks[index];
                  const isActive = index === activeIndex;
                  const imageUrl = getStoragePublicUrl(artwork.public_image_path);
                  const failed = failedImages[artwork.id];
                  const patternIndex = ((offset + 4) % STAGGER_HEIGHTS_RIBBONS.length + STAGGER_HEIGHTS_RIBBONS.length) % STAGGER_HEIGHTS_RIBBONS.length;
                  const heightPercent = STAGGER_HEIGHTS_RIBBONS[patternIndex];
                  const staggerOffset = Math.round(
                    STAGGER_OFFSETS_RIBBONS[patternIndex] * Math.min(1.2, Math.max(0.6, stageHeight / 480))
                  );

                  if (isActive) {
                    return (
                      <div
                        key={artwork.id}
                        className="relative z-20 flex shrink-0 items-center justify-center overflow-hidden rounded-xs border-2 border-accent bg-surface shadow-xl transition-[width,height] duration-500 ease-out motion-reduce:transition-none"
                        style={{
                          width: activeSize.width + "px",
                          height: activeSize.height + "px",
                        }}
                      >
                        {imageUrl && !failed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={artwork.alt_text || artwork.title}
                            onLoad={(event) => handleImageLoad(artwork.id, event.currentTarget)}
                            onError={() => handleImageError(artwork.id)}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-muted p-3 text-center">
                            <span className="font-artwork-title text-xl text-ink">{artwork.title}</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const visibility = getPanelVisibilityClass(offset);
                  const previewHeight = Math.round(stageHeight * heightPercent / 100);
                  return (
                    <button
                      key={artwork.id}
                      type="button"
                      onClick={() => setRawActiveIndex(index)}
                      aria-label={"Select artwork: " + artwork.title}
                      aria-pressed="false"
                      className={"group relative shrink-0 overflow-hidden rounded-xs border border-border/70 bg-surface-muted opacity-45 grayscale transition-[opacity,filter,transform] duration-500 ease-out hover:opacity-90 hover:grayscale-0 motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent " + visibility}
                      style={{
                        width: previewWidth + "px",
                        height: previewHeight + "px",
                        transform: "translateY(" + staggerOffset + "px)",
                      }}
                    >
                      {imageUrl && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          onLoad={(event) => handleImageLoad(artwork.id, event.currentTarget)}
                          onError={() => handleImageError(artwork.id)}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-1 text-center">
                          <span className="font-artwork-title text-xs text-ink [writing-mode:vertical-rl]">{artwork.title}</span>
                        </div>
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/70 to-transparent p-2 text-left font-artwork-title text-sm leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {artwork.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={"Previous artwork: " + previousArtwork.title}
                className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-paper/90 text-ink transition-colors hover:border-accent hover:text-accent sm:left-5 sm:h-11 sm:w-11 motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div
                className="relative shrink-0"
                role="img"
                aria-label={"Sliced artwork composition: " + current.title}
                style={{
                  width: sliceGroupWidth + "px",
                  height: sliceGroupHeight + "px",
                }}
              >
                {Array.from({ length: SLICE_COUNT }, (_, sliceIndex) => {
                  const panelHeight = sliceSize.height * SLICE_HEIGHTS[sliceIndex] / 100;
                  const verticalOffset = scaledSliceOffsets[sliceIndex];
                  const panelTop =
                    maxSliceOffset +
                    (sliceSize.height - panelHeight) / 2 +
                    verticalOffset;
                  const left = sliceIndex * (slicePanelWidth + sliceGap);
                  const failed = failedImages[current.id];

                  return (
                    <div
                      key={sliceIndex}
                      className="absolute overflow-hidden rounded-[2px] border border-border/70 bg-surface-muted shadow-lg transition-[top,height] duration-500 ease-out motion-reduce:transition-none"
                      style={{
                        left: left + "px",
                        top: panelTop + "px",
                        width: slicePanelWidth + "px",
                        height: panelHeight + "px",
                      }}
                    >
                      {currentImageUrl && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentImageUrl}
                          alt=""
                          onLoad={(event) => handleImageLoad(current.id, event.currentTarget)}
                          onError={() => handleImageError(current.id)}
                          className="absolute max-w-none"
                          style={{
                            width: sliceSize.width + "px",
                            height: sliceSize.height + "px",
                            left: -sliceIndex * slicePanelWidth + "px",
                            top: -(sliceSize.height - panelHeight) / 2 + "px",
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-1 text-center">
                          <span className="font-artwork-title text-xs text-ink [writing-mode:vertical-rl]">{current.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label={"Next artwork: " + nextArtwork.title}
                className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-paper/90 text-ink transition-colors hover:border-accent hover:text-accent sm:right-5 sm:h-11 sm:w-11 motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </section>

        <section
          aria-label="Selected artwork information"
          className="flex shrink-0 flex-col items-center px-4 py-3 text-center sm:px-8 sm:py-4"
        >
          <h1 className="font-artwork-title text-3xl leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            <Link href={"/artworks/" + current.slug} className="transition-colors hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
              {current.title}
            </Link>
          </h1>
          {current.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl font-sans text-xs leading-relaxed text-ink-soft sm:text-sm">
              {current.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-accent sm:text-[11px]">
            <span>{current.medium.replace(/-/g, " ")}</span>
            <span aria-hidden="true" className="text-border-strong">·</span>
            <span>{current.category.replace(/-/g, " ")}</span>
          </div>
        </section>
      </main>

      <footer className="grid h-[60px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-border/50 bg-paper px-4 sm:h-[68px] sm:px-8 lg:px-12">
        <div className="min-w-0 justify-self-start">
          <Link
            href="/gallery"
            className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-accent sm:text-xs sm:tracking-[0.18em]"
          >
            <span className="hidden sm:inline">See All {totalCount} Works</span>
            <span className="sm:hidden">Archive · {totalCount}</span>
          </Link>
        </div>

        <div role="group" className="flex items-center gap-1 rounded-full border border-border bg-surface p-1" aria-label="Choose artwork viewport mode">
          <button
            type="button"
            aria-label="Ribbon artwork view"
            aria-pressed={viewMode === "ribbons"}
            onClick={() => setViewMode("ribbons")}
            className={"inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent sm:h-8 sm:w-8 " + (
              viewMode === "ribbons" ? "bg-ink text-surface" : "text-text-muted hover:text-ink"
            )}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="4" height="16" rx="1" />
              <rect x="10" y="2" width="4" height="20" rx="1" />
              <rect x="17" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Sliced artwork view"
            aria-pressed={viewMode === "sliced"}
            onClick={() => setViewMode("sliced")}
            className={"inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent sm:h-8 sm:w-8 " + (
              viewMode === "sliced" ? "bg-ink text-surface" : "text-text-muted hover:text-ink"
            )}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18" />
            </svg>
          </button>
        </div>

        <Link
          href={"/commission?ref=" + encodeURIComponent(current.slug)}
          className="justify-self-end text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:text-accent-hover sm:text-xs sm:tracking-[0.2em]"
        >
          Inquire <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </div>
  );
}
