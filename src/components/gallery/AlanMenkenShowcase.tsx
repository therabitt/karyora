"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import { getArtworkResponsiveImageSources } from "@/lib/storage/artwork-image-variants";

import type { PublicArtwork } from "@/lib/data/artworks";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";
import { useKaryoraOpeningSequence } from "@/components/opening/KaryoraOpeningSequence";
import { getRibbonCascadeDelay, getRibbonEntranceOriginX } from "@/lib/gallery/ribbon-entrance";
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
  isActive: boolean;
  opacity: number;
  filter: string;
  imageTransform: string;
};

type RibbonSeamExitSnapshot = {
  artwork: PublicArtwork;
  imageUrl: string | null;
  failed: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  sizes: string;
  direction: "next" | "previous";
  sequence: number;
};

type RibbonLayoutEntry = {
  index: number;
  offset: number;
  artwork: PublicArtwork;
  isActive: boolean;
  imageUrl: string | null;
  failed: boolean;
  imageScale: number;
  aspectRatio: number;
  sourceSize: number;
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

function cubicBezierCoordinate(t: number, point1: number, point2: number): number {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * point1 + 3 * inverse * t * t * point2 + t * t * t;
}

function cubicBezierProgress(progress: number): number {
  const x1 = 0.4;
  const y1 = 0;
  const x2 = 0.2;
  const y2 = 1;
  let low = 0;
  let high = 1;

  // Solve x(t) = progress by bisection, then evaluate y(t).
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (cubicBezierCoordinate(midpoint, x1, x2) < progress) low = midpoint;
    else high = midpoint;
  }

  return cubicBezierCoordinate((low + high) / 2, y1, y2);
}

function getUniformScale(transform: string): number {
  if (!transform || transform === "none") return 1;
  const match = transform.match(/^matrix\(([^)]+)\)$/);

  if (match) {
    const values = match[1].split(",").map(Number);
    if (values.length >= 2 && values.every(Number.isFinite)) {
      return Math.hypot(values[0], values[1]);
    }
  }

  return 1;
}

