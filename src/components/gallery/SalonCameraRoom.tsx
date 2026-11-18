"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";
import { SalonArtworkPlaceholder } from "@/components/gallery/SalonArtworkPlaceholder";
import { SalonCameraCaption } from "@/components/gallery/SalonCameraCaption";
import {
  buildSalonWallLayout,
  type SalonWallPiece,
} from "@/lib/gallery/salon-wall-layout";
import {
  getDefaultCamera,
  getFocusCamera,
  getOverviewCamera,
  getPanBounds,
  getPanForIndex,
  getStrollScale,
  getWallCamera,
} from "@/lib/gallery/salon-wall-camera";
import { getArtworkResponsiveImageSources } from "@/lib/storage/artwork-image-variants";
import { formatArtworkCategory } from "@/lib/utils/artwork-labels";
import type { PublicArtwork } from "@/lib/data/artworks";

type CameraPieceStyle = CSSProperties & Record<`--${string}`, string>;

interface SalonCameraRoomProps {
  artworks: PublicArtwork[];
  /** Legacy 0-based index into the source collection (`?item=` is 1-based). */
  initialIndex?: number | null;
  /** Stable deep link target (`?artwork=<slug>`). */
  initialSlug?: string | null;
}

interface StageSize {
  width: number;
  height: number;
}

type CameraMode =
  | { type: "overview" }
  | { type: "wall"; scale: number; pan: number }
  | { type: "focus"; index: number };

interface DragState {
  pointerId: number;
  startX: number;
  startPan: number;
  scale: number;
  moved: boolean;
  captured: boolean;
  fromOverview: boolean;
  stepped: boolean;
}

const DEFAULT_STAGE: StageSize = { width: 1440, height: 760 };
const TRANSITION_MS = 780;
const STEP_TRANSITION_MS = 520;
const PAN_TRANSITION_MS = 220;
const DRAG_STEP_TRANSITION_MS = 240;
const FOCUSED_IMAGE_SIZES = "(min-width: 1280px) 60vw, 92vw";

