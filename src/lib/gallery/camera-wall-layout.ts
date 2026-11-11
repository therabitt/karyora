import type { PublicArtwork } from "@/lib/data/artworks";

/**
 * Pure geometry for the horizontal camera wall.
 *
 * The wall is one continuous row in scene coordinates. The camera later pans
 * over this scene and zooms into a single frame. Keeping the math independent
 * of React makes the composition and camera targets testable.
 */

export interface CameraWallPiece {
  artwork: PublicArtwork;
  index: number;
  numberLabel: string;
  aspect: number;
  left: number;
  top: number;
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
  border: number;
  mat: number;
  rotation: number;
  frameColor: string;
  matColor: string;
  centerX: number;
  centerY: number;
}

export interface CameraWallLayout {
  pieces: CameraWallPiece[];
  sceneWidth: number;
  stageWidth: number;
  stageHeight: number;
  panMin: number;
  panMax: number;
  initialPan: number;
}

export interface CameraWallOptions {
  stageWidth: number;
  stageHeight: number;
  naturalAspects?: Record<string, number>;
}

export interface CameraTransform {
  scale: number;
  tx: number;
  ty: number;
}

const FALLBACK_ASPECT = 0.72;

const FRAME_STYLES = [
  { frame: "var(--color-ink)", mat: "var(--color-cream)" },
  { frame: "var(--color-terracotta-deep)", mat: "var(--color-surface)" },
  { frame: "var(--color-border-strong)", mat: "var(--color-cream)" },
] as const;

const HEIGHT_SCALES = [1, 0.86, 1.08, 0.94, 0.8, 1.04, 0.9, 1.12, 0.98, 0.84, 1.06, 0.92];
const OFFSETS = [-0.035, 0.02, -0.012, 0.045, 0.008, -0.028];
const ROTATIONS = [-0.7, 0.45, -0.3, 0.65, -0.5, 0.3];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getCameraAspectRatio(
  artwork: PublicArtwork,
  naturalAspect?: number,
): number {
  const width = artwork.image_width;
  const height = artwork.image_height;
  if (width && height && width > 0 && height > 0) {
    return width / height;
  }
  if (naturalAspect && Number.isFinite(naturalAspect) && naturalAspect > 0) {
    return naturalAspect;
  }
  return FALLBACK_ASPECT;
}

export function buildCameraWallLayout(
  artworks: PublicArtwork[],
  {
    stageWidth,
    stageHeight,
    naturalAspects = {},
  }: CameraWallOptions,
): CameraWallLayout {
  const safeWidth = Math.max(320, stageWidth);
  const safeHeight = Math.max(320, stageHeight);
  const compact = safeWidth < 1280;
  const padding = safeWidth * (compact ? 0.08 : 0.05);
  const baseHeight = safeHeight * (compact ? 0.38 : 0.58);
  const border = Math.round(clamp(6, safeHeight * 0.012, 12));
  const mat = Math.round(clamp(10, safeHeight * 0.022, 24));
  const framePadding = border + mat;
  const maxItemWidth = safeWidth * (compact ? 0.76 : 0.5);
  const minTop = safeHeight * 0.055;
  const maxBottom = safeHeight * 0.055;
  const baseGap = compact
    ? clamp(16, safeHeight * 0.045, 34)
    : clamp(28, safeHeight * 0.08, 76);
  const groupGap = compact ? safeHeight * 0.03 : safeHeight * 0.045;

  const pieces: CameraWallPiece[] = [];
  let cursor = padding;

  artworks.forEach((artwork, index) => {
    if (index > 0) {
      cursor += baseGap + (index % 4 === 0 ? groupGap : 0);
    }

    const aspect = getCameraAspectRatio(
      artwork,
      naturalAspects[artwork.id],
    );
    const scale = HEIGHT_SCALES[index % HEIGHT_SCALES.length];
    let itemHeight = baseHeight * scale;
    let mediaHeight = itemHeight - 2 * framePadding;
    let mediaWidth = mediaHeight * aspect;
    let itemWidth = mediaWidth + 2 * framePadding;

    if (itemWidth > maxItemWidth) {
      itemWidth = maxItemWidth;
      mediaWidth = itemWidth - 2 * framePadding;
      mediaHeight = mediaWidth / aspect;
      itemHeight = mediaHeight + 2 * framePadding;
    }

    const offset = OFFSETS[index % OFFSETS.length] * safeHeight;
    const idealTop = (safeHeight - itemHeight) / 2 + offset;
    const top = clamp(idealTop, minTop, safeHeight - itemHeight - maxBottom);
    const frame = FRAME_STYLES[index % FRAME_STYLES.length];

    pieces.push({
      artwork,
      index,
      numberLabel: String(index + 1).padStart(2, "0"),
      aspect,
      left: cursor,
      top,
      width: itemWidth,
      height: itemHeight,
      mediaWidth,
      mediaHeight,
      border,
      mat,
      rotation: ROTATIONS[index % ROTATIONS.length],
      frameColor: frame.frame,
      matColor: frame.mat,
      centerX: cursor + itemWidth / 2,
      centerY: top + itemHeight / 2,
    });

    cursor += itemWidth;
  });

  const sceneWidth = cursor + padding;
  const panMin = 0;
  const panMax = Math.max(0, sceneWidth - safeWidth);

  return {
    pieces,
    sceneWidth,
    stageWidth: safeWidth,
    stageHeight: safeHeight,
    panMin,
    panMax,
    initialPan: panMin,
  };
}

export function getWallCamera(
  layout: CameraWallLayout,
  pan: number,
): CameraTransform & { pan: number } {
  const clampedPan = clamp(pan, layout.panMin, layout.panMax);
  return {
    pan: clampedPan,
    scale: 1,
    tx: -clampedPan,
    ty: 0,
  };
}

export function getFocusCamera(
  layout: CameraWallLayout,
  index: number,
): CameraTransform {
  const piece = layout.pieces[index];
  if (!piece) {
    return { scale: 1, tx: -layout.initialPan, ty: 0 };
  }

  const compact = layout.stageWidth < 1280;
  const maxWidth = layout.stageWidth * (compact ? 0.9 : 0.56);
  const maxHeight = layout.stageHeight * (compact ? 0.48 : 0.76);
  const scale = clamp(
    Math.min(maxWidth / piece.width, maxHeight / piece.height),
    1.02,
    3.2,
  );
  const focalX = layout.stageWidth * (compact ? 0.5 : 0.59);
  const focalY = layout.stageHeight * (compact ? 0.26 : 0.46);

  return {
    scale,
    tx: focalX - piece.centerX * scale,
    ty: focalY - piece.centerY * scale,
  };
}

export function getPanForIndex(
  layout: CameraWallLayout,
  index: number,
): number {
  const piece = layout.pieces[index];
  if (!piece) return layout.initialPan;
  return clamp(
    piece.centerX - layout.stageWidth / 2,
    layout.panMin,
    layout.panMax,
  );
}
