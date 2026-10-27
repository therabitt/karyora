"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
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
import {
  getSwipeDirection,
  getWheelDirection,
  shouldHandleArtworkKeyboardNavigation,
} from "@/lib/gallery/artwork-interaction";

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

type ArtworkTransitionSnapshot = {
  artwork: PublicArtwork;
  direction: "next" | "previous";
  viewMode: ViewMode;
  sequence: number;
};

type RibbonRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  offset: number;
};

type RibbonLayoutEntry = {
  index: number;
  offset: number;
  artwork: PublicArtwork;
  isActive: boolean;
  imageUrl: string | null;
  failed: boolean;
  width: number;
  height: number;
  left: number;
  top: number;
  staggerOffset: number;
};

type ArtworkSwipeStart = {
  pointerId: number;
  x: number;
  y: number;
};

// Use layout effects in the browser to avoid a first-frame layout jump, while keeping
// server rendering free of useLayoutEffect warnings.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const [viewMode, setViewMode] = useState<ViewMode>("ribbons");
  const [transitionDirection, setTransitionDirection] = useState<"next" | "previous">("next");
  const [transitionSnapshot, setTransitionSnapshot] = useState<ArtworkTransitionSnapshot | null>(null);
  const transitionSequenceRef = useRef(0);
  const ribbonItemsRef = useRef(new Map<string, HTMLButtonElement>());
  const previousRibbonRectsRef = useRef<Map<string, RibbonRect> | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [measuredDimensions, setMeasuredDimensions] = useState<Record<string, ArtworkDimensions>>({});
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const wheelAccumulatorRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const lastWheelEventAtRef = useRef(0);
  const wheelUnlockTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<ArtworkSwipeStart | null>(null);

  useIsomorphicLayoutEffect(() => {
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

  const selectArtwork = useCallback((
    targetIndex: number,
    direction: "next" | "previous",
  ) => {
    if (total <= 1) return;

    const normalizedIndex = ((targetIndex % total) + total) % total;
    const outgoingIndex = activeIndexRef.current;
    if (normalizedIndex === outgoingIndex) return;

    const outgoingArtwork = displayArtworks[outgoingIndex];
    if (viewMode === "ribbons" && typeof window !== "undefined") {
      const previousRects = new Map<string, RibbonRect>();

      // Capture on-screen geometry before React changes the active artwork and panel positions.
      ribbonItemsRef.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          previousRects.set(id, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            offset: Number(element.dataset.ribbonOffset ?? "0"),
          });
        }
      });

      // Preserve the current visual position when another selection interrupts an animation.
      ribbonItemsRef.current.forEach((element) => {
        element.getAnimations().forEach((animation) => animation.cancel());
        element.style.transformOrigin = "top left";
      });
      previousRibbonRectsRef.current = previousRects;
      setTransitionSnapshot(null);
    } else {
      previousRibbonRectsRef.current = null;
      if (outgoingArtwork) {
        setTransitionSnapshot({
          artwork: outgoingArtwork,
          direction,
          viewMode,
          sequence: ++transitionSequenceRef.current,
        });
      }
    }

    activeIndexRef.current = normalizedIndex;
    setTransitionDirection(direction);
    setRawActiveIndex(normalizedIndex);
  }, [displayArtworks, total, viewMode]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    selectArtwork((activeIndexRef.current + 1) % total, "next");
  }, [selectArtwork, total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    selectArtwork((activeIndexRef.current - 1 + total) % total, "previous");
  }, [selectArtwork, total]);

  useEffect(() => {
    if (!transitionSnapshot) return;

    const timeoutId = window.setTimeout(() => {
      setTransitionSnapshot((currentSnapshot) =>
        currentSnapshot?.sequence === transitionSnapshot.sequence ? null : currentSnapshot
      );
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [transitionSnapshot]);

  useIsomorphicLayoutEffect(() => {
    const previousRects = previousRibbonRectsRef.current;
    if (!previousRects) return;

    previousRibbonRectsRef.current = null;
    if (viewMode !== "ribbons") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      ribbonItemsRef.current.forEach((element) => {
        element.style.transformOrigin = "";
      });
      return;
    }

    const activeId = displayArtworks[activeIndex]?.id;
    const easing = "cubic-bezier(0.2, 0.78, 0.22, 1)";

    ribbonItemsRef.current.forEach((element, id) => {
      const last = element.getBoundingClientRect();
      if (last.width <= 0 || last.height <= 0) {
        element.style.transformOrigin = "";
        return;
      }

      const first = previousRects.get(id);
      const staggerY = Number(element.dataset.ribbonStaggerY ?? "0");
      const currentOffset = Number(element.dataset.ribbonOffset ?? "0");
      const targetTransform = "translate3d(0px, " + staggerY + "px, 0)";
      let fromTransform: string;
      let fromWidth = last.width;
      let fromHeight = last.height;

      if (first) {
        const dx = first.left - last.left;
        const dy = first.top - last.top;

        // In a circular archive, one artwork can change from the far-left offset to
        // the far-right offset (or vice versa). Do not animate it across the viewport.
        const crossedLoopSeam = transitionDirection === "next"
          ? currentOffset > first.offset
          : currentOffset < first.offset;

        if (crossedLoopSeam) {
          const entryX = transitionDirection === "next" ? 36 : -36;
          // Re-enter at its destination size. Only its position moves, avoiding an
          // artificial scale on an artwork that is wrapping around the ribbon.
          fromTransform = "translate3d(" + entryX + "px, " + staggerY + "px, 0)";
        } else {
          if (
            Math.abs(dx) < 0.5 &&
            Math.abs(dy) < 0.5 &&
            Math.abs(first.width - last.width) < 0.5 &&
            Math.abs(first.height - last.height) < 0.5
          ) {
            element.style.transformOrigin = "";
            return;
          }

          fromTransform =
            "translate3d(" + dx + "px, " + (dy + staggerY) + "px, 0)";
          fromWidth = first.width;
          fromHeight = first.height;
        }
      } else {
        // A newly visible panel enters just inside its destination edge at normal size.
        const entryX = transitionDirection === "next" ? 28 : -28;
        fromTransform = "translate3d(" + entryX + "px, " + staggerY + "px, 0)";
      }

      // Animate the layout box itself. The image keeps its own object-fit rendering,
      // rather than being stretched by separate horizontal and vertical scaling.
      const animation = element.animate(
        [
          {
            transform: fromTransform,
            width: fromWidth + "px",
            height: fromHeight + "px",
          },
          {
            transform: targetTransform,
            width: last.width + "px",
            height: last.height + "px",
          },
        ],
        {
          duration: id === activeId ? 760 : 680,
          easing,
          fill: "both",
        },
      );

      animation.onfinish = () => {
        animation.cancel();
        element.style.transformOrigin = "";
      };
    });
  }, [activeIndex, displayArtworks, transitionDirection, viewMode]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const element = target instanceof HTMLElement ? target : null;
      const stage = stageRef.current;
      const interactiveTarget = Boolean(
        element?.closest(
          "[role='radio'], [role='slider'], [role='spinbutton'], [role='combobox'], [role='listbox'], [role='tab'], [role='menuitem'], [role='treeitem']"
        )
      );
      const context = {
        key: event.key,
        defaultPrevented: event.defaultPrevented,
        modifierPressed: event.altKey || event.ctrlKey || event.metaKey,
        navigationOpen: isNavigationOpen,
        artworkCount: total,
        editableTarget: Boolean(
          element?.isContentEditable ||
          element?.closest("input, textarea, select, [contenteditable='true']")
        ),
        interactiveTarget,
        interactiveTargetWithinStage: Boolean(stage && element && stage.contains(element)),
      };

      if (!shouldHandleArtworkKeyboardNavigation(context)) return;

      event.preventDefault();
      if (event.key === "ArrowRight") handleNext();
      else handlePrev();
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleNext, handlePrev, isNavigationOpen, total]);

  const handleStageWheel = useCallback((event: ReactWheelEvent<HTMLElement>) => {
    if (isNavigationOpen || total <= 1 || event.ctrlKey) return;

    const rawDelta = event.deltaY;
    const normalizedDelta = event.deltaMode === 1
      ? rawDelta * 16
      : event.deltaMode === 2
      ? rawDelta * window.innerHeight
      : rawDelta;
    if (!Number.isFinite(normalizedDelta) || normalizedDelta === 0) return;

    event.preventDefault();

    if (wheelUnlockTimerRef.current !== null) {
      window.clearTimeout(wheelUnlockTimerRef.current);
    }
    wheelUnlockTimerRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false;
      wheelAccumulatorRef.current = 0;
      wheelUnlockTimerRef.current = null;
    }, 260);

    if (wheelLockedRef.current) return;

    const now = performance.now();
    if (now - lastWheelEventAtRef.current > 180) {
      wheelAccumulatorRef.current = 0;
    }
    lastWheelEventAtRef.current = now;
    wheelAccumulatorRef.current += normalizedDelta;

    const direction = getWheelDirection(wheelAccumulatorRef.current, 55);
    if (!direction) return;

    wheelAccumulatorRef.current = 0;
    wheelLockedRef.current = true;
    if (direction === "next") handleNext();
    else handlePrev();
  }, [handleNext, handlePrev, isNavigationOpen, total]);

  const handleStagePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || isNavigationOpen || total <= 1) {
      pointerStartRef.current = null;
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("button, a, input, textarea, select, [contenteditable='true']")
    ) {
      pointerStartRef.current = null;
      return;
    }

    pointerStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }, [isNavigationOpen, total]);

  const handleStagePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || start.pointerId !== event.pointerId || isNavigationOpen) return;

    const direction = getSwipeDirection(start.x, start.y, event.clientX, event.clientY);
    if (direction === "next") handleNext();
    else if (direction === "previous") handlePrev();
  }, [handleNext, handlePrev, isNavigationOpen]);

  const handleStagePointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStartRef.current?.pointerId === event.pointerId) {
      pointerStartRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (wheelUnlockTimerRef.current !== null) {
      window.clearTimeout(wheelUnlockTimerRef.current);
    }
  }, []);

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
  const outgoingArtwork = transitionSnapshot?.artwork ?? null;
  const outgoingDimensions = outgoingArtwork ? getDimensions(outgoingArtwork) : null;
  const outgoingAspectRatio = outgoingDimensions
    ? outgoingDimensions.width / outgoingDimensions.height
    : 1;
  const outgoingPreferredWidth = stageWidth < 640
    ? stageWidth * (outgoingAspectRatio >= 1.2 ? 0.76 : 0.54)
    : stageWidth * (
        outgoingAspectRatio >= 1.3 ? 0.54 : outgoingAspectRatio >= 0.85 ? 0.42 : 0.36
      );
  const outgoingSize = outgoingDimensions
    ? fitArtworkWithinBounds(
        outgoingDimensions.width,
        outgoingDimensions.height,
        outgoingPreferredWidth,
        stageHeight * 0.86
      )
    : null;
  const outgoingImageUrl = outgoingArtwork
    ? getStoragePublicUrl(outgoingArtwork.public_image_path)
    : null;
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

  // Every ribbon tile keeps the artwork's true aspect ratio. FLIP can then use
  // nearly uniform scaling as a work moves between the hero and preview roles.
  const ribbonEntries: RibbonLayoutEntry[] = stageWindow.map(({ index, offset }) => {
    const artwork = displayArtworks[index];
    const isActive = index === activeIndex;
    const dimensions = getDimensions(artwork);
    const patternIndex =
      ((offset + 4) % STAGGER_HEIGHTS_RIBBONS.length + STAGGER_HEIGHTS_RIBBONS.length) %
      STAGGER_HEIGHTS_RIBBONS.length;
    const heightPercent = STAGGER_HEIGHTS_RIBBONS[patternIndex];
    const staggerOffset = Math.round(
      STAGGER_OFFSETS_RIBBONS[patternIndex] *
      Math.min(1.2, Math.max(0.6, stageHeight / 480))
    );
    const previewHeight = Math.max(1, Math.round(stageHeight * heightPercent / 100));

    return {
      index,
      offset,
      artwork,
      isActive,
      imageUrl: getStoragePublicUrl(artwork.public_image_path),
      failed: Boolean(failedImages[artwork.id]),
      width: isActive ? activeSize.width : previewWidth,
      height: isActive ? activeSize.height : previewHeight,
      left: 0,
      top: 0,
      staggerOffset: isActive ? 0 : staggerOffset,
    };
  });

  const activeRibbonPosition = ribbonEntries.findIndex((entry) => entry.isActive);
  if (activeRibbonPosition >= 0) {
    const activeEntry = ribbonEntries[activeRibbonPosition];
    activeEntry.left = (stageWidth - activeEntry.width) / 2;
    activeEntry.top = (stageHeight - activeEntry.height) / 2;

    for (let index = activeRibbonPosition - 1; index >= 0; index -= 1) {
      const entry = ribbonEntries[index];
      const rightEntry = ribbonEntries[index + 1];
      entry.left = rightEntry.left - ribbonGap - entry.width;
      entry.top = (stageHeight - entry.height) / 2;
    }

    for (let index = activeRibbonPosition + 1; index < ribbonEntries.length; index += 1) {
      const entry = ribbonEntries[index];
      const leftEntry = ribbonEntries[index - 1];
      entry.left = leftEntry.left + leftEntry.width + ribbonGap;
      entry.top = (stageHeight - entry.height) / 2;
    }
  }

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
  const outgoingSliceSize = outgoingDimensions
    ? fitArtworkWithinBounds(
        outgoingDimensions.width,
        outgoingDimensions.height,
        sliceMaxWidth,
        stageHeight * 0.82
      )
    : null;
  const outgoingSlicePanelWidth = outgoingSliceSize
    ? outgoingSliceSize.width / SLICE_COUNT
    : 0;
  const slicePanelWidth = sliceSize.width / SLICE_COUNT;
  const scaledSliceOffsets = SLICE_OFFSETS.map((offset) =>
    Math.round(offset * Math.min(1.35, Math.max(0.65, stageHeight / 480)))
  );
  const maxSliceOffset = Math.max(...scaledSliceOffsets.map(Math.abs), 0);
  const sliceGroupWidth = sliceSize.width + sliceGap * (SLICE_COUNT - 1);
  const sliceGroupHeight = sliceSize.height + maxSliceOffset * 2;
  const outgoingSliceGroupWidth = outgoingSliceSize
    ? outgoingSliceSize.width + sliceGap * (SLICE_COUNT - 1)
    : 0;
  const outgoingSliceGroupHeight = outgoingSliceSize
    ? outgoingSliceSize.height + maxSliceOffset * 2
    : 0;

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
          data-transition-direction={transitionDirection}
          aria-label="Artwork viewport. Use left and right arrow keys, scroll, or swipe to change artwork."
          tabIndex={0}
          onWheel={handleStageWheel}
          onPointerDown={handleStagePointerDown}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerCancel}
          className="artwork-stage relative min-h-0 w-full flex-1 overflow-hidden touch-pan-y focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          {viewMode === "ribbons" ? (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="artwork-ribbon-track absolute inset-0"
                role="group"
                aria-label="Select an artwork"
              >
                {ribbonEntries.map((entry) => {
                  const {
                    index,
                    offset,
                    artwork,
                    isActive,
                    imageUrl,
                    failed,
                    width,
                    height,
                    left,
                    top,
                    staggerOffset,
                  } = entry;
                  const visibility = isActive ? "flex" : getPanelVisibilityClass(offset);
                  const itemClassName = isActive
                    ? "artwork-ribbon-item group absolute z-20 shrink-0 overflow-hidden rounded-xs bg-surface shadow-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                    : "artwork-ribbon-item artwork-ribbon-preview group absolute shrink-0 overflow-hidden rounded-xs border border-border/70 bg-surface-muted opacity-45 grayscale transition-[opacity,filter,transform] duration-500 ease-out hover:opacity-90 hover:grayscale-0 motion-reduce:transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent";

                  return (
                    <button
                      key={artwork.id}
                      ref={(element) => {
                        if (element) ribbonItemsRef.current.set(artwork.id, element);
                        else ribbonItemsRef.current.delete(artwork.id);
                      }}
                      type="button"
                      data-artwork-id={artwork.id}
                      data-ribbon-offset={offset}
                      data-ribbon-stagger-y={staggerOffset}
                      aria-label={(isActive ? "Selected artwork: " : "Select artwork: ") + artwork.title}
                      aria-pressed={isActive}
                      onClick={() => {
                        if (isActive) return;
                        const forwardDistance = (index - activeIndexRef.current + total) % total;
                        const backwardDistance = (activeIndexRef.current - index + total) % total;
                        selectArtwork(index, forwardDistance <= backwardDistance ? "next" : "previous");
                      }}
                      className={itemClassName + " " + visibility}
                      style={{
                        left: left + "px",
                        top: top + "px",
                        width: width + "px",
                        height: height + "px",
                        transform: "translate3d(0px, " + staggerOffset + "px, 0)",
                      }}
                    >
                      {imageUrl && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          draggable={false}
                          src={imageUrl}
                          alt={isActive ? (artwork.alt_text || artwork.title) : ""}
                          onLoad={(event) => handleImageLoad(artwork.id, event.currentTarget)}
                          onError={() => handleImageError(artwork.id)}
                          className={
                            isActive
                              ? "h-full w-full object-contain"
                              : "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-muted p-2 text-center">
                          <span className={isActive
                            ? "font-artwork-title text-xl text-ink"
                            : "font-artwork-title text-xs text-ink [writing-mode:vertical-rl]"
                          }>
                            {artwork.title}
                          </span>
                        </div>
                      )}
                      {!isActive && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/70 to-transparent p-2 text-left font-artwork-title text-sm leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {artwork.title}
                        </span>
                      )}
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
                key={current.id}
                className="artwork-composition-enter relative z-20 shrink-0"
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
                      key={`${current.id}-${sliceIndex}`}
                      data-artwork-slice={sliceIndex}
                      className="absolute overflow-hidden rounded-[2px] border border-border/70 bg-surface-muted shadow-lg"
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
                          draggable={false}
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

          {transitionSnapshot && viewMode === "sliced" && outgoingArtwork && outgoingSize && (
            <div
              key={transitionSnapshot.sequence}
              aria-hidden="true"
              className={`artwork-exit-layer artwork-exit-${transitionSnapshot.direction} pointer-events-none absolute inset-0 z-10 flex items-center justify-center`}
            >
              {transitionSnapshot.viewMode === "sliced" && outgoingSliceSize ? (
                <div
                  className="relative shrink-0"
                  style={{
                    width: outgoingSliceGroupWidth + "px",
                    height: outgoingSliceGroupHeight + "px",
                  }}
                >
                  {Array.from({ length: SLICE_COUNT }, (_, sliceIndex) => {
                    const panelHeight = outgoingSliceSize.height * SLICE_HEIGHTS[sliceIndex] / 100;
                    const verticalOffset = scaledSliceOffsets[sliceIndex];
                    const panelTop =
                      maxSliceOffset +
                      (outgoingSliceSize.height - panelHeight) / 2 +
                      verticalOffset;
                    const left = sliceIndex * (outgoingSlicePanelWidth + sliceGap);
                    const failed = failedImages[outgoingArtwork.id];

                    return (
                      <div
                        key={`outgoing-${transitionSnapshot.sequence}-${sliceIndex}`}
                        className="absolute overflow-hidden rounded-[2px] border border-border/70 bg-surface-muted shadow-lg"
                        style={{
                          left: left + "px",
                          top: panelTop + "px",
                          width: outgoingSlicePanelWidth + "px",
                          height: panelHeight + "px",
                        }}
                      >
                        {outgoingImageUrl && !failed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                          draggable={false}
                            src={outgoingImageUrl}
                            alt=""
                            className="absolute max-w-none"
                            style={{
                              width: outgoingSliceSize.width + "px",
                              height: outgoingSliceSize.height + "px",
                              left: -sliceIndex * outgoingSlicePanelWidth + "px",
                              top: -(outgoingSliceSize.height - panelHeight) / 2 + "px",
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-1 text-center">
                            <span className="font-artwork-title text-xs text-ink [writing-mode:vertical-rl]">
                              {outgoingArtwork.title}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xs bg-surface shadow-xl"
                  style={{
                    width: outgoingSize.width + "px",
                    height: outgoingSize.height + "px",
                  }}
                >
                  {outgoingImageUrl && !failedImages[outgoingArtwork.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                          draggable={false}
                      src={outgoingImageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-muted p-3 text-center">
                      <span className="font-artwork-title text-xl text-ink">{outgoingArtwork.title}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section
          aria-label="Selected artwork information"
          aria-live="polite"
          aria-atomic="true"
          data-transition-direction={transitionDirection}
          className="flex shrink-0 flex-col items-center px-4 py-3 text-center sm:px-8 sm:py-4"
        >
          <div className="flex flex-col items-center">
            <h1
              key={`title-${current.id}`}
              className="artwork-caption-title-enter font-artwork-title text-3xl leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl"
            >
              <Link href={"/artworks/" + current.slug} className="transition-colors hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
                {current.title}
              </Link>
            </h1>
            {current.description && (
              <p
                key={`description-${current.id}`}
                className="artwork-caption-description-enter mt-1 line-clamp-2 max-w-2xl font-sans text-xs leading-relaxed text-ink-soft sm:text-sm"
              >
                {current.description}
              </p>
            )}
            <div
              key={`metadata-${current.id}`}
              className="artwork-caption-meta-enter mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-accent sm:text-[11px]"
            >
              <span>{current.medium.replace(/-/g, " ")}</span>
              <span aria-hidden="true" className="text-border-strong">·</span>
              <span>{current.category.replace(/-/g, " ")}</span>
            </div>
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
