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
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";
import { SalonArtworkPlaceholder } from "@/components/gallery/SalonArtworkPlaceholder";
import { SalonCameraCaption } from "@/components/gallery/SalonCameraCaption";
import {
  buildCameraWallLayout,
  getFocusCamera,
  getPanForIndex,
  getWallCamera,
} from "@/lib/gallery/camera-wall-layout";
import { getArtworkResponsiveImageSources } from "@/lib/storage/artwork-image-variants";
import { formatArtworkCategory } from "@/lib/utils/artwork-labels";
import type { PublicArtwork } from "@/lib/data/artworks";

type CameraPieceStyle = CSSProperties & Record<`--${string}`, string>;

interface SalonCameraRoomProps {
  artworks: PublicArtwork[];
  /** Optional deep-link target (`?item=`) to open the camera on. */
  initialIndex?: number | null;
}

interface StageSize {
  width: number;
  height: number;
}

type CameraMode =
  | { type: "wall"; pan: number }
  | { type: "focus"; index: number };

interface DragState {
  pointerId: number;
  startX: number;
  startPan: number;
  moved: boolean;
}

const DEFAULT_STAGE: StageSize = { width: 1440, height: 760 };
const TRANSITION_MS = 780;

export function SalonCameraRoom({
  artworks,
  initialIndex = null,
}: SalonCameraRoomProps) {
  const [stageSize, setStageSize] = useState<StageSize>(DEFAULT_STAGE);
  const [mode, setMode] = useState<CameraMode | null>(null);
  const [animateCamera, setAnimateCamera] = useState(false);
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

  const layout = useMemo(
    () =>
      buildCameraWallLayout(artworks, {
        stageWidth: stageSize.width,
        stageHeight: stageSize.height,
        naturalAspects,
      }),
    [artworks, stageSize, naturalAspects],
  );

  const initialPan =
    initialIndex !== null &&
    initialIndex !== undefined &&
    initialIndex >= 0 &&
    initialIndex < layout.pieces.length
      ? getPanForIndex(layout, initialIndex)
      : layout.initialPan;
  const resolvedMode: CameraMode = mode ?? {
    type: "wall",
    pan: initialPan,
  };
  const focusedIndex =
    resolvedMode.type === "focus" ? resolvedMode.index : null;
  const focusedPiece =
    focusedIndex !== null ? (layout.pieces[focusedIndex] ?? null) : null;
  const camera =
    resolvedMode.type === "focus"
      ? getFocusCamera(layout, resolvedMode.index)
      : getWallCamera(layout, resolvedMode.pan);

  const dismissHint = useCallback(() => setShowHint(false), []);

  const animate = useCallback(() => {
    setAnimateCamera(true);
    if (animateTimerRef.current !== null) {
      window.clearTimeout(animateTimerRef.current);
    }
    animateTimerRef.current = window.setTimeout(() => {
      setAnimateCamera(false);
      animateTimerRef.current = null;
    }, TRANSITION_MS);
  }, []);

  const panBy = useCallback(
    (delta: number) => {
      if (mode?.type === "focus") return;
      const basePan =
        mode?.type === "wall"
          ? getWallCamera(layout, mode.pan).pan
          : initialPan;
      setAnimateCamera(false);
      setMode({
        type: "wall",
        pan: getWallCamera(layout, basePan + delta).pan,
      });
      dismissHint();
    },
    [dismissHint, initialPan, layout, mode],
  );

  const openFocus = useCallback(
    (index: number) => {
      if (mode?.type === "focus") return;
      justClosedRef.current = false;
      dismissHint();
      animate();
      setMode({ type: "focus", index });
      window.requestAnimationFrame(() => {
        captionBackRef.current?.focus({ preventScroll: true });
      });
    },
    [animate, dismissHint, mode],
  );

  const closeFocus = useCallback(() => {
    if (mode?.type !== "focus" || justClosedRef.current) return;
    const index = mode.index;
    justClosedRef.current = true;
    animate();
    setMode({ type: "wall", pan: getPanForIndex(layout, index) });
    window.requestAnimationFrame(() => {
      anchorRefs.current[index]?.focus({ preventScroll: true });
      window.setTimeout(() => {
        justClosedRef.current = false;
      }, 420);
    });
  }, [animate, layout, mode]);

  const stepFocus = useCallback(
    (delta: number) => {
      if (mode?.type !== "focus") return;
      const nextIndex = Math.min(
        artworks.length - 1,
        Math.max(0, mode.index + delta),
      );
      if (nextIndex === mode.index) return;
      animate();
      setMode({ type: "focus", index: nextIndex });
    },
    [animate, artworks.length, mode],
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

  // Vertical wheel and horizontal trackpad gestures both drive the camera.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest("[data-camera-caption]")) {
        return;
      }
      event.preventDefault();
      if (focusedIndex !== null) return;
      if (animateCamera) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      panBy(delta);
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [animateCamera, focusedIndex, panBy]);

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

    const basePan =
      mode?.type === "wall"
        ? getWallCamera(layout, mode.pan).pan
        : initialPan;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPan: basePan,
      moved: false,
    };
    setAnimateCamera(false);
    dismissHint();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) drag.moved = true;
    setMode({
      type: "wall",
      pan: getWallCamera(layout, drag.startPan - distance).pan,
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
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
    event.preventDefault();
    event.stopPropagation();
    if (consumeSuppressedClick()) return;
    openFocus(index);
  };

  const handleArtworkFocus = (
    event: React.FocusEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (focusedIndex !== null || justClosedRef.current) return;
    if (!event.currentTarget.matches(":focus-visible")) return;
    animate();
    setMode({ type: "wall", pan: getPanForIndex(layout, index) });
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
    if (focusedIndex !== null) {
      stepFocus(direction);
      return;
    }
    panBy(direction * stageSize.width * 0.35);
  };

  const sceneStyle: CSSProperties = {
    width: layout.sceneWidth,
    height: layout.stageHeight,
    transform: `translate3d(${camera.tx}px, ${camera.ty}px, 0) scale(${camera.scale})`,
    transformOrigin: "0 0",
    transition: animateCamera
      ? "transform 780ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 500ms ease"
      : "opacity 500ms ease",
    opacity: ready ? 1 : 0,
    willChange: "transform",
  };

  return (
    <div className="camera-room relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-paper text-ink">
      <header className="relative z-[101] flex h-16 shrink-0 items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-12">
        <div className="w-11 sm:w-12" aria-hidden="true" />

        <h1
          className={
            "absolute left-1/2 top-1/2 z-[103] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-brand text-[26px] leading-none tracking-tight transition-colors sm:text-3xl lg:text-[40px] " +
            (isMenuOpen ? "text-paper" : "text-ink")
          }
        >
          The Salon Wall
        </h1>

        <PublicNavigationMenu
          buttonClassName="text-ink hover:text-accent"
          onOpenChange={setIsMenuOpen}
        />
      </header>

      <main className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          role="region"
          aria-label="The Salon Wall. Scroll or drag to move along the wall. Select an artwork to zoom in."
          tabIndex={0}
          data-focused={focusedIndex !== null ? "true" : "false"}
          className="camera-stage absolute inset-0 overflow-hidden focus:outline-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={handleStageClick}
          onKeyDown={handleKeyDown}
        >
          <div className="camera-rail" aria-hidden="true" />

          <div
            className="camera-scene"
            style={sceneStyle}
            data-focused={focusedIndex !== null ? "true" : "false"}
            aria-hidden={focusedIndex !== null ? true : undefined}
            inert={focusedIndex !== null}
          >
            {layout.pieces.map((piece) => {
              const { artwork } = piece;
              const sources = getArtworkResponsiveImageSources(
                artwork.public_image_path,
                artwork.image_width,
                artwork.image_height,
              );
              const failed = Boolean(failedImages[artwork.id]);
              const isFocused = focusedIndex === piece.index;

              return (
                <div
                  key={artwork.id}
                  data-camera-piece={piece.index}
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
                      anchorRefs.current[piece.index] = node;
                    }}
                    href={`/artworks/${artwork.slug}`}
                    onClick={(event) =>
                      handleArtworkClick(event, piece.index)
                    }
                    onFocus={(event) =>
                      handleArtworkFocus(event, piece.index)
                    }
                    aria-label={`Zoom into ${artwork.title}, ${formatArtworkCategory(artwork.category)}`}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    className="camera-frame"
                    data-focused-artwork={isFocused ? "true" : undefined}
                  >
                    <span
                      className="camera-frame-outer"
                      style={
                        {
                          padding: piece.border,
                          background: piece.frameColor,
                        } as CSSProperties
                      }
                    >
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
                          {sources.src && !failed ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sources.src}
                              srcSet={sources.srcSet}
                              sizes={`${Math.round(piece.width * 1.6)}px`}
                              alt={artwork.alt_text || artwork.title}
                              draggable={false}
                              loading={
                                piece.index < 6 ? "eager" : "lazy"
                              }
                              fetchPriority={
                                piece.index === 0 ? "high" : "auto"
                              }
                              decoding="async"
                              data-camera-artwork-id={artwork.id}
                              onLoad={(event) =>
                                recordNaturalAspect(
                                  artwork,
                                  event.currentTarget,
                                )
                              }
                              onError={() => markImageFailed(artwork.id)}
                            />
                          ) : (
                            <SalonArtworkPlaceholder
                              artwork={artwork}
                              numberLabel={piece.numberLabel}
                              large={piece.mediaWidth > 260}
                            />
                          )}
                        </span>
                      </span>
                    </span>
                  </a>
                </div>
              );
            })}
          </div>

          {focusedPiece && (
            <SalonCameraCaption
              artwork={focusedPiece.artwork}
              index={focusedPiece.index}
              total={artworks.length}
              onClose={closeFocus}
              onStep={stepFocus}
              backButtonRef={captionBackRef}
            />
          )}

          <div
            className="camera-hint"
            data-hidden={showHint && focusedIndex === null ? "false" : "true"}
            aria-hidden="true"
          >
            <span className="hidden sm:inline">
              Scroll or drag to move along the wall
            </span>
            <span className="sm:hidden">Swipe to move along the wall</span>
            <span className="camera-hint-arrows">← →</span>
          </div>

          <p className="sr-only" aria-live="polite">
            {focusedPiece
              ? `Focused ${focusedPiece.artwork.title}, ${focusedPiece.index + 1} of ${artworks.length}`
              : ""}
          </p>
        </div>
      </main>
    </div>
  );
}