export function SalonCameraRoom({
  artworks,
  initialIndex = null,
  initialSlug = null,
}: SalonCameraRoomProps) {
  const [stageSize, setStageSize] = useState<StageSize>(DEFAULT_STAGE);
  const [mode, setMode] = useState<CameraMode | null>(null);
  const [cameraTransitionMs, setCameraTransitionMs] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [naturalAspects, setNaturalAspects] = useState<Record<string, number>>(
    {},
  );
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const stageRef = useRef<HTMLDivElement | null>(null);
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const captionBackRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const animateTimerRef = useRef<number | null>(null);
  const justClosedRef = useRef(false);
  const returnModeRef = useRef<CameraMode>({ type: "overview" });
  const initialFocusAppliedRef = useRef(false);

  const layout = useMemo(
    () =>
      buildSalonWallLayout(artworks, {
        stageWidth: stageSize.width,
        stageHeight: stageSize.height,
        naturalAspects,
      }),
    [artworks, stageSize, naturalAspects],
  );

  const initialFocusIndex = useMemo(() => {
    if (initialSlug) {
      const slugIndex = layout.pieces.findIndex(
        (piece) => piece.artwork.slug === initialSlug,
      );
      if (slugIndex >= 0) return slugIndex;
    }
    if (
      initialIndex !== null &&
      initialIndex !== undefined &&
      initialIndex >= 0 &&
      initialIndex < artworks.length
    ) {
      const target = artworks[initialIndex];
      const targetIndex = layout.pieces.findIndex(
        (piece) => piece.artwork.id === target?.id,
      );
      if (targetIndex >= 0) return targetIndex;
    }
    return null;
  }, [artworks, initialIndex, initialSlug, layout.pieces]);

  const defaultMode = useMemo<CameraMode>(() => {
    const next = getDefaultCamera(layout, stageSize);
    return next.mode === "overview"
      ? { type: "overview" }
      : { type: "wall", scale: next.scale, pan: next.pan };
  }, [layout, stageSize]);

  const resolvedMode = useMemo<CameraMode>(
    () =>
      mode ??
      (initialFocusIndex !== null
        ? { type: "focus", index: initialFocusIndex }
        : defaultMode),
    [defaultMode, initialFocusIndex, mode],
  );

  const focusedIndex =
    resolvedMode.type === "focus" ? resolvedMode.index : null;
  const focusedPiece =
    focusedIndex !== null ? (layout.pieces[focusedIndex] ?? null) : null;
  const camera =
    resolvedMode.type === "focus"
      ? getFocusCamera(layout, resolvedMode.index, stageSize)
      : resolvedMode.type === "wall"
        ? getWallCamera(
            layout,
            resolvedMode.pan,
            resolvedMode.scale,
            stageSize,
          )
        : getOverviewCamera(layout, stageSize);

  const panBounds =
    resolvedMode.type === "wall"
      ? getPanBounds(layout, resolvedMode.scale, stageSize)
      : { min: 0, max: 0 };
  const currentWallPan =
    resolvedMode.type === "wall" ? resolvedMode.pan : 0;
  const stepView = useMemo(() => {
    const scale = getStrollScale(layout, stageSize);
    const bounds = getPanBounds(layout, scale, stageSize);
    const visibleWidth = stageSize.width / scale;
    const pan = Math.min(
      Math.max((layout.sceneWidth - visibleWidth) / 2, bounds.min),
      bounds.max,
    );
    return { scale, bounds, pan, canScroll: bounds.max > 0 };
  }, [layout, stageSize]);
  const canScroll = stepView.canScroll;

  const dismissHint = useCallback(() => setShowHint(false), []);

  const getStepPanForAnchor = useCallback(
    (anchorX?: number) => {
      if (!stepView.canScroll || anchorX === undefined) {
        return stepView.pan;
      }
      const overview = getOverviewCamera(layout, stageSize);
      const sceneX = (anchorX - overview.tx) / overview.scale;
      const pan = sceneX - anchorX / stepView.scale;
      return Math.min(
        Math.max(pan, stepView.bounds.min),
        stepView.bounds.max,
      );
    },
    [layout, stageSize, stepView],
  );

  const animate = useCallback((duration = TRANSITION_MS) => {
    setCameraTransitionMs(duration);
    if (animateTimerRef.current !== null) {
      window.clearTimeout(animateTimerRef.current);
    }
    animateTimerRef.current = window.setTimeout(() => {
      setCameraTransitionMs(0);
      animateTimerRef.current = null;
    }, duration);
  }, []);

  const panTo = useCallback(
    (nextPan: number, duration: number) => {
      if (resolvedMode.type !== "wall") return;
      const bounds = getPanBounds(layout, resolvedMode.scale, stageSize);
      if (duration > 0) animate(duration);
      else setCameraTransitionMs(0);
      setMode({
        type: "wall",
        scale: resolvedMode.scale,
        pan: Math.min(Math.max(nextPan, bounds.min), bounds.max),
      });
      dismissHint();
    },
    [animate, dismissHint, layout, resolvedMode, stageSize],
  );

  const smoothPanBy = useCallback(
    (screenDelta: number) => {
      if (resolvedMode.type !== "wall") return;
      panTo(
        resolvedMode.pan + screenDelta / resolvedMode.scale,
        STEP_TRANSITION_MS,
      );
    },
    [panTo, resolvedMode],
  );

  const enterWallFromOverview = useCallback(
    (anchorX?: number) => {
      if (resolvedMode.type !== "overview" || !stepView.canScroll) return;
      animate(STEP_TRANSITION_MS);
      setMode({
        type: "wall",
        scale: stepView.scale,
        pan: getStepPanForAnchor(anchorX),
      });
      dismissHint();
    },
    [
      animate,
      dismissHint,
      getStepPanForAnchor,
      resolvedMode,
      stepView,
    ],
  );

  const openFocus = useCallback(
    (index: number) => {
      if (resolvedMode.type === "focus") return;
      returnModeRef.current = resolvedMode;
      justClosedRef.current = false;
      dismissHint();
      animate();
      setMode({ type: "focus", index });
      window.requestAnimationFrame(() => {
        captionBackRef.current?.focus({ preventScroll: true });
      });
    },
    [animate, dismissHint, resolvedMode],
  );

  const closeFocus = useCallback(() => {
    if (resolvedMode.type !== "focus" || justClosedRef.current) return;
    const index = resolvedMode.index;
    justClosedRef.current = true;
    animate();
    setMode(returnModeRef.current);
    window.requestAnimationFrame(() => {
      anchorRefs.current[index]?.focus({ preventScroll: true });
      window.setTimeout(() => {
        justClosedRef.current = false;
      }, 420);
    });
  }, [animate, resolvedMode]);

  const stepFocus = useCallback(
    (delta: number) => {
      if (resolvedMode.type !== "focus") return;
      const nextIndex = Math.min(
        layout.pieces.length - 1,
        Math.max(0, resolvedMode.index + delta),
      );
      if (nextIndex === resolvedMode.index) return;
      animate();
      setMode({ type: "focus", index: nextIndex });
    },
    [animate, layout.pieces.length, resolvedMode],
  );

  // Measure the stage so the scene can be laid out in real pixels.
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 1 || height < 1) return;
      setStageSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
      setReady(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (animateTimerRef.current !== null) {
        window.clearTimeout(animateTimerRef.current);
      }
    };
  }, []);

  // Deep-linked focus should move keyboard focus to the caption once.
  useEffect(() => {
    if (
      !ready ||
      initialFocusAppliedRef.current ||
      mode !== null ||
      initialFocusIndex === null
    ) {
      return;
    }
    initialFocusAppliedRef.current = true;
    window.requestAnimationFrame(() => {
      captionBackRef.current?.focus({ preventScroll: true });
    });
  }, [initialFocusIndex, mode, ready]);

  // Vertical wheel and horizontal trackpad gestures drive the camera. In the
  // overview, the first gesture steps closer; in the wall, it pans.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest("[data-camera-caption]")) {
        return;
      }
      event.preventDefault();
      if (focusedIndex !== null) return;
      if (resolvedMode.type === "overview") {
        enterWallFromOverview(event.clientX);
        return;
      }
      if (resolvedMode.type !== "wall") return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      panTo(
        resolvedMode.pan + delta / resolvedMode.scale,
        PAN_TRANSITION_MS,
      );
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [
    enterWallFromOverview,
    focusedIndex,
    panTo,
    resolvedMode,
  ]);

  // Broken images can fail before React hydrates and attaches onError.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const brokenIds = Array.from(
      stage.querySelectorAll<HTMLImageElement>("img[data-camera-artwork-id]"),
    )
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.dataset.cameraArtworkId)
      .filter((id): id is string => Boolean(id));
    if (brokenIds.length === 0) return;
    setFailedImages((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const id of brokenIds) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [artworks]);

  const markImageFailed = useCallback((id: string) => {
    setFailedImages((previous) =>
      previous[id] ? previous : { ...previous, [id]: true },
    );
  }, []);

  // Legacy rows without presentation dimensions use the natural ratio.
  const recordNaturalAspect = useCallback(
    (artwork: PublicArtwork, image: HTMLImageElement) => {
      if (artwork.image_width && artwork.image_height) return;
      if (!image.naturalWidth || !image.naturalHeight) return;
      const ratio = image.naturalWidth / image.naturalHeight;
      setNaturalAspects((previous) => {
        const existing = previous[artwork.id];
        if (existing && Math.abs(existing - ratio) < 0.0005) return previous;
        return { ...previous, [artwork.id]: ratio };
      });
    },
    [],
  );

  const consumeSuppressedClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (focusedIndex !== null) return;
    if ((event.target as HTMLElement).closest("[data-camera-caption]")) return;

    if (resolvedMode.type === "overview") {
      if (!stepView.canScroll) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startPan: getStepPanForAnchor(event.clientX),
        scale: stepView.scale,
        moved: false,
        captured: false,
        fromOverview: true,
        stepped: false,
      };
      setCameraTransitionMs(0);
      dismissHint();
      return;
    }

    if (resolvedMode.type !== "wall") return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPan: resolvedMode.pan,
      scale: resolvedMode.scale,
      moved: false,
      captured: false,
      fromOverview: false,
      stepped: true,
    };
    setCameraTransitionMs(0);
    dismissHint();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) {
      drag.moved = true;
      // Capture only once the gesture is clearly a drag. Capturing on
      // pointerdown retargets the following click to the stage and swallows
      // normal "click a frame to zoom" interactions.
      if (!drag.captured) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.captured = true;
        } catch {
          // The pointer may already be gone; the gesture can simply stop.
        }
      }
    } else {
      return;
    }

    if (drag.fromOverview && !drag.stepped) {
      // Ease into the scrollable step while the pointer is already moving, so
      // the wall does not snap from the overview to the closer framing.
      drag.stepped = true;
      drag.scale = stepView.scale;
      animate(DRAG_STEP_TRANSITION_MS);
    }

    const bounds = getPanBounds(layout, drag.scale, stageSize);
    setMode({
      type: "wall",
      scale: drag.scale,
      pan: Math.min(
        Math.max(drag.startPan - distance / drag.scale, bounds.min),
        bounds.max,
      ),
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);
    }
  };

  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (consumeSuppressedClick()) return;
    if (focusedIndex !== null) {
      closeFocus();
      return;
    }
    if ((event.target as HTMLElement).closest("[data-camera-caption]")) return;
  };

  const handleArtworkClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    if (focusedIndex !== null) {
      // The focused frame is a normal link to the artwork page.
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (consumeSuppressedClick()) return;
    openFocus(index);
  };

  const handleArtworkFocus = (
    event: ReactFocusEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (focusedIndex !== null || justClosedRef.current) return;
    if (!event.currentTarget.matches(":focus-visible")) return;
    if (resolvedMode.type === "overview" && !canScroll) {
      dismissHint();
      return;
    }
    const anchorRect = event.currentTarget.getBoundingClientRect();
    const anchorX = anchorRect.left + anchorRect.width / 2;
    const scale =
      resolvedMode.type === "wall" ? resolvedMode.scale : stepView.scale;
    const pan =
      resolvedMode.type === "overview"
        ? getStepPanForAnchor(anchorX)
        : getPanForIndex(layout, index, scale, stageSize);
    animate(
      resolvedMode.type === "overview"
        ? STEP_TRANSITION_MS
        : PAN_TRANSITION_MS,
    );
    setMode({ type: "wall", scale, pan });
    dismissHint();
  };

  // Escape must close the focused work wherever focus currently sits.
  useEffect(() => {
    if (focusedIndex === null || isMenuOpen) return;
    const handleGlobalEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeFocus();
    };
    window.addEventListener("keydown", handleGlobalEscape);
    return () => window.removeEventListener("keydown", handleGlobalEscape);
  }, [closeFocus, focusedIndex, isMenuOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && focusedIndex !== null) {
      event.preventDefault();
      closeFocus();
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    if (resolvedMode.type === "focus") {
      stepFocus(direction);
      return;
    }
    if (resolvedMode.type === "overview") {
      enterWallFromOverview();
      return;
    }
    smoothPanBy(direction * stageSize.width * 0.42);
  };

  const sceneStyle: CSSProperties = {
    width: layout.sceneWidth,
    height: layout.sceneHeight,
    transform: `translate3d(${camera.tx}px, ${camera.ty}px, 0) scale(${camera.scale})`,
    transformOrigin: "0 0",
    transition:
      cameraTransitionMs > 0
        ? `transform ${cameraTransitionMs}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 500ms ease`
        : "opacity 500ms ease",
    opacity: ready ? 1 : 0,
    willChange: "transform",
  };

  const renderMedia = (
    piece: SalonWallPiece,
    sources: ReturnType<typeof getArtworkResponsiveImageSources>,
    failed: boolean,
    isFocused: boolean,
  ) => {
    if (sources.src && !failed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources.src}
          srcSet={sources.srcSet}
          sizes={
            isFocused
              ? FOCUSED_IMAGE_SIZES
              : `${Math.round(piece.width * 1.6)}px`
          }
          alt={piece.artwork.alt_text || piece.artwork.title}
          draggable={false}
          loading={piece.readingOrder < 8 ? "eager" : "lazy"}
          fetchPriority={piece.readingOrder === 0 ? "high" : "auto"}
          decoding="async"
          data-camera-artwork-id={piece.artwork.id}
          onLoad={(event) =>
            recordNaturalAspect(piece.artwork, event.currentTarget)
          }
          onError={() => markImageFailed(piece.artwork.id)}
        />
      );
    }
    return (
      <SalonArtworkPlaceholder
        artwork={piece.artwork}
        numberLabel={piece.numberLabel}
        large={piece.mediaWidth > 260}
      />
    );
  };

  const hintedMode = resolvedMode.type;

  return (
    <div className="camera-room relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-paper text-ink">
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[101] flex h-16 items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-12">
        <div className="pointer-events-auto z-[104] flex items-center">
          {resolvedMode.type === "focus" ? (
            <button
              type="button"
              onClick={() => closeFocus()}
              aria-label="Back to the salon wall"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong/40 bg-paper/92 px-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ink shadow-xs backdrop-blur-md transition-all hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="hidden sm:inline">Wall</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                animate(STEP_TRANSITION_MS);
                if (resolvedMode.type === "overview") {
                  setMode({
                    type: "wall",
                    scale: stepView.scale,
                    pan: stepView.pan,
                  });
                } else {
                  setMode({ type: "overview" });
                }
                dismissHint();
              }}
              aria-label={
                resolvedMode.type === "overview"
                  ? "Step closer to stroll along the salon wall"
                  : "Zoom out to view the full salon wall overview"
              }
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong/40 bg-paper/92 px-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ink shadow-xs backdrop-blur-md transition-all hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              {resolvedMode.type === "overview" ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>Stroll</span>
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Overview</span>
                </>
              )}
            </button>
          )}
        </div>

        <h1
          className={
            "pointer-events-auto absolute left-1/2 top-1/2 z-[103] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-brand text-[26px] leading-none tracking-tight transition-colors sm:text-3xl lg:text-[40px] " +
            (isMenuOpen ? "text-paper" : "text-ink")
          }
        >
          The Salon Wall
        </h1>

        <div className="pointer-events-auto">
          <PublicNavigationMenu
            buttonClassName="text-ink hover:text-accent"
            onOpenChange={setIsMenuOpen}
          />
        </div>
      </header>

      <main className="relative h-full w-full overflow-hidden">
        <div
          ref={stageRef}
          role="region"
          aria-label="The Salon Wall. The curated hang is shown as a wall. Select an artwork to zoom in."
          tabIndex={0}
          data-camera-mode={hintedMode}
          data-focused={focusedIndex !== null ? "true" : "false"}
          className="camera-stage absolute inset-0 overflow-hidden focus:outline-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={handleStageClick}
          onKeyDown={handleKeyDown}
        >
          <div
            className="camera-scene"
            style={sceneStyle}
            data-focused={focusedIndex !== null ? "true" : "false"}
            aria-hidden={focusedIndex !== null ? true : undefined}
            inert={focusedIndex !== null}
          >
            <div
              className="camera-wall-baseboard"
              style={{ top: layout.wallBottom - layout.wallTop + 18 }}
              aria-hidden="true"
            >
              <div className="camera-wall-floor" aria-hidden="true" />
            </div>

            {layout.pieces.map((piece) => {
              const { artwork } = piece;
              const sources = getArtworkResponsiveImageSources(
                artwork.public_image_path,
                artwork.image_width,
                artwork.image_height,
              );
              const failed = Boolean(failedImages[artwork.id]);
              const isFocused = focusedIndex === piece.readingOrder;

              return (
                <div
                  key={artwork.id}
                  data-camera-piece={piece.readingOrder}
                  data-focused-piece={isFocused ? "true" : undefined}
                  className="camera-piece"
                  style={
                    {
                      left: piece.left,
                      top: piece.top,
                      width: piece.width,
                      height: piece.height,
                      "--rot": `${piece.rotation}deg`,
                    } as CameraPieceStyle
                  }
                >
                  <a
                    ref={(node) => {
                      anchorRefs.current[piece.readingOrder] = node;
                    }}
                    href={`/artworks/${artwork.slug}`}
                    onClick={(event) =>
                      handleArtworkClick(event, piece.readingOrder)
                    }
                    onFocus={(event) =>
                      handleArtworkFocus(event, piece.readingOrder)
                    }
                    aria-label={`Zoom into ${artwork.title}, ${formatArtworkCategory(artwork.category)}`}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    className="camera-frame"
                    data-focused-artwork={isFocused ? "true" : undefined}
                  >
                    <span
                      className={`camera-frame-outer ${piece.frameStyleKey ? `camera-frame-${piece.frameStyleKey}` : ""}`}
                      style={
                        {
                          padding: piece.border,
                          background: piece.frameColor,
                        } as CSSProperties
                      }
                    >
                      {piece.hasMat ? (
                        <span
                          className="camera-mat"
                          style={
                            {
                              padding: piece.mat,
                              background: piece.matColor,
                            } as CSSProperties
                          }
                        >
                          <span
                            className="camera-media"
                            style={{
                              width: piece.mediaWidth,
                              height: piece.mediaHeight,
                            }}
                          >
                            {renderMedia(piece, sources, failed, isFocused)}
                          </span>
                        </span>
                      ) : (
                        <span
                          className="camera-media camera-media-fullbleed"
                          style={{
                            width: piece.mediaWidth,
                            height: piece.mediaHeight,
                          }}
                        >
                          {renderMedia(piece, sources, failed, isFocused)}
                        </span>
                      )}
                    </span>
                  </a>

                  <span className="camera-tombstone-card" aria-hidden="true">
                    <span className="camera-tombstone-num">
                      {piece.numberLabel}
                    </span>
                    <span className="camera-tombstone-title">
                      {artwork.title}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {focusedPiece && (
            <SalonCameraCaption
              artwork={focusedPiece.artwork}
              index={focusedPiece.readingOrder}
              total={layout.pieces.length}
              onClose={closeFocus}
              onStep={stepFocus}
              backButtonRef={captionBackRef}
            />
          )}

          {resolvedMode.type === "wall" && (
            <>
              {currentWallPan > panBounds.min + 12 && (
                <button
                  type="button"
                  aria-label="Scroll left along the salon wall"
                  onClick={(event) => {
                    event.stopPropagation();
                    smoothPanBy(-stageSize.width * 0.45);
                  }}
                  className="camera-nav-btn camera-nav-left absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-strong/40 bg-paper/90 p-3 text-ink shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {currentWallPan < panBounds.max - 12 && (
                <button
                  type="button"
                  aria-label="Scroll right along the salon wall"
                  onClick={(event) => {
                    event.stopPropagation();
                    smoothPanBy(stageSize.width * 0.45);
                  }}
                  className="camera-nav-btn camera-nav-right absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-strong/40 bg-paper/90 p-3 text-ink shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </>
          )}

          <div
            className="camera-hint"
            data-hidden={
              showHint && focusedIndex === null ? "false" : "true"
            }
            aria-hidden="true"
          >
            {resolvedMode.type === "overview" ? (
              <span>
                <span className="hidden sm:inline">
                  {canScroll
                    ? "Scroll or drag to explore · select a work to zoom"
                    : "Select a work to zoom"}
                </span>
                <span className="sm:hidden">
                  Select a work to step closer
                </span>
              </span>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Scroll or drag to move along the wall
                </span>
                <span className="sm:hidden">
                  Swipe to move along the wall
                </span>
              </>
            )}
            {resolvedMode.type === "wall" && (
              <span className="camera-hint-arrows">← →</span>
            )}
          </div>

          <p className="sr-only" aria-live="polite">
            {focusedPiece
              ? `Focused ${focusedPiece.artwork.title}, ${focusedPiece.readingOrder + 1} of ${layout.pieces.length}`
              : ""}
          </p>
        </div>
      </main>
    </div>
  );
}
