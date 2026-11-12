import type { PublicArtwork } from "@/lib/data/artworks";

/**
 * Pure geometry and art direction for The Salon Wall.
 *
 * The wall is composed as a curated museum salon hang: three horizontal
 * registers (upper, eye-level, lower), grouped into tight clusters, with
 * anchors, supporting works, and accents. Positions are derived from the
 * actual collection, so the composition keeps working when the collection
 * changes. A small override table can pin an editorial role for a known work;
 * missing overrides are harmless.
 *
 * No database fields, no persisted coordinates, no random values.
 */

export type SalonWallRole = "anchor" | "supporting" | "accent";

export type SalonWallFrameStyle =
  | "antiqueGold"
  | "darkWalnut"
  | "blackLacquer"
  | "naturalOak"
  | "galleryIron"
  | "floaterCanvas"
  | "terracotta";

export interface SalonWallFrameDefinition {
  frame: string;
  mat: string;
  borderScale: number;
  matScale: number;
  hasMat: boolean;
}

export const SALON_WALL_FRAMES: Record<
  SalonWallFrameStyle,
  SalonWallFrameDefinition
> = {
  antiqueGold: {
    frame: "#967A44",
    mat: "#F7F3E9",
    borderScale: 1.22,
    matScale: 0,
    hasMat: false,
  },
  darkWalnut: {
    frame: "#34251B",
    mat: "#EFEBE2",
    borderScale: 1.16,
    matScale: 0,
    hasMat: false,
  },
  blackLacquer: {
    frame: "#181514",
    mat: "#F4F0E8",
    borderScale: 1.1,
    matScale: 1.1,
    hasMat: true,
  },
  naturalOak: {
    frame: "#8C6D4F",
    mat: "#FAF7F2",
    borderScale: 0.96,
    matScale: 1,
    hasMat: true,
  },
  galleryIron: {
    frame: "#24211F",
    mat: "#FCFAF6",
    borderScale: 0.84,
    matScale: 0.88,
    hasMat: true,
  },
  floaterCanvas: {
    frame: "#1C1917",
    mat: "#12100E",
    borderScale: 0.9,
    matScale: 0,
    hasMat: false,
  },
  terracotta: {
    frame: "#8A3D28",
    mat: "#F9F5EE",
    borderScale: 0.92,
    matScale: 0,
    hasMat: false,
  },
};

export interface SalonWallPiece {
  artwork: PublicArtwork;
  /** Position in the source collection, used for the legacy `?item=` link. */
  sourceIndex: number;
  /** Position in the visual reading order (top row first, then left to right). */
  readingOrder: number;
  /** 1-based label shown in the cartellino and caption. */
  numberLabel: string;
  aspect: number;
  clusterId: string;
  role: SalonWallRole;
  row: number;
  left: number;
  top: number;
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
  border: number;
  mat: number;
  hasMat: boolean;
  rotation: number;
  frameColor: string;
  matColor: string;
  frameStyleKey: SalonWallFrameStyle;
  centerX: number;
  centerY: number;
}

export interface SalonWallLayout {
  /** Pieces in visual reading order. */
  pieces: SalonWallPiece[];
  sceneWidth: number;
  sceneHeight: number;
  stageWidth: number;
  stageHeight: number;
  rowCount: number;
  wallLeft: number;
  wallRight: number;
  wallTop: number;
  wallBottom: number;
  initialPan: number;
}

export interface SalonWallOptions {
  stageWidth: number;
  stageHeight: number;
  naturalAspects?: Record<string, number>;
}

/**
 * Editorial overrides. These are deliberately optional and sparse: the wall
 * must look composed without them. Add a slug only when a specific work should
 * be pushed to a role or size for curation.
 */
export interface SalonWallOverride {
  slug: string;
  role?: SalonWallRole;
  /** Multiplier on the role height, clamped to the register. */
  heightScale?: number;
}

export const SALON_WALL_OVERRIDES: readonly SalonWallOverride[] = [];

