import type { SalonWallLayout } from "./salon-wall-layout";

/**
 * Pure camera math for The Salon Wall.
 *
 * The scene is content-only; the camera maps scene pixels into the stage.
 * It has three framings:
 * - overview: fit the whole hang,
 * - wall: a closer, pannable slice,
 * - focus: fit one artwork clear of the caption.
 *
 * All functions are deterministic and safe for degenerate inputs.
 */

export interface SalonWallCamera {
  scale: number;
  tx: number;
  ty: number;
}

export interface SalonWallViewport {
  width: number;
  height: number;
}

export type SalonWallDefaultCamera =
  | { mode: "overview" }
  | { mode: "wall"; scale: number; pan: number };

const MIN_SCALE = 0.12;
const MAX_FOCUS_SCALE = 8;
const MAX_SOURCE_EDGE = 1600;

/**
 * First scroll / "step closer" framing. The overview shows the whole hang;
 * this scale gives the camera enough extra width to travel sideways while the
 * register composition stays intact.
 */
export const SALON_WALL_STEP_SCALE = 1.2;

/**
 * Calculates a comfortable stroll scale that guarantees all registers stay
 * fully within the vertical viewport without any top or bottom frames being clipped.
 */
export function getStrollScale(
  layout: SalonWallLayout,
  viewport: SalonWallViewport,
): number {
  const safe = safeViewport(viewport);
  const overview = getOverviewCamera(layout, safe);
  // Guarantee vertical clearance so no frames are clipped at top or bottom:
  // reserve comfortable vertical margin so artworks breathe inside the room.
  const availableHeight = safe.height * 0.90;
  const maxVerticalScale = availableHeight / Math.max(1, layout.sceneHeight);

  if (safe.width >= 1024) {
    const desiredScale = Math.max(overview.scale * 1.10, 1.05);
    return clamp(Math.min(desiredScale, maxVerticalScale), overview.scale, 1.3);
  }

  // Mobile / tablet:
  const fitHeightScale = (safe.height * 0.88) / Math.max(1, layout.sceneHeight);
  const widthTargetScale =
    safe.width / Math.max(1, sceneWidth(layout) * 0.45);
  return clamp(Math.min(fitHeightScale, widthTargetScale), 0.7, 2.0);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function safeViewport(viewport: SalonWallViewport): SalonWallViewport {
  return {
    width: Math.max(1, Number.isFinite(viewport.width) ? viewport.width : 1),
    height: Math.max(1, Number.isFinite(viewport.height) ? viewport.height : 1),
  };
}

function sceneWidth(layout: SalonWallLayout): number {
  return Math.max(1, layout.sceneWidth);
}

function sceneHeight(layout: SalonWallLayout): number {
  return Math.max(1, layout.sceneHeight);
}

export function getOverviewCamera(
  layout: SalonWallLayout,
  viewport: SalonWallViewport,
): SalonWallCamera {
  const safe = safeViewport(viewport);
  const rawScale = Math.min(
    safe.width / sceneWidth(layout),
    safe.height / sceneHeight(layout),
    1,
  );
  const scale = clamp(rawScale, MIN_SCALE, 1);
  return {
    scale,
    tx: (safe.width - sceneWidth(layout) * scale) / 2,
    ty: (safe.height - sceneHeight(layout) * scale) / 2,
  };
}

export function getWallCamera(
  layout: SalonWallLayout,
  pan: number,
  scale: number,
  viewport: SalonWallViewport,
): SalonWallCamera {
  const safe = safeViewport(viewport);
  const safeScale = clamp(
    Number.isFinite(scale) ? scale : 1,
    MIN_SCALE,
    MAX_FOCUS_SCALE,
  );
  const visibleWidth = safe.width / safeScale;
  const maxPan = Math.max(0, sceneWidth(layout) - visibleWidth);
  const clampedPan = clamp(
    Number.isFinite(pan) ? pan : 0,
    0,
    maxPan,
  );
  const centered =
    safe.width > sceneWidth(layout) * safeScale
      ? (safe.width - sceneWidth(layout) * safeScale) / 2
      : 0;
  return {
    scale: safeScale,
    tx: centered - clampedPan * safeScale,
    ty: (safe.height - sceneHeight(layout) * safeScale) / 2,
  };
}

export function getPanBounds(
  layout: SalonWallLayout,
  scale: number,
  viewport: SalonWallViewport,
): { min: number; max: number } {
  const safe = safeViewport(viewport);
  const visibleWidth = safe.width / clamp(scale, MIN_SCALE, MAX_FOCUS_SCALE);
  return {
    min: 0,
    max: Math.max(0, sceneWidth(layout) - visibleWidth),
  };
}

export function getPanForIndex(
  layout: SalonWallLayout,
  index: number,
  scale: number,
  viewport: SalonWallViewport,
): number {
  const piece = layout.pieces[index];
  if (!piece) return 0;
  const safe = safeViewport(viewport);
  const safeScale = clamp(
    Number.isFinite(scale) ? scale : 1,
    MIN_SCALE,
    MAX_FOCUS_SCALE,
  );
  const visibleWidth = safe.width / safeScale;
  const bounds = getPanBounds(layout, safeScale, safe);
  return clamp(
    piece.centerX - visibleWidth / 2,
    bounds.min,
    bounds.max,
  );
}

export function getFocusCamera(
  layout: SalonWallLayout,
  index: number,
  viewport: SalonWallViewport,
): SalonWallCamera {
  const piece = layout.pieces[index];
  const safe = safeViewport(viewport);
  if (!piece) {
    return getOverviewCamera(layout, safe);
  }

  const compact = safe.width < 1280;
  const maxWidth = safe.width * (compact ? 0.88 : 0.56);
  const maxHeight = safe.height * (compact ? 0.44 : 0.72);
  const fitScale = Math.min(maxWidth / piece.width, maxHeight / piece.height);
  const usefulMax = piece.mediaWidth
    ? MAX_SOURCE_EDGE / piece.mediaWidth
    : MAX_FOCUS_SCALE;
  const maxZoom = clamp(Math.max(1.2, usefulMax), 1.2, MAX_FOCUS_SCALE);
  const scale = clamp(fitScale, 0.55, maxZoom);
  const focalX = safe.width * (compact ? 0.5 : 0.6);
  const focalY = safe.height * (compact ? 0.27 : 0.48);

  return {
    scale,
    tx: focalX - piece.centerX * scale,
    ty: focalY - piece.centerY * scale,
  };
}

/**
 * Default framing:
 * - Desktop: Overview framing displaying the entire dense, curated salon wall.
 * - Tablet/phone: A closer curated band so artworks remain legible, with full
 *   overview accessible via the header toggle.
 */
export function getDefaultCamera(
  layout: SalonWallLayout,
  viewport: SalonWallViewport,
): SalonWallDefaultCamera {
  const safe = safeViewport(viewport);
  if (safe.width >= 1024) {
    return { mode: "overview" };
  }

  // Fit as much of the vertical hang as possible while still stepping closer
  // than the overview. A phone should see several works, not one giant frame.
  const fitHeightScale = (safe.height * 0.92) / sceneHeight(layout);
  const widthTargetScale =
    safe.width / Math.max(1, sceneWidth(layout) * 0.45);
  const scale = clamp(Math.min(fitHeightScale, widthTargetScale), 0.7, 2.1);
  return {
    mode: "wall",
    scale,
    pan: layout.initialPan ?? 0,
  };
}

export function isOverviewCamera(
  layout: SalonWallLayout,
  camera: SalonWallCamera,
  viewport: SalonWallViewport,
): boolean {
  const overview = getOverviewCamera(layout, viewport);
  return (
    Math.abs(camera.scale - overview.scale) < 0.001 &&
    Math.abs(camera.tx - overview.tx) < 1 &&
    Math.abs(camera.ty - overview.ty) < 1
  );
}
