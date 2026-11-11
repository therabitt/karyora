import type { PublicArtwork } from "@/lib/data/artworks";

/**
 * Pure geometry and art direction for the horizontal Salon Wall.
 *
 * Curated works receive an explicit role and cluster. New published works use
 * a stable slug-based fallback so the wall remains deterministic without
 * requiring a database migration or an admin layout editor.
 */
export type SalonWallRole = "anchor" | "supporting" | "accent";

export interface CameraWallPiece {
  artwork: PublicArtwork;
  index: number;
  numberLabel: string;
  aspect: number;
  clusterId: string;
  role: SalonWallRole;
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

interface CuratedArtworkDirection {
  clusterId: string;
  role: SalonWallRole;
  heightScale: number;
  verticalOffset: number;
  rotation: number;
}

interface ResolvedArtworkDirection extends CuratedArtworkDirection {
  curated: boolean;
}

const FALLBACK_ASPECT = 0.72;

const ROLE_HEIGHT_SCALE: Record<SalonWallRole, number> = {
  anchor: 1.12,
  supporting: 0.86,
  accent: 0.7,
};

const ROLE_FRAME_STYLE: Record<
  SalonWallRole,
  { frame: string; mat: string; borderScale: number; matScale: number }
> = {
  anchor: {
    frame: "var(--color-ink)",
    mat: "var(--color-cream)",
    borderScale: 1.08,
    matScale: 1.08,
  },
  supporting: {
    frame: "var(--color-border-strong)",
    mat: "var(--color-surface)",
    borderScale: 0.94,
    matScale: 1,
  },
  accent: {
    frame: "var(--color-terracotta-deep)",
    mat: "var(--color-surface-muted)",
    borderScale: 0.78,
    matScale: 0.82,
  },
};

/**
 * This manifest follows the published artwork order so the visual journey,
 * numeric labels, focus stepping, and legacy ?item= links remain aligned.
 *
 * Clusters are intentionally consecutive. A wider inter-cluster gap creates
 * visual chapters without adding plaques or UI labels to the wall.
 */
const CURATED_WALL_MANIFEST: Record<string, CuratedArtworkDirection> = {
  "mafia-bikini-bottom": {
    clusterId: "arrival",
    role: "anchor",
    heightScale: 1.12,
    verticalOffset: -0.012,
    rotation: -0.12,
  },
  "monochrome-rose": {
    clusterId: "arrival",
    role: "supporting",
    heightScale: 0.84,
    verticalOffset: 0.026,
    rotation: 0.42,
  },
  "moonlit-netrunner": {
    clusterId: "arrival",
    role: "accent",
    heightScale: 0.69,
    verticalOffset: -0.06,
    rotation: -0.62,
  },
  "the-blue-messenger": {
    clusterId: "arrival",
    role: "supporting",
    heightScale: 0.9,
    verticalOffset: 0.018,
    rotation: 0.24,
  },

  "a-distant-moon": {
    clusterId: "nocturnes",
    role: "anchor",
    heightScale: 1.14,
    verticalOffset: -0.026,
    rotation: 0.08,
  },
  "sunlit-melancholy": {
    clusterId: "nocturnes",
    role: "supporting",
    heightScale: 0.88,
    verticalOffset: 0.046,
    rotation: -0.36,
  },
  "pastel-selfie": {
    clusterId: "nocturnes",
    role: "accent",
    heightScale: 0.72,
    verticalOffset: -0.05,
    rotation: 0.58,
  },
  "unleashed-madness": {
    clusterId: "nocturnes",
    role: "anchor",
    heightScale: 1.1,
    verticalOffset: 0.012,
    rotation: -0.1,
  },

  "eyes-on-the-rearview": {
    clusterId: "reflections",
    role: "anchor",
    heightScale: 1.08,
    verticalOffset: -0.022,
    rotation: 0.12,
  },
  "an-elegy-for-innocence": {
    clusterId: "reflections",
    role: "accent",
    heightScale: 0.68,
    verticalOffset: 0.064,
    rotation: -0.66,
  },
  "the-forest-spirits-gaze": {
    clusterId: "reflections",
    role: "supporting",
    heightScale: 0.87,
    verticalOffset: -0.018,
    rotation: 0.34,
  },
  "witch-underworld": {
    clusterId: "reflections",
    role: "accent",
    heightScale: 0.73,
    verticalOffset: 0.044,
    rotation: -0.48,
  },

  lilith: {
    clusterId: "fantasy",
    role: "supporting",
    heightScale: 0.88,
    verticalOffset: 0.03,
    rotation: 0.28,
  },
  frieren: {
    clusterId: "fantasy",
    role: "accent",
    heightScale: 0.7,
    verticalOffset: -0.056,
    rotation: -0.56,
  },
  "solitude-in-crimson": {
    clusterId: "fantasy",
    role: "supporting",
    heightScale: 0.87,
    verticalOffset: 0.042,
    rotation: 0.38,
  },
  "princess-of-fantasy-world": {
    clusterId: "fantasy",
    role: "anchor",
    heightScale: 1.12,
    verticalOffset: -0.012,
    rotation: -0.08,
  },

  "super-woman": {
    clusterId: "figures",
    role: "accent",
    heightScale: 0.7,
    verticalOffset: -0.052,
    rotation: 0.64,
  },
  "butterfly-woman": {
    clusterId: "figures",
    role: "anchor",
    heightScale: 1.12,
    verticalOffset: 0.006,
    rotation: -0.14,
  },
  "desert-woman": {
    clusterId: "figures",
    role: "supporting",
    heightScale: 0.9,
    verticalOffset: 0.038,
    rotation: 0.32,
  },

  girls: {
    clusterId: "portraits",
    role: "anchor",
    heightScale: 1.08,
    verticalOffset: -0.02,
    rotation: 0.1,
  },
  "beautiful-woman": {
    clusterId: "portraits",
    role: "supporting",
    heightScale: 0.86,
    verticalOffset: 0.034,
    rotation: -0.34,
  },
  "beautiful-rythm": {
    clusterId: "portraits",
    role: "accent",
    heightScale: 0.72,
    verticalOffset: -0.044,
    rotation: 0.56,
  },
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveArtworkDirection(
  artwork: PublicArtwork,
): ResolvedArtworkDirection {
  const curated = CURATED_WALL_MANIFEST[artwork.slug];
  if (curated) {
    return { ...curated, curated: true };
  }

  const hash = hashString(artwork.slug || artwork.id);
  const rolePattern: SalonWallRole[] = [
    "supporting",
    "accent",
    "supporting",
    "anchor",
    "supporting",
    "supporting",
    "accent",
    "supporting",
  ];
  const role = rolePattern[hash % rolePattern.length];
  const verticalStep = ((hash >>> 8) % 7) - 3;
  const rotationStep = ((hash >>> 16) % 7) - 3;
  const sizeJitter = 0.96 + ((hash >>> 24) % 7) * 0.015;

  return {
    clusterId: "new-arrivals",
    role,
    heightScale: ROLE_HEIGHT_SCALE[role] * sizeJitter,
    verticalOffset: verticalStep * 0.012,
    rotation: rotationStep * 0.14,
    curated: false,
  };
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
  const safeWidth = Math.max(320, Number.isFinite(stageWidth) ? stageWidth : 320);
  const safeHeight = Math.max(
    320,
    Number.isFinite(stageHeight) ? stageHeight : 320,
  );
  const compact = safeWidth < 1280;
  const padding = safeWidth * (compact ? 0.08 : 0.05);
  const baseHeight = safeHeight * (compact ? 0.37 : 0.55);
  const baseBorder = Math.round(clamp(safeHeight * 0.012, 6, 12));
  const baseMat = Math.round(clamp(safeHeight * 0.022, 10, 24));
  const maxItemWidth = safeWidth * (compact ? 0.76 : 0.5);
  const minTop = safeHeight * 0.055;
  const maxBottom = safeHeight * 0.055;
  const baseGap = compact
    ? clamp(safeHeight * 0.045, 16, 34)
    : clamp(safeHeight * 0.075, 28, 64);
  const clusterGap = safeHeight * (compact ? 0.05 : 0.075);
  const hierarchyGap = baseGap * 0.32;

  const pieces: CameraWallPiece[] = [];
  let cursor = padding;

  artworks.forEach((artwork, index) => {
    const direction = resolveArtworkDirection(artwork);
    const previous = pieces[index - 1];

    if (previous) {
      const sameCluster = previous.clusterId === direction.clusterId;
      const roleBreathingRoom =
        sameCluster &&
        (previous.role === "anchor" || direction.role === "anchor")
          ? hierarchyGap
          : 0;
      cursor +=
        baseGap + (sameCluster ? roleBreathingRoom : clusterGap);
    }

    const aspect = getCameraAspectRatio(
      artwork,
      naturalAspects[artwork.id],
    );
    const roleFrame = ROLE_FRAME_STYLE[direction.role];
    const border = Math.max(
      4,
      Math.round(baseBorder * roleFrame.borderScale),
    );
    const mat = Math.max(8, Math.round(baseMat * roleFrame.matScale));
    const framePadding = border + mat;

    let itemHeight = baseHeight * direction.heightScale;
    let mediaHeight = Math.max(1, itemHeight - 2 * framePadding);
    let mediaWidth = mediaHeight * aspect;
    let itemWidth = mediaWidth + 2 * framePadding;

    if (itemWidth > maxItemWidth) {
      itemWidth = maxItemWidth;
      mediaWidth = Math.max(1, itemWidth - 2 * framePadding);
      mediaHeight = mediaWidth / aspect;
      itemHeight = mediaHeight + 2 * framePadding;
    }

    const offset = direction.verticalOffset * safeHeight;
    const idealTop = (safeHeight - itemHeight) / 2 + offset;
    const maxTop = Math.max(minTop, safeHeight - itemHeight - maxBottom);
    const top = clamp(idealTop, minTop, maxTop);

    pieces.push({
      artwork,
      index,
      numberLabel: String(index + 1).padStart(2, "0"),
      aspect,
      clusterId: direction.clusterId,
      role: direction.role,
      left: cursor,
      top,
      width: itemWidth,
      height: itemHeight,
      mediaWidth,
      mediaHeight,
      border,
      mat,
      rotation: direction.rotation,
      frameColor: roleFrame.frame,
      matColor: roleFrame.mat,
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