function getCoverScale(imageAspectRatio: number, frameAspectRatio: number): number {
  if (
    !Number.isFinite(imageAspectRatio) ||
    !Number.isFinite(frameAspectRatio) ||
    imageAspectRatio <= 0 ||
    frameAspectRatio <= 0
  ) {
    return 1;
  }

  return Math.max(imageAspectRatio / frameAspectRatio, frameAspectRatio / imageAspectRatio);
}

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

  useIsomorphicLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const [viewMode, setViewMode] = useState<ViewMode>("ribbons");
  const { isOpeningSequenceActive, shouldStartInitialRibbonEntrance } = useKaryoraOpeningSequence();
  // The homepage controller releases the entrance after its editorial sequence fades out.
  const [isRibbonEntranceActive, setIsRibbonEntranceActive] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"next" | "previous">("next");
  const [transitionSnapshot, setTransitionSnapshot] = useState<ArtworkTransitionSnapshot | null>(null);
  // Persists for the incoming artwork's lifetime so its delayed animation doesn't
  // restart when the outgoing snapshot is cleaned up.
  const [delayedSliceArtworkId, setDelayedSliceArtworkId] = useState<string | null>(null);
  const [seamExitSnapshot, setSeamExitSnapshot] = useState<RibbonSeamExitSnapshot | null>(null);
  const transitionSequenceRef = useRef(0);
  const ribbonItemsRef = useRef(new Map<string, HTMLButtonElement>());
  const previousRibbonRectsRef = useRef<Map<string, RibbonRect> | null>(null);
  const seamExitLayerRef = useRef<HTMLDivElement>(null);
  const seamExitAnimationRef = useRef<Animation | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [measuredDimensions, setMeasuredDimensions] = useState<Record<string, ArtworkDimensions>>({});
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const wheelAccumulatorRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const lastWheelEventAtRef = useRef(0);
  const wheelUnlockTimerRef = useRef<number | null>(null);
  const slicedNavigationLockedRef = useRef(false);
  const slicedNavigationUnlockTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<ArtworkSwipeStart | null>(null);

  const clearSlicedNavigationLock = useCallback(() => {
    if (slicedNavigationUnlockTimerRef.current !== null) {
      window.clearTimeout(slicedNavigationUnlockTimerRef.current);
      slicedNavigationUnlockTimerRef.current = null;
    }
    slicedNavigationLockedRef.current = false;
  }, []);

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

  useEffect(() => {
    if (shouldStartInitialRibbonEntrance) setIsRibbonEntranceActive(true);
  }, [shouldStartInitialRibbonEntrance]);

  useEffect(() => {
    if (total <= 0 || !isRibbonEntranceActive) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timeoutId = window.setTimeout(() => setIsRibbonEntranceActive(false), 0);
      return () => window.clearTimeout(timeoutId);
    }

    // Match Ribbon's FLIP timing: previews settle over 980 ms and the focused artwork
    // over 1100 ms. Its center-first stagger adds at most 168 ms before the focus arrives.
    // Clear the entrance class only after every panel has reached its resting position.
    const timeoutId = window.setTimeout(() => setIsRibbonEntranceActive(false), 1220);
    return () => window.clearTimeout(timeoutId);
  }, [isRibbonEntranceActive, total]);

  const selectArtwork = useCallback((
    targetIndex: number,
    direction: "next" | "previous",
  ) => {
    if (total <= 1) return;

    const normalizedIndex = ((targetIndex % total) + total) % total;
    const outgoingIndex = activeIndexRef.current;
    if (normalizedIndex === outgoingIndex) return;

    // Sliced transitions are sequenced rather than FLIP-interruptible. Ignore
    // repeated navigation until the current Sliced handoff has settled.
    if (viewMode === "sliced" && slicedNavigationLockedRef.current) return;

    setIsRibbonEntranceActive(false);
    const outgoingArtwork = displayArtworks[outgoingIndex];
    const incomingArtwork = displayArtworks[normalizedIndex];
    let shouldSequenceSliceHandoff = false;

    if (viewMode === "sliced" && outgoingArtwork && incomingArtwork) {
      const transitionStageWidth = stageSize.width || 1440;
      const transitionStageHeight = stageSize.height || 520;
      const transitionSliceGap =
        transitionStageWidth < 640 ? 3 : transitionStageWidth < 1024 ? 6 : 8;
      const transitionControlsGutter = transitionStageWidth < 640
        ? 46
        : Math.min(112, transitionStageWidth * 0.08);
      const transitionSliceMaxWidth = Math.max(
        120,
        Math.min(
          transitionStageWidth * (transitionStageWidth < 640 ? 0.78 : 0.8),
          transitionStageWidth -
            2 * transitionControlsGutter -
            transitionSliceGap * (SLICE_COUNT - 1)
        )
      );

      const getTransitionDimensions = (artwork: PublicArtwork): ArtworkDimensions => {
        const measured = measuredDimensions[artwork.id];
        if (measured) return measured;

        if (
          Number.isFinite(artwork.image_width) &&
          Number.isFinite(artwork.image_height) &&
          (artwork.image_width ?? 0) > 0 &&
          (artwork.image_height ?? 0) > 0
        ) {
          return resolveArtworkDimensions(artwork.image_width, artwork.image_height);
        }

        return resolveArtworkDimensions(null, null);
      };

      const getSliceGroupWidth = (artwork: PublicArtwork) => {
        const dimensions = getTransitionDimensions(artwork);
        const fittedSize = fitArtworkWithinBounds(
          dimensions.width,
          dimensions.height,
          transitionSliceMaxWidth,
          transitionStageHeight * 0.82
        );
        return fittedSize.width + transitionSliceGap * (SLICE_COUNT - 1);
      };

      const outgoingWidth = getSliceGroupWidth(outgoingArtwork);
      const incomingWidth = getSliceGroupWidth(incomingArtwork);
      // Groups are centered independently. Across five strips, the largest
      // horizontal shift for a matching panel is 30% of the total width delta.
      // Once that drift exceeds the inter-panel gap, strips from neighboring
      // indices can share the same horizontal lane and cross in opposite directions.
      const maximumPanelDrift = Math.abs(outgoingWidth - incomingWidth) * 0.3;
      const hasReliableDimensions = (artwork: PublicArtwork) => {
        const measured = measuredDimensions[artwork.id];
        if (measured && measured.width > 0 && measured.height > 0) return true;
        return (
          Number.isFinite(artwork.image_width) &&
          Number.isFinite(artwork.image_height) &&
          (artwork.image_width ?? 0) > 0 &&
          (artwork.image_height ?? 0) > 0
        );
      };

      // If either image's true dimensions are not known yet, prefer the safe
      // sequential handoff rather than risk an unexpected overlap after load.
      shouldSequenceSliceHandoff =
        maximumPanelDrift > transitionSliceGap ||
        !hasReliableDimensions(outgoingArtwork) ||
        !hasReliableDimensions(incomingArtwork);
    }

    if (viewMode === "sliced") {
      clearSlicedNavigationLock();
      slicedNavigationLockedRef.current = true;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const navigationCooldown = prefersReducedMotion
        ? 250
        : shouldSequenceSliceHandoff
        ? 1950
        : 950;

      slicedNavigationUnlockTimerRef.current = window.setTimeout(() => {
        slicedNavigationLockedRef.current = false;
        slicedNavigationUnlockTimerRef.current = null;
      }, navigationCooldown);
    }

    setDelayedSliceArtworkId(
      shouldSequenceSliceHandoff && incomingArtwork ? incomingArtwork.id : null
    );

    if (viewMode === "ribbons" && typeof window !== "undefined") {
      if (seamExitAnimationRef.current) {
        seamExitAnimationRef.current.onfinish = null;
        seamExitAnimationRef.current.cancel();
        seamExitAnimationRef.current = null;
      }

      let nextSeamExit: RibbonSeamExitSnapshot | null = null;
      const travelDistance = direction === "next"
        ? (normalizedIndex - outgoingIndex + total) % total
        : (outgoingIndex - normalizedIndex + total) % total;
      const stage = stageRef.current;
      const stageRect = stage?.getBoundingClientRect();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Preserve the panel that actually leaves the visible window. The incoming
      // replacement has its own entrance; the departing edge panel must not unmount instantly.
      if (travelDistance === 1 && stageRect && !reduceMotion) {
        const edgeCandidates = Array.from(ribbonItemsRef.current.values())
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              rect,
              offset: Number(element.dataset.ribbonOffset ?? "0"),
            };
          })
          .filter(({ rect, offset }) => rect.width > 0 && rect.height > 0 && offset !== 0)
          .sort((a, b) => direction === "next" ? a.offset - b.offset : b.offset - a.offset);
        const edge = edgeCandidates[0];
        const edgeArtworkId = edge?.element.dataset.artworkId;
        const edgeArtwork = edgeArtworkId
          ? displayArtworks.find((artwork) => artwork.id === edgeArtworkId)
          : undefined;

        if (edge && edgeArtwork) {
          const edgeImage = edge.element.querySelector<HTMLImageElement>("[data-artwork-image]");
          nextSeamExit = {
            artwork: edgeArtwork,
            imageUrl: getStoragePublicUrl(edgeArtwork.public_image_path),
            failed: Boolean(failedImages[edgeArtwork.id]),
            left: edge.rect.left - stageRect.left,
            top: edge.rect.top - stageRect.top,
            width: edge.rect.width,
            height: edge.rect.height,
            sizes: edgeImage?.getAttribute("sizes") ?? "100vw",
            direction,
            sequence: ++transitionSequenceRef.current,
          };
        }
      }

      setSeamExitSnapshot(nextSeamExit);
      const previousRects = new Map<string, RibbonRect>();

      // Capture on-screen geometry before React changes the active artwork and panel positions.
      ribbonItemsRef.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const computedStyle = window.getComputedStyle(element);
          const image = element.querySelector<HTMLElement>("[data-artwork-image]");
          const imageStyle = image ? window.getComputedStyle(image) : null;
          previousRects.set(id, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            offset: Number(element.dataset.ribbonOffset ?? "0"),
            isActive: element.dataset.artworkActive === "true",
            opacity: Number(computedStyle.opacity),
            filter: computedStyle.filter,
            imageTransform: imageStyle?.transform ?? "none",
          });
        }
      });

      // Preserve the current visual position and image crop when another selection
      // interrupts an animation. The next FLIP begins from those measured states.
      ribbonItemsRef.current.forEach((element) => {
        element.getAnimations().forEach((animation) => animation.cancel());
        element.querySelectorAll<HTMLElement>("[data-artwork-image]").forEach((image) => {
          image.getAnimations().forEach((animation) => animation.cancel());
        });
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
  }, [
    clearSlicedNavigationLock,
    displayArtworks,
    failedImages,
    measuredDimensions,
    stageSize,
    total,
    viewMode,
  ]);

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

    const currentArtworkId = displayArtworks[activeIndex]?.id;
    const hasSequentialSliceHandoff =
      transitionSnapshot.viewMode === "sliced" &&
      currentArtworkId !== undefined &&
      delayedSliceArtworkId === currentArtworkId;
    const cleanupDelay = hasSequentialSliceHandoff ? 1900 : 900;

    const timeoutId = window.setTimeout(() => {
      setTransitionSnapshot((currentSnapshot) =>
        currentSnapshot?.sequence === transitionSnapshot.sequence ? null : currentSnapshot
      );
    }, cleanupDelay);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, delayedSliceArtworkId, displayArtworks, transitionSnapshot]);

  useIsomorphicLayoutEffect(() => {
    const snapshot = seamExitSnapshot;
    const element = seamExitLayerRef.current;
    const stage = stageRef.current;
    if (!snapshot || !element || !stage) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setSeamExitSnapshot((current) =>
        current?.sequence === snapshot.sequence ? null : current
      );
      return;
    }

    const exitDistance = snapshot.direction === "next"
      ? -(snapshot.left + snapshot.width + 28)
      : stage.clientWidth - snapshot.left + 28;
    const animation = element.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: "translate3d(" + exitDistance + "px, 0, 0)" },
      ],
      {
        duration: 760,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      },
    );
    seamExitAnimationRef.current = animation;

    animation.onfinish = () => {
      // Remove the snapshot from React first. Cancelling a fill:"both" animation
      // before that commit restores its original edge position for one frame,
      // which looks like a thumbnail flashing back into the ribbon.
      setSeamExitSnapshot((current) =>
        current?.sequence === snapshot.sequence ? null : current
      );
    };

    return () => {
      animation.onfinish = null;
      animation.cancel();
      if (seamExitAnimationRef.current === animation) {
        seamExitAnimationRef.current = null;
      }
    };
  }, [seamExitSnapshot]);

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
    const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

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
          const stageRect = element.parentElement?.getBoundingClientRect();
          const entryX = transitionDirection === "next"
            ? (stageRect ? stageRect.right - last.left + 24 : last.width + 48)
            : (stageRect ? stageRect.left - last.right - 24 : -last.width - 48);
          // Enter from beyond the clipped stage edge, not from beside the destination
          // thumbnail. This avoids the wrapped artwork visibly popping over its neighbor.
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
        // Newly mounted panels enter from just beyond the appropriate stage edge.
        const stageRect = element.parentElement?.getBoundingClientRect();
        const entryX = transitionDirection === "next"
          ? (stageRect ? stageRect.right - last.left + 24 : last.width + 48)
          : (stageRect ? stageRect.left - last.right - 24 : -last.width - 48);
        fromTransform = "translate3d(" + entryX + "px, " + staggerY + "px, 0)";
      }

      // Animate the layout box itself. The image keeps its own object-fit rendering,
      // rather than being stretched by separate horizontal and vertical scaling.
      const duration = id === activeId ? 1100 : 980;
      const targetStyle = window.getComputedStyle(element);
      const targetOpacity = Number(targetStyle.opacity);
      const targetFilter = targetStyle.filter;
      const image = element.querySelector<HTMLImageElement>("[data-artwork-image]");
      const targetImageTransform = image ? window.getComputedStyle(image).transform : "none";
      const animation = element.animate(
        [
          {
            transform: fromTransform,
            width: fromWidth + "px",
            height: fromHeight + "px",
            opacity: first?.opacity ?? targetOpacity,
            filter: first?.filter ?? targetFilter,
          },
          {
            transform: targetTransform,
            width: last.width + "px",
            height: last.height + "px",
            opacity: targetOpacity,
            filter: targetFilter,
          },
        ],
        {
          duration,
          easing,
          fill: "both",
        },
      );

      // Derive the image crop from the interpolated frame aspect ratio at each
      // sample of the same easing curve used by FLIP. The image does not perform an
      // independent scale tween, which made wide landscapes zoom and then shrink.
      if (first && image) {
        image.getAnimations().forEach((imageAnimation) => imageAnimation.cancel());

        const naturalAspectRatio = image.naturalWidth > 0 && image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : Number(element.dataset.artworkAspect ?? "1");
        const startScale = getUniformScale(first.imageTransform);
        const imageScaleKeyframes: Keyframe[] = Array.from({ length: 33 }, (_, index) => {
          const offset = index / 32;
          const progress = cubicBezierProgress(offset);
          const frameWidth = fromWidth + (last.width - fromWidth) * progress;
          const frameHeight = fromHeight + (last.height - fromHeight) * progress;
          const frameAspectRatio = frameHeight > 0 ? frameWidth / frameHeight : naturalAspectRatio;
          const geometryScale = getCoverScale(naturalAspectRatio, frameAspectRatio);
          const scale = index === 0 ? startScale : geometryScale;

          return {
            offset,
            transform: "scale(" + scale + ")",
          };
        });

        imageScaleKeyframes[imageScaleKeyframes.length - 1] = {
          offset: 1,
          transform: targetImageTransform,
        };

        const imageAnimation = image.animate(imageScaleKeyframes, {
          duration,
          easing: "linear",
          fill: "both",
        });
        imageAnimation.onfinish = () => imageAnimation.cancel();
      }

      animation.onfinish = () => {
        animation.cancel();
        element.style.transformOrigin = "";
      };
    });
  }, [activeIndex, displayArtworks, transitionDirection, viewMode]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (isOpeningSequenceActive) return;
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
  }, [handleNext, handlePrev, isNavigationOpen, isOpeningSequenceActive, total]);

  const handleStageWheel = useCallback((event: ReactWheelEvent<HTMLElement>) => {
    if (isOpeningSequenceActive || isNavigationOpen || total <= 1 || event.ctrlKey) return;

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
  }, [handleNext, handlePrev, isNavigationOpen, isOpeningSequenceActive, total]);

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
    if (slicedNavigationUnlockTimerRef.current !== null) {
      window.clearTimeout(slicedNavigationUnlockTimerRef.current);
    }
  }, []);

  const handleImageError = useCallback((id: string) => {
    setFailedImages((previous) => ({ ...previous, [id]: true }));
  }, []);

  const handleImageLoad = useCallback((id: string, image: HTMLImageElement) => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (width <= 0 || height <= 0) return;

    const artwork = displayArtworks.find((item) => item.id === id);
    const hasCanonicalDimensions = Boolean(
      artwork &&
      Number.isFinite(artwork.image_width) &&
      Number.isFinite(artwork.image_height) &&
      (artwork.image_width ?? 0) > 0 &&
      (artwork.image_height ?? 0) > 0
    );

    // Publish/backfill stores canonical dimensions. A srcset candidate's naturalWidth
    // changes with resolution, so using it to rewrite layout state on each load is redundant.
    if (hasCanonicalDimensions) return;

    // Legacy records without dimensions only need the first trustworthy measurement.
    setMeasuredDimensions((previous) =>
      previous[id] ? previous : { ...previous, [id]: { width, height } }
    );
  }, [displayArtworks]);

  const getDimensions = useCallback((artwork: PublicArtwork): ArtworkDimensions => {
    // Prefer the loaded image's natural pixel dimensions. Database dimensions may be
    // stale or rounded; using them over the actual image ratio can leave visible blank
    // bands around the focused artwork when object-contain sizes the image.
    const measured = measuredDimensions[artwork.id];
    if (measured) return measured;

    if (
      Number.isFinite(artwork.image_width) &&
      Number.isFinite(artwork.image_height) &&
      (artwork.image_width ?? 0) > 0 &&
      (artwork.image_height ?? 0) > 0
    ) {
      return resolveArtworkDimensions(artwork.image_width, artwork.image_height);
    }

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
  const currentResponsiveSources = getArtworkResponsiveImageSources(
    current.public_image_path,
    current.image_width ?? activeDimensions.width,
    current.image_height ?? activeDimensions.height,
  );
  const outgoingResponsiveSources = outgoingArtwork
    ? getArtworkResponsiveImageSources(
        outgoingArtwork.public_image_path,
        outgoingArtwork.image_width ?? outgoingDimensions?.width ?? 1600,
        outgoingArtwork.image_height ?? outgoingDimensions?.height ?? 1200,
      )
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
    const aspectRatio = dimensions.width / dimensions.height;
    const patternIndex =
      ((offset + 4) % STAGGER_HEIGHTS_RIBBONS.length + STAGGER_HEIGHTS_RIBBONS.length) %
      STAGGER_HEIGHTS_RIBBONS.length;
    const heightPercent = STAGGER_HEIGHTS_RIBBONS[patternIndex];
    const staggerOffset = Math.round(
      STAGGER_OFFSETS_RIBBONS[patternIndex] *
      Math.min(1.2, Math.max(0.6, stageHeight / 480))
    );
    const previewHeight = Math.max(1, Math.round(stageHeight * heightPercent / 100));
    const frameAspectRatio = previewWidth > 0 && previewHeight > 0
      ? previewWidth / previewHeight
      : aspectRatio;
    const coverScale = Math.max(aspectRatio / frameAspectRatio, frameAspectRatio / aspectRatio);
    const artworkPreferredActiveWidth =
      stageWidth < 640
        ? stageWidth * (aspectRatio >= 1.2 ? 0.76 : 0.54)
        : stageWidth * (
            aspectRatio >= 1.3 ? 0.54 : aspectRatio >= 0.85 ? 0.42 : 0.36
          );
    const artworkActiveSize = fitArtworkWithinBounds(
      dimensions.width,
      dimensions.height,
      artworkPreferredActiveWidth,
      stageHeight * 0.86
    );

    // A Ribbon tile may become the focused artwork. Pick a source size that covers
    // both its focused display and the largest possible preview crop at this stage
    // height, independent of which artwork is active. This prevents low-res previews
    // from being promoted first and upgraded only after the animation has finished.
    const sourceSize = Math.max(
      1,
      Math.ceil(artworkActiveSize.width),
      Math.ceil(maxPreviewWidth),
      Math.ceil(aspectRatio * stageHeight)
    );

    return {
      index,
      offset,
      artwork,
      isActive,
      imageUrl: getStoragePublicUrl(artwork.public_image_path),
      failed: Boolean(failedImages[artwork.id]),
      imageScale: isActive ? 1 : coverScale,
      aspectRatio,
      sourceSize,
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
  // When the group widths differ substantially (e.g. landscape -> portrait),
  // sequence the old group out before letting the new group enter. Keep the marker
  // attached to the incoming artwork so the delayed animation is not restarted.
  const isSliceLayoutChange =
    viewMode === "sliced" && delayedSliceArtworkId === current.id;
  const shouldDelayCurrentSliceEntrance = isSliceLayoutChange;

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
          data-karyora-gallery-stage
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
              {seamExitSnapshot && (
                <div
                  ref={seamExitLayerRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute overflow-hidden border border-border/70 bg-surface-muted opacity-45 grayscale"
                  style={{
                    left: seamExitSnapshot.left + "px",
                    top: seamExitSnapshot.top + "px",
                    width: seamExitSnapshot.width + "px",
                    height: seamExitSnapshot.height + "px",
                    // Keep the outgoing edge tile visible above the reflowed ribbon
                    // until it has fully travelled beyond the clipped stage boundary.
                    zIndex: 30,
                  }}
                >
                  {seamExitSnapshot.imageUrl && !seamExitSnapshot.failed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      draggable={false}
                      src={getArtworkResponsiveImageSources(
                        seamExitSnapshot.artwork.public_image_path,
                        seamExitSnapshot.artwork.image_width ?? 1600,
                        seamExitSnapshot.artwork.image_height ?? 1200,
                      ).src ?? seamExitSnapshot.imageUrl}
                      srcSet={getArtworkResponsiveImageSources(
                        seamExitSnapshot.artwork.public_image_path,
                        seamExitSnapshot.artwork.image_width ?? 1600,
                        seamExitSnapshot.artwork.image_height ?? 1200,
                      ).srcSet}
                      sizes={seamExitSnapshot.sizes}
                      width={seamExitSnapshot.artwork.image_width ?? 1600}
                      height={seamExitSnapshot.artwork.image_height ?? 1200}
                      loading="eager"
                      fetchPriority="low"
                      decoding="async"
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-1 text-center">
                      <span className="font-artwork-title text-xs text-ink [writing-mode:vertical-rl]">
                        {seamExitSnapshot.artwork.title}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                    imageScale,
                    aspectRatio,
                    sourceSize,
                    width,
                    height,
                    left,
                    top,
                    staggerOffset,
                  } = entry;
                  const imageSources = getArtworkResponsiveImageSources(
                    artwork.public_image_path,
                    artwork.image_width ?? 1600,
                    artwork.image_height ?? 1200,
                  );
                  const visibility = isActive ? "flex" : getPanelVisibilityClass(offset);
                  const ribbonPatternIndex =
                    ((offset + 4) % STAGGER_HEIGHTS_RIBBONS.length + STAGGER_HEIGHTS_RIBBONS.length) %
                    STAGGER_HEIGHTS_RIBBONS.length;
                  const entranceDelay = getRibbonCascadeDelay(offset);
                  const entranceOriginX = getRibbonEntranceOriginX(stageWidth, left, width);
                  const entranceOriginY = Math.round(stageHeight / 2 - (top + height / 2));
                  const itemClassName = isActive
                    ? "artwork-ribbon-item group absolute z-20 shrink-0 overflow-hidden bg-transparent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                    : "artwork-ribbon-item artwork-ribbon-preview group absolute shrink-0 overflow-hidden rounded-xs border border-border/70 bg-surface-muted opacity-45 grayscale hover:opacity-90 hover:grayscale-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent";

                  return (
                    <button
                      key={artwork.id}
                      ref={(element) => {
                        if (element) ribbonItemsRef.current.set(artwork.id, element);
                        else ribbonItemsRef.current.delete(artwork.id);
                      }}
                      type="button"
                      data-artwork-id={artwork.id}
                      data-artwork-active={isActive ? "true" : "false"}
                      data-artwork-aspect={aspectRatio}
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
                      className={itemClassName + " " + visibility + (isRibbonEntranceActive ? " artwork-ribbon-enter" + (isActive ? " artwork-ribbon-enter-active" : "") : "")}
                      style={{
                        left: left + "px",
                        top: top + "px",
                        width: width + "px",
                        height: height + "px",
                        transform: "translate3d(0px, " + staggerOffset + "px, 0)",
                        animationDelay: entranceDelay + "ms",
                        "--ribbon-enter-x": entranceOriginX + "px",
                        "--ribbon-enter-y": entranceOriginY + "px",
                        "--ribbon-stagger-y": staggerOffset + "px",
                      } as CSSProperties}
                    >
                      {imageUrl && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          data-artwork-image
                          draggable={false}
                          src={imageSources.src ?? imageUrl}
                          srcSet={imageSources.srcSet}
                          sizes={`${sourceSize}px`}
                          width={artwork.image_width ?? 1600}
                          height={artwork.image_height ?? 1200}
                          loading="eager"
                          fetchPriority={isActive ? "high" : "low"}
                          decoding="async"
                          alt={isActive ? (artwork.alt_text || artwork.title) : ""}
                          onLoad={(event) => handleImageLoad(artwork.id, event.currentTarget)}
                          onError={() => handleImageError(artwork.id)}
                          className="absolute inset-0 h-full w-full object-contain transition-[scale] duration-700 motion-reduce:transition-none group-hover:scale-[1.025]"
                          style={{ transform: "scale(" + imageScale + ")" }}
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
                className="relative z-20 shrink-0"
                data-slice-layout-change={isSliceLayoutChange ? "true" : undefined}
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
                  const staggerIndex = transitionDirection === "next"
                    ? sliceIndex
                    : SLICE_COUNT - 1 - sliceIndex;
                  const centeredGroupTop = (stageHeight - sliceGroupHeight) / 2;
                  // Odd-numbered panels (1, 3, 5) begin fully above the stage
                  // and travel down into focus. Even-numbered panels (2, 4)
                  // begin below the stage and travel up into focus.
                  const enterY = sliceIndex % 2 === 0
                    ? -(centeredGroupTop + panelTop + panelHeight + 24)
                    : stageHeight - (centeredGroupTop + panelTop) + 24;

                  return (
                    <div
                      key={`${current.id}-${sliceIndex}`}
                      data-artwork-slice={sliceIndex}
                      className="artwork-slice-enter-panel absolute overflow-hidden rounded-[2px] border border-border/70 bg-surface-muted shadow-lg"
                      style={{
                        left: left + "px",
                        top: panelTop + "px",
                        width: slicePanelWidth + "px",
                        height: panelHeight + "px",
                        animationDelay: (
                          (shouldDelayCurrentSliceEntrance ? 870 : 20) + staggerIndex * 22
                        ) + "ms",
                        "--slice-enter-y": enterY + "px",
                      } as CSSProperties}
                    >
                      {currentImageUrl && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          draggable={false}
                          src={currentResponsiveSources.src ?? currentImageUrl}
                          srcSet={currentResponsiveSources.srcSet}
                          sizes={`${Math.max(1, Math.ceil(sliceSize.width))}px`}
                          width={current.image_width ?? 1600}
                          height={current.image_height ?? 1200}
                          loading="eager"
                          fetchPriority={sliceIndex === 2 ? "high" : "low"}
                          decoding="async"
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
              className={`artwork-exit-layer artwork-exit-${transitionSnapshot.direction} pointer-events-none absolute inset-0 z-30 flex items-center justify-center`}
              data-slice-layout-change={isSliceLayoutChange ? "true" : undefined}
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
                    const staggerIndex = transitionSnapshot.direction === "next"
                      ? sliceIndex
                      : SLICE_COUNT - 1 - sliceIndex;
                    const centeredOutgoingGroupTop =
                      (stageHeight - outgoingSliceGroupHeight) / 2;
                    // Continue each panel's entrance direction on exit, travelling
                    // far enough for its entire rectangle to clear the clipped stage.
                    const exitY = sliceIndex % 2 === 0
                      ? stageHeight - (centeredOutgoingGroupTop + panelTop) + panelHeight + 24
                      : -(centeredOutgoingGroupTop + panelTop + panelHeight + 24);

                    return (
                      <div
                        key={`outgoing-${transitionSnapshot.sequence}-${sliceIndex}`}
                        data-artwork-slice={sliceIndex}
                        className="artwork-slice-exit-panel absolute overflow-hidden rounded-[2px] border border-border/70 bg-surface-muted shadow-lg"
                        style={{
                          left: left + "px",
                          top: panelTop + "px",
                          width: outgoingSlicePanelWidth + "px",
                          height: panelHeight + "px",
                          animationDelay: (staggerIndex * 22) + "ms",
                          "--slice-exit-y": exitY + "px",
                        } as CSSProperties}
                      >
                        {outgoingImageUrl && !failed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            draggable={false}
                            src={outgoingResponsiveSources?.src ?? outgoingImageUrl}
                            srcSet={outgoingResponsiveSources?.srcSet}
                            sizes={`${Math.max(1, Math.ceil(outgoingSliceSize.width))}px`}
                            width={outgoingArtwork.image_width ?? 1600}
                            height={outgoingArtwork.image_height ?? 1200}
                            loading="eager"
                            fetchPriority="low"
                            decoding="async"
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
                      src={outgoingResponsiveSources?.src ?? outgoingImageUrl}
                      srcSet={outgoingResponsiveSources?.srcSet}
                      sizes={`${Math.max(1, Math.ceil(outgoingSize.width))}px`}
                      width={outgoingArtwork.image_width ?? 1600}
                      height={outgoingArtwork.image_height ?? 1200}
                      loading="eager"
                      fetchPriority="low"
                      decoding="async"
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
          data-slice-layout-change={isSliceLayoutChange ? "true" : undefined}
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
                className="artwork-caption-description-enter mt-1 line-clamp-2 max-w-2xl font-handwritten text-base leading-snug text-ink-soft sm:text-lg"
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
            onClick={() => {
              // Reuse the entrance sequence when returning from Sliced to Ribbon.
              // Clicking the already-active Ribbon control should not restart it.
              if (viewMode === "sliced") {
                clearSlicedNavigationLock();
                setIsRibbonEntranceActive(true);
              }
              setDelayedSliceArtworkId(null);
              setTransitionSnapshot(null);
              setViewMode("ribbons");
            }}
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
            onClick={() => {
              if (viewMode === "ribbons") {
                clearSlicedNavigationLock();
                setIsRibbonEntranceActive(false);
              }
              setDelayedSliceArtworkId(null);
              setTransitionSnapshot(null);
              setViewMode("sliced");
            }}
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