const FALLBACK_ASPECT = 0.72;
const DESIGN_STAGE_WIDTH = 1440;
const DESIGN_STAGE_HEIGHT = 900;

const ROLE_HEIGHT: Record<SalonWallRole, number> = {
  anchor: 0.94,
  supporting: 0.72,
  accent: 0.52,
};

const FRAME_BY_ROLE: Record<SalonWallRole, readonly SalonWallFrameStyle[]> = {
  anchor: ["antiqueGold", "darkWalnut", "floaterCanvas"],
  supporting: ["naturalOak", "blackLacquer", "terracotta"],
  accent: ["galleryIron", "naturalOak", "blackLacquer"],
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

export function getSalonWallAspect(
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

function resolveSizeScale(stageWidth: number, stageHeight: number): number {
  const widthScale = Math.max(stageWidth, 1) / DESIGN_STAGE_WIDTH;
  const heightScale = Math.max(stageHeight, 1) / DESIGN_STAGE_HEIGHT;
  return clamp(Math.sqrt(widthScale * heightScale), 0.55, 1.15);
}

function resolveRowCount(count: number): number {
  if (count <= 6) return 1;
  if (count <= 12) return 2;
  return 3;
}

interface Candidate {
  artwork: PublicArtwork;
  sourceIndex: number;
  aspect: number;
  hash: number;
  role: SalonWallRole;
  heightScale: number;
  frameStyle: SalonWallFrameStyle;
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
  border: number;
  mat: number;
  hasMat: boolean;
  left: number;
  top: number;
  clusterId: string;
}

interface RowState {
  items: Candidate[];
  width: number;
  anchors: number;
  supporting: number;
}

function pickFrame(
  role: SalonWallRole,
  hash: number,
): SalonWallFrameStyle {
  const options = FRAME_BY_ROLE[role];
  return options[hash % options.length];
}

function measureCandidate(
  candidate: Candidate,
  role: SalonWallRole,
  heightBase: number,
  sizeScale: number,
): {
  role: SalonWallRole;
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
  border: number;
  mat: number;
  hasMat: boolean;
  frameStyle: SalonWallFrameStyle;
} {
  const frameStyle = pickFrame(role, candidate.hash);
  const frame = SALON_WALL_FRAMES[frameStyle];
  const border = Math.max(
    3,
    Math.round(clamp(5.5 * sizeScale, 3, 7) * frame.borderScale),
  );
  const mat = frame.hasMat
    ? Math.max(6, Math.round(clamp(11 * sizeScale, 6, 13) * frame.matScale))
    : 0;
  const framePadding = border + mat;
  const requestedHeight = Math.round(
    heightBase * ROLE_HEIGHT[role] * candidate.heightScale,
  );
  const height = Math.max(
    framePadding * 2 + 12,
    Math.min(requestedHeight, Math.round(heightBase)),
  );
  const mediaHeight = Math.max(1, height - framePadding * 2);
  const mediaWidth = Math.max(1, Math.round(mediaHeight * candidate.aspect));
  return {
    role,
    width: mediaWidth + framePadding * 2,
    height,
    mediaWidth,
    mediaHeight,
    border,
    mat,
    hasMat: frame.hasMat,
    frameStyle,
  };
}

function estimateWidth(
  aspect: number,
  role: SalonWallRole,
  heightBase: number,
  heightScale: number,
  sizeScale: number,
): number {
  const frame = pickFrame(role, 0);
  const definition = SALON_WALL_FRAMES[frame];
  const border = Math.max(
    3,
    Math.round(clamp(5.5 * sizeScale, 3, 7) * definition.borderScale),
  );
  const mat = definition.hasMat
    ? Math.max(
        6,
        Math.round(clamp(11 * sizeScale, 6, 13) * definition.matScale),
      )
    : 0;
  const height = heightBase * ROLE_HEIGHT[role] * heightScale;
  const mediaHeight = Math.max(1, height - (border + mat) * 2);
  return mediaWidthFor(mediaHeight, aspect) + (border + mat) * 2;
}

function mediaWidthFor(mediaHeight: number, aspect: number): number {
  return Math.max(1, Math.round(mediaHeight * aspect));
}

/**
 * Interleave roles so a row does not read as three blocks of big, medium and
 * small works. Anchor works are spaced through the row rather than clustered at
 * the left edge.
 */
function arrangeRow(items: Candidate[]): Candidate[] {
  const buckets: Record<SalonWallRole, Candidate[]> = {
    anchor: [],
    supporting: [],
    accent: [],
  };
  for (const item of items) buckets[item.role].push(item);

  const pattern: SalonWallRole[] = [
    "anchor",
    "accent",
    "supporting",
    "accent",
    "supporting",
  ];
  const arranged: Candidate[] = [];
  while (arranged.length < items.length) {
    let placedAny = false;
    for (const role of pattern) {
      const next = buckets[role].shift();
      if (next) {
        arranged.push(next);
        placedAny = true;
      }
    }
    if (!placedAny) break;
  }
  return arranged;
}

function clusterSizes(count: number): number[] {
  if (count <= 0) return [];
  if (count <= 3) return [count];
  const sizes: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    if (remaining === 4) {
      sizes.push(2, 2);
      break;
    }
    if (remaining === 1 && sizes.length > 0) {
      sizes[sizes.length - 1] += 1;
      break;
    }
    const size = Math.min(3, remaining);
    sizes.push(size);
    remaining -= size;
  }
  return sizes;
}

function safeStage(stageWidth: number, stageHeight: number): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(320, Number.isFinite(stageWidth) ? stageWidth : 320),
    height: Math.max(320, Number.isFinite(stageHeight) ? stageHeight : 320),
  };
}

