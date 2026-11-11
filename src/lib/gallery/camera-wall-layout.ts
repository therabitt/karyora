import type { PublicArtwork } from "@/lib/data/artworks";

/**
 * Pure geometry and art direction for the horizontal Salon Wall.
 *
 * The camera travels horizontally through one continuous scene, while the
 * artwork itself is hung across several vertical bands. Curated positions
 * create asymmetrical clusters instead of a single strip of frames.
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
  centerY: number;
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
 * Positions are normalized vertical frame-centres, not small offsets from a
 * shared centre line. Each chapter deliberately uses upper, middle, and lower
 * placements so the wall reads as a salon hang when viewed at normal scale.
 *
 * The manifest follows published order to preserve labels, focus stepping,
 * and the legacy ?item= mapping.
 */
const CURATED_WALL_MANIFEST: Record<string, CuratedArtworkDirection> = {
  "mafia-bikini-bottom": {
    clusterId: "arrival",
    role: "anchor",
    heightScale: 1.12,
    centerY: 0.43,
    rotation: -0.35,
  },
  "monochrome-rose": {
    clusterId: "arrival",
    role: "supporting",
    heightScale: 0.84,
    centerY: 0.73,
    rotation: 0.95,
  },
  "moonlit-netrunner": {
    clusterId: "arrival",
    role: "accent",
    heightScale: 0.69,
    centerY: 0.23,
    rotation: -1.2,
  },
  "the-blue-messenger": {
    clusterId: "arrival",
    role: "supporting",
    heightScale: 0.9,
    centerY: 0.56,
    rotation: 0.55,
  },

  "a-distant-moon": {
    clusterId: "nocturnes",
    role: "anchor",
    heightScale: 1.14,
    centerY: 0.58,
    rotation: 0.25,
  },
  "sunlit-melancholy": {
    clusterId: "nocturnes",
    role: "supporting",
    heightScale: 0.88,
    centerY: 0.25,
    rotation: -0.85,
  },
  "pastel-selfie": {
    clusterId: "nocturnes",
    role: "accent",
    heightScale: 0.72,
    centerY: 0.78,
    rotation: 1.15,
  },
  "unleashed-madness": {
    clusterId: "nocturnes",
    role: "anchor",
    heightScale: 1.1,
    centerY: 0.38,
    rotation: -0.3,
  },

  "eyes-on-the-rearview": {
    clusterId: "reflections",
    role: "anchor",
    heightScale: 1.08,
    centerY: 0.42,
    rotation: 0.3,
  },
  "an-elegy-for-innocence": {
    clusterId: "reflections",
    role: "accent",
    heightScale: 0.68,
    centerY: 0.78,
    rotation: -1.25,
  },
  "the-forest-spirits-gaze": {
    clusterId: "reflections",
    role: "supporting",
    heightScale: 0.87,
    centerY: 0.24,
    rotation: 0.8,
  },
  "witch-underworld": {
    clusterId: "reflections",
    role: "accent",
    heightScale: 0.73,
    centerY: 0.61,
    rotation: -0.95,
  },

  lilith: {
    clusterId: "fantasy",
    role: "supporting",
    heightScale: 0.88,
    centerY: 0.72,
    rotation: 0.7,
  },
  frieren: {
    clusterId: "fantasy",
    role: "accent",
    heightScale: 0.7,
    centerY: 0.22,
    rotation: -1.1,
  },
  "solitude-in-crimson": {
    clusterId: "fantasy",
    role: "supporting",
    heightScale: 0.87,
    centerY: 0.48,
    rotation: 1.05,
  },
  "princess-of-fantasy-world": {
    clusterId: "fantasy",
    role: "anchor",
    heightScale: 1.12,
    centerY: 0.39,
    rotation: -0.25,
  },

  "super-woman": {
    clusterId: "figures",
    role: "accent",
    heightScale: 0.7,
    centerY: 0.25,
    rotation: 1.2,
  },
  "butterfly-woman": {
    clusterId: "figures",
    role: "anchor",
    heightScale: 1.12,
    centerY: 0.59,
    rotation: -0.4,
  },
  "desert-woman": {
    clusterId: "figures",
    role: "supporting",
    heightScale: 0.9,
    centerY: 0.74,
    rotation: 0.8,
  },

  girls: {
    clusterId: "portraits",
    role: "anchor",
    heightScale: 1.08,
    centerY: 0.43,
    rotation: 0.25,
  },
  "beautiful-woman": {
    clusterId: "portraits",
    role: "supporting",
    heightScale: 0.86,
    centerY: 0.72,
    rotation: -0.85,
  },
  "beautiful-rythm": {
    clusterId: "portraits",
    role: "accent",
    heightScale: 0.72,
    centerY: 0.22,
    rotation: 1.1,
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
  const verticalPositions: Record<SalonWallRole, number[]> = {
    anchor: [0.38, 0.48, 0.62],
    supporting: [0.24, 0.38, 0.52, 0.66, 0.76],
    accent: [0.2, 0.34, 0.66, 0.8],
  };
  const positionPattern = verticalPositions[role];
  const rotationStep = ((hash >>> 16) % 9) - 4;
  const sizeJitter = 0.96 + ((hash >>> 24) % 7) * 0.015;

  return {
    clusterId: "new-arrivals",
    role,
    heightScale: ROLE_HEIGHT_SCALE[role] * sizeJitter,
    centerY: positionPattern[(hash >>> 8) % positionPattern.length],
    rotation: rotationStep * 0.28,
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
  const safeWidth = Math.max(
    320,
    Number.isFinite(stageWidth) ? stageWidth : 320,
  );
  const safeHeight = Math.max(
    320,
    Number.isFinite(stageHeight) ? stageHeight : 320,
  );
  const compact = safeWidth < 1280;
  const padding = safeWidth * (compact ? 0.08 : 0.05);
  const baseHeight = safeHeight * (compact ? 0.39 : 0.47);
  const baseBorder = Math.round(clamp(safeHeight * 0.012, 6, 12));
  const baseMat = Math.round(clamp(safeHeight * 0.022, 10, 24));
  const maxItemWidth = safeWidth * (compact ? 0.76 : 0.5);
  const minTop = safeHeight * 0.06;
  const maxBottom = safeHeight * 0.06;
  const baseGap = compact
    ? clamp(safeHeight * 0.04, 22, 36)
    : clamp(safeHeight * 0.05, 34, 58);
  const clusterGap = safeHeight * (compact ? 0.11 : 0.12);
  const hierarchyGap = baseGap * 0.38;

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
      cursor += baseGap + (sameCluster ? roleBreathingRoom : clusterGap);
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

    const desiredCenterY = direction.centerY * safeHeight;
    const minCenterY = minTop + itemHeight / 2;
    const maxCenterY = safeHeight - maxBottom - itemHeight / 2;
    const centerY = clamp(
      desiredCenterY,
      minCenterY,
      Math.max(minCenterY, maxCenterY),
    );
    const top = centerY - itemHeight / 2;

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
      centerY,
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