export function buildSalonWallLayout(
  artworks: PublicArtwork[],
  { stageWidth, stageHeight, naturalAspects = {} }: SalonWallOptions,
): SalonWallLayout {
  const stage = safeStage(stageWidth, stageHeight);
  const sizeScale = resolveSizeScale(stage.width, stage.height);
  const rowCount = resolveRowCount(artworks.length);
  const overrides = new Map(
    SALON_WALL_OVERRIDES.map((override) => [override.slug, override]),
  );

  const rowGap = Math.round(clamp(24 * sizeScale, 12, 30));
  const paddingX = Math.round(clamp(36 * sizeScale, 16, 44));
  const paddingY = Math.round(clamp(20 * sizeScale, 12, 28));
  const baseRegisterHeight =
    rowCount === 1
      ? 250 * sizeScale
      : rowCount === 2
        ? 225 * sizeScale
        : 205 * sizeScale;
  const maximumContentHeight = stage.height - paddingY * 2;
  const fittedRegisterHeight =
    (maximumContentHeight - rowGap * (rowCount - 1)) / rowCount;
  const registerHeight = Math.max(
    74 * sizeScale,
    Math.min(baseRegisterHeight, fittedRegisterHeight),
  );
  const contentHeight =
    registerHeight * rowCount + rowGap * (rowCount - 1);
  const wallTop = Math.max(0, Math.round((stage.height - contentHeight) / 2));
  const wallBottom = Math.round(wallTop + contentHeight);

  const rows: RowState[] = Array.from({ length: rowCount }, () => ({
    items: [],
    width: 0,
    anchors: 0,
    supporting: 0,
  }));

  const candidates: Candidate[] = artworks.map((artwork, sourceIndex) => {
    const aspect = getSalonWallAspect(artwork, naturalAspects[artwork.id]);
    const override = overrides.get(artwork.slug);
    return {
      artwork,
      sourceIndex,
      aspect,
      hash: hashString(artwork.slug || artwork.id),
      role: override?.role ?? "supporting",
      heightScale: override?.heightScale ?? 1,
      frameStyle: "naturalOak",
      width: 0,
      height: 0,
      mediaWidth: 0,
      mediaHeight: 0,
      border: 3,
      mat: 0,
      hasMat: false,
      left: 0,
      top: 0,
      clusterId: "",
    };
  });

  // Wide works first: they are the natural anchors, and the least-width row
  // assignment keeps the three registers reasonably balanced.
  const ordered = [...candidates].sort(
    (a, b) => b.aspect - a.aspect || a.sourceIndex - b.sourceIndex,
  );

  const anchorTarget = Math.max(1, Math.round(artworks.length * 0.26));
  const supportingTarget = Math.max(0, Math.round(artworks.length * 0.42));
  let anchors = 0;
  let supporting = 0;

  for (const candidate of ordered) {
    const override = overrides.get(candidate.artwork.slug);
    let role: SalonWallRole;
    if (override?.role) {
      role = override.role;
    } else if (
      anchors < anchorTarget &&
      (candidate.aspect >= 0.92 ||
        rows.some((row) => row.anchors === 0))
    ) {
      role = "anchor";
    } else if (supporting < supportingTarget) {
      role = "supporting";
    } else {
      role = "accent";
    }

    const estimate = estimateWidth(
      candidate.aspect,
      role,
      registerHeight,
      candidate.heightScale,
      sizeScale,
    );

    // An anchor should prefer a register that does not have one yet. After
    // that, choose the row with the least estimated width.
    let targetRow = 0;
    let targetScore = Number.POSITIVE_INFINITY;
    const needsAnchor = role === "anchor";
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (needsAnchor && row.anchors > 0) {
        const rowsWithoutAnchor = rows.some((entry) => entry.anchors === 0);
        if (rowsWithoutAnchor) continue;
      }
      const score = row.width + estimate;
      if (score < targetScore) {
        targetScore = score;
        targetRow = index;
      }
    }

    const measured = measureCandidate(
      candidate,
      role,
      registerHeight,
      sizeScale,
    );
    candidate.role = measured.role;
    candidate.width = measured.width;
    candidate.height = measured.height;
    candidate.mediaWidth = measured.mediaWidth;
    candidate.mediaHeight = measured.mediaHeight;
    candidate.border = measured.border;
    candidate.mat = measured.mat;
    candidate.hasMat = measured.hasMat;
    candidate.frameStyle = measured.frameStyle;
    rows[targetRow].items.push(candidate);
    rows[targetRow].width += measured.width + 10;
    if (role === "anchor") {
      anchors += 1;
      rows[targetRow].anchors += 1;
    } else if (role === "supporting") {
      supporting += 1;
      rows[targetRow].supporting += 1;
    }
  }

  // A row with no anchor reads as a supporting row next to an anchor row.
  // Promote its most horizontal work so every register has a focal point.
  for (const row of rows) {
    if (row.anchors > 0 || row.items.length === 0) continue;
    const widest = [...row.items].sort(
      (a, b) => b.aspect - a.aspect || a.sourceIndex - b.sourceIndex,
    )[0];
    const measured = measureCandidate(
      widest,
      "anchor",
      registerHeight,
      sizeScale,
    );
    widest.role = "anchor";
    widest.width = measured.width;
    widest.height = measured.height;
    widest.mediaWidth = measured.mediaWidth;
    widest.mediaHeight = measured.mediaHeight;
    widest.border = measured.border;
    widest.mat = measured.mat;
    widest.hasMat = measured.hasMat;
    widest.frameStyle = measured.frameStyle;
    row.anchors += 1;
  }

  const innerGap = Math.round(clamp(14 * sizeScale, 8, 18));
  const clusterGap = Math.round(clamp(52 * sizeScale, 28, 64));
  const stagger = Math.round(clamp(22 * sizeScale, 10, 28));

  interface PlacedRow {
    pieces: Candidate[];
    width: number;
    top: number;
  }

  const placedRows: PlacedRow[] = rows.map((row, rowIndex) => {
    const arranged = arrangeRow(row.items);
    const sizes = clusterSizes(arranged.length);
    let cursor = 0;
    let itemIndex = 0;
    let clusterIndex = 0;

    for (const clusterSize of sizes) {
      const clusterItems = arranged.slice(itemIndex, itemIndex + clusterSize);
      itemIndex += clusterSize;
      const clusterId = `salon-${rowIndex + 1}-${clusterIndex + 1}`;
      const clusterHeight = Math.max(
        0,
        ...clusterItems.map((item) => item.height),
      );
      const alignTop = (rowIndex + clusterIndex) % 2 === 0;
      const clusterTop =
        wallTop +
        rowIndex * (registerHeight + rowGap) +
        Math.max(0, (registerHeight - clusterHeight) / 2);

      let clusterCursor = cursor;
      for (const item of clusterItems) {
        const jitter =
          item.role === "anchor" ? 0 : ((item.hash % 5) - 2) * 0.006 * registerHeight;
        const desiredTop = alignTop
          ? clusterTop
          : clusterTop + (clusterHeight - item.height) / 2;
        const top = clamp(
          Math.round(desiredTop + jitter),
          Math.round(wallTop + rowIndex * (registerHeight + rowGap)),
          Math.round(
            wallTop +
              rowIndex * (registerHeight + rowGap) +
              registerHeight -
              item.height,
          ),
        );
        item.left = clusterCursor;
        item.top = top;
        item.clusterId = clusterId;
        clusterCursor += item.width + innerGap;
      }
      cursor = clusterCursor - innerGap + clusterGap;
      clusterIndex += 1;
    }

    return {
      pieces: arranged,
      width: Math.max(0, cursor - clusterGap),
      top: wallTop + rowIndex * (registerHeight + rowGap),
    };
  });

  const maxRowWidth = Math.max(
    1,
    ...placedRows.map((row) => Math.round(row.width)),
  );
  const wallLeft = paddingX;
  const wallRight = wallLeft + maxRowWidth;
  const sceneWidth = wallRight + paddingX;

  // The scene is content-only. The camera centers it vertically in the stage,
  // which lets mobile step closer without clipping the upper/lower registers.
  const sceneHeight = Math.max(1, wallBottom - wallTop);

  const pieces: SalonWallPiece[] = [];
  placedRows.forEach((row, rowIndex) => {
    const slack = Math.max(0, maxRowWidth - row.width);
    const staggerOffset =
      rowIndex === 1 ? Math.min(stagger, Math.round(slack / 2)) : 0;
    const rowOffset =
      wallLeft + Math.round(slack / 2) + staggerOffset;
    for (const item of row.pieces) {
      const left = Math.round(item.left + rowOffset);
      const top = Math.round(item.top - wallTop);
      pieces.push({
        artwork: item.artwork,
        sourceIndex: item.sourceIndex,
        readingOrder: 0,
        numberLabel: "",
        aspect: item.aspect,
        clusterId: item.clusterId,
        role: item.role,
        row: rowIndex,
        left,
        top,
        width: item.width,
        height: item.height,
        mediaWidth: item.mediaWidth,
        mediaHeight: item.mediaHeight,
        border: item.border,
        mat: item.mat,
        hasMat: item.hasMat,
        rotation:
          item.role === "anchor"
            ? 0
            : ((item.hash % 5) - 2) * 0.05,
        frameColor: SALON_WALL_FRAMES[item.frameStyle].frame,
        matColor: SALON_WALL_FRAMES[item.frameStyle].mat,
        frameStyleKey: item.frameStyle,
        centerX: Math.round(left + item.width / 2),
        centerY: Math.round(top + item.height / 2),
      });
    }
  });

  pieces.sort((a, b) => a.row - b.row || a.left - b.left);
  pieces.forEach((piece, index) => {
    piece.readingOrder = index;
    piece.numberLabel = String(index + 1).padStart(2, "0");
  });

  return {
    pieces,
    sceneWidth,
    sceneHeight,
    stageWidth: stage.width,
    stageHeight: stage.height,
    rowCount,
    wallLeft,
    wallRight,
    wallTop: 0,
    wallBottom: sceneHeight,
    initialPan: 0,
  };
}
