import type { PublicArtwork } from "@/lib/data/artworks";

/**
 * Pure geometry and art direction for The Salon Wall.
 *
 * Masterfully curated museum salon hanging:
 * Instead of rigid columns, spreadsheet grids, or isolated floating islands,
 * all 22 artworks are woven into ONE dense, continuous, interlocking salon tapestry.
 * Direct visual inspiration from authentic museum exhibitions:
 * - 3 rich vertical tiers (Upper, Eye-Level Middle, and Lower) with zero empty ceiling/floor bands.
 * - Tight, uniform 20-24px curatorial margins across the entire wall.
 * - Full-bleed fine art framing for oil/digital paintings (antique gold, solid dark walnut,
 *   contemporary floater canvas) and archival cotton-rag mats for graphic noir and works on paper.
 * - Grand horizontal anchors bridging across lower vertical portraits and upper companion works.
 */
export type SalonWallRole = "hero" | "anchor" | "supporting" | "accent";

export type MuseumFrameStyle =
  | "blackLacquer"
  | "naturalOak"
  | "darkWalnut"
  | "antiqueGold"
  | "terracotta"
  | "galleryIron"
  | "floaterCanvas";

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
  hasMat: boolean;
  rotation: number;
  frameColor: string;
  matColor: string;
  frameStyleKey: MuseumFrameStyle;
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

export const MUSEUM_FRAME_DEFINITIONS: Record<
  MuseumFrameStyle,
  { frame: string; mat: string; borderScale: number; matScale: number; className: string }
> = {
  antiqueGold: {
    frame: "#967A44",
    mat: "#F7F3E9",
    borderScale: 1.25,
    matScale: 0,
    className: "frame-antique-gold",
  },
  darkWalnut: {
    frame: "#34251B",
    mat: "#EFEBE2",
    borderScale: 1.18,
    matScale: 0,
    className: "frame-dark-walnut",
  },
  blackLacquer: {
    frame: "#181514",
    mat: "#F4F0E8",
    borderScale: 1.12,
    matScale: 1.1,
    className: "frame-black-lacquer",
  },
  naturalOak: {
    frame: "#8C6D4F",
    mat: "#FAF7F2",
    borderScale: 0.95,
    matScale: 1.0,
    className: "frame-natural-oak",
  },
  galleryIron: {
    frame: "#24211F",
    mat: "#FCFAF6",
    borderScale: 0.82,
    matScale: 0.88,
    className: "frame-gallery-iron",
  },
  floaterCanvas: {
    frame: "#1C1917",
    mat: "#12100E",
    borderScale: 0.9,
    matScale: 0,
    className: "frame-floater-canvas",
  },
  terracotta: {
    frame: "#8A3D28",
    mat: "#F9F5EE",
    borderScale: 0.92,
    matScale: 0,
    className: "frame-terracotta",
  },
};

const FALLBACK_ASPECT = 0.72;

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

interface CuratedPieceConfig {
  slug: string;
  role: SalonWallRole;
  frame: MuseumFrameStyle;
  heightBase: number;
  hasMat: boolean;
  rotation?: number;
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

  const scale = clamp(safeHeight / 760, 0.75, 1.25);
  // Intimate, consistent curatorial gap (no 150px empty deserts!)
  const gap = Math.round(clamp(22 * scale, 16, 26));
  const paddingX = Math.round(safeWidth * (safeWidth < 1024 ? 0.05 : 0.04));

  const baseBorder = Math.round(clamp(safeHeight * 0.007, 4, 8));
  const baseMat = Math.round(clamp(safeHeight * 0.014, 8, 14));

  const artworkBySlug = new Map<string, { artwork: PublicArtwork; index: number }>();
  artworks.forEach((art, index) => {
    artworkBySlug.set(art.slug, { artwork: art, index });
  });

  const pieces: CameraWallPiece[] = new Array(artworks.length);
  const assignedIndices = new Set<number>();

  function measurePiece(
    artwork: PublicArtwork,
    frameKey: MuseumFrameStyle,
    heightBase: number,
    hasMat: boolean,
  ) {
    const aspect = getCameraAspectRatio(artwork, naturalAspects[artwork.id]);
    const frameDef =
      MUSEUM_FRAME_DEFINITIONS[frameKey] || MUSEUM_FRAME_DEFINITIONS.blackLacquer;
    const border = Math.max(3, Math.round(baseBorder * frameDef.borderScale));
    const mat = hasMat ? Math.max(6, Math.round(baseMat * (frameDef.matScale || 1))) : 0;
    const framePadding = border + mat;

    const targetH = Math.round(heightBase * scale);
    const mediaHeight = Math.max(1, targetH - 2 * framePadding);
    const mediaWidth = mediaHeight * aspect;
    const width = mediaWidth + 2 * framePadding;
    const height = mediaHeight + 2 * framePadding;

    return {
      aspect,
      border,
      mat,
      hasMat,
      width,
      height,
      mediaWidth,
      mediaHeight,
      frameDef,
    };
  }

  function commitPiece(
    entry: { artwork: PublicArtwork; index: number },
    cfg: CuratedPieceConfig,
    left: number,
    top: number,
    clusterId: string,
    rotation = 0,
  ) {
    const m = measurePiece(entry.artwork, cfg.frame, cfg.heightBase, cfg.hasMat);
    assignedIndices.add(entry.index);
    pieces[entry.index] = {
      artwork: entry.artwork,
      index: entry.index,
      numberLabel: String(entry.index + 1).padStart(2, "0"),
      aspect: m.aspect,
      clusterId,
      role: cfg.role,
      left: Math.round(left),
      top: Math.round(top),
      width: m.width,
      height: m.height,
      mediaWidth: m.mediaWidth,
      mediaHeight: m.mediaHeight,
      border: m.border,
      mat: m.mat,
      hasMat: cfg.hasMat,
      rotation: rotation || cfg.rotation || 0,
      frameColor: m.frameDef.frame,
      matColor: m.frameDef.mat,
      frameStyleKey: cfg.frame,
      centerX: Math.round(left + m.width / 2),
      centerY: Math.round(top + m.height / 2),
    };
    return { ...m, left: Math.round(left), top: Math.round(top) };
  }

  const wallCenterY = safeHeight * 0.48;
  let cursorX = paddingX;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: Cyberpunk Twilight (Top square, Mid portrait, Side portrait, Bot landscape)
  // Continuous 3-tier hang
  // ──────────────────────────────────────────────────────────────────────────
  {
    const eTop1 = artworkBySlug.get("moonlit-netrunner");
    const eMid1 = artworkBySlug.get("sunlit-melancholy");
    const eSide = artworkBySlug.get("beautiful-rythm");
    const eBot = artworkBySlug.get("the-blue-messenger");

    if (eTop1 && eMid1 && eSide && eBot) {
      const cfgTop1: CuratedPieceConfig = { slug: "moonlit-netrunner", role: "accent", frame: "galleryIron", heightBase: 130, hasMat: true, rotation: -0.2 };
      const cfgMid1: CuratedPieceConfig = { slug: "sunlit-melancholy", role: "supporting", frame: "naturalOak", heightBase: 140, hasMat: true, rotation: 0.2 };
      const cfgSide: CuratedPieceConfig = { slug: "beautiful-rythm", role: "accent", frame: "galleryIron", heightBase: 150, hasMat: true, rotation: -0.2 };
      const cfgBot: CuratedPieceConfig = { slug: "the-blue-messenger", role: "supporting", frame: "floaterCanvas", heightBase: 125, hasMat: false, rotation: 0.1 };

      const mTop1 = measurePiece(eTop1.artwork, cfgTop1.frame, cfgTop1.heightBase, cfgTop1.hasMat);
      const mMid1 = measurePiece(eMid1.artwork, cfgMid1.frame, cfgMid1.heightBase, cfgMid1.hasMat);
      const mSide = measurePiece(eSide.artwork, cfgSide.frame, cfgSide.heightBase, cfgSide.hasMat);
      const mBot = measurePiece(eBot.artwork, cfgBot.frame, cfgBot.heightBase, cfgBot.hasMat);

      const col1W = Math.max(mTop1.width, mMid1.width);
      const topZoneW = col1W + gap + mSide.width;
      const sec1W = Math.max(topZoneW, mBot.width);

      const totalH = mTop1.height + gap + mMid1.height + gap + mBot.height;
      const startY = Math.round(wallCenterY - totalH / 2);

      const top1Left = cursorX + Math.round((col1W - mTop1.width) / 2);
      const top1Top = startY;

      const mid1Left = cursorX + Math.round((col1W - mMid1.width) / 2);
      const mid1Top = top1Top + mTop1.height + gap;

      const sideLeft = cursorX + col1W + gap;
      const sideTop = Math.round(startY + (mTop1.height + gap + mMid1.height - mSide.height) / 2);

      const botLeft = cursorX + Math.round((sec1W - mBot.width) / 2);
      const botTop = mid1Top + mMid1.height + gap;

      commitPiece(eTop1, cfgTop1, top1Left, top1Top, "nocturnes");
      commitPiece(eMid1, cfgMid1, mid1Left, mid1Top, "nocturnes");
      commitPiece(eSide, cfgSide, sideLeft, sideTop, "nocturnes");
      commitPiece(eBot, cfgBot, botLeft, botTop, "nocturnes");

      cursorX += sec1W + gap;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: Twilight Anchor (Center horizontal, Top companion, 2 Bottom portraits)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const eAnchor = artworkBySlug.get("a-distant-moon");
    const eTop = artworkBySlug.get("pastel-selfie");
    const eBot1 = artworkBySlug.get("witch-underworld");
    const eBot2 = artworkBySlug.get("an-elegy-for-innocence");

    if (eAnchor && eTop && eBot1 && eBot2) {
      const cfgAnchor: CuratedPieceConfig = { slug: "a-distant-moon", role: "anchor", frame: "antiqueGold", heightBase: 180, hasMat: false, rotation: 0.1 };
      const cfgTop: CuratedPieceConfig = { slug: "pastel-selfie", role: "supporting", frame: "naturalOak", heightBase: 120, hasMat: true, rotation: -0.2 };
      const cfgBot1: CuratedPieceConfig = { slug: "witch-underworld", role: "supporting", frame: "darkWalnut", heightBase: 140, hasMat: false, rotation: 0.2 };
      const cfgBot2: CuratedPieceConfig = { slug: "an-elegy-for-innocence", role: "accent", frame: "galleryIron", heightBase: 140, hasMat: true, rotation: -0.2 };

      const mAnchor = measurePiece(eAnchor.artwork, cfgAnchor.frame, cfgAnchor.heightBase, cfgAnchor.hasMat);
      const mTop = measurePiece(eTop.artwork, cfgTop.frame, cfgTop.heightBase, cfgTop.hasMat);
      const mBot1 = measurePiece(eBot1.artwork, cfgBot1.frame, cfgBot1.heightBase, cfgBot1.hasMat);
      const mBot2 = measurePiece(eBot2.artwork, cfgBot2.frame, cfgBot2.heightBase, cfgBot2.hasMat);

      const botW = mBot1.width + gap + mBot2.width;
      const sec2W = Math.max(mAnchor.width, mTop.width, botW);

      const anchorTop = Math.round(wallCenterY - mAnchor.height / 2);
      const anchorLeft = cursorX + Math.round((sec2W - mAnchor.width) / 2);

      const topY = anchorTop - gap - mTop.height;
      const topLeft = cursorX + Math.round((sec2W - mTop.width) / 2);

      const botY = anchorTop + mAnchor.height + gap;
      const bot1Left = cursorX + Math.round((sec2W - botW) / 2);
      const bot2Left = bot1Left + mBot1.width + gap;

      commitPiece(eTop, cfgTop, topLeft, topY, "nocturnes");
      commitPiece(eAnchor, cfgAnchor, anchorLeft, anchorTop, "nocturnes");
      commitPiece(eBot1, cfgBot1, bot1Left, botY, "nocturnes");
      commitPiece(eBot2, cfgBot2, bot2Left, botY, "nocturnes");

      cursorX += sec2W + gap;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: Graphic Noir & Modern Irony (Center landscape, Top landscape, 2 Bottom portraits)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const eAnchor = artworkBySlug.get("mafia-bikini-bottom");
    const eTop = artworkBySlug.get("monochrome-rose");
    const eBot1 = artworkBySlug.get("frieren");
    const eBot2 = artworkBySlug.get("lilith");

    if (eAnchor && eTop && eBot1 && eBot2) {
      const cfgAnchor: CuratedPieceConfig = { slug: "mafia-bikini-bottom", role: "anchor", frame: "blackLacquer", heightBase: 180, hasMat: true, rotation: -0.1 };
      const cfgTop: CuratedPieceConfig = { slug: "monochrome-rose", role: "supporting", frame: "blackLacquer", heightBase: 115, hasMat: true, rotation: 0.2 };
      const cfgBot1: CuratedPieceConfig = { slug: "frieren", role: "accent", frame: "galleryIron", heightBase: 135, hasMat: true, rotation: -0.2 };
      const cfgBot2: CuratedPieceConfig = { slug: "lilith", role: "supporting", frame: "naturalOak", heightBase: 135, hasMat: true, rotation: 0.2 };

      const mAnchor = measurePiece(eAnchor.artwork, cfgAnchor.frame, cfgAnchor.heightBase, cfgAnchor.hasMat);
      const mTop = measurePiece(eTop.artwork, cfgTop.frame, cfgTop.heightBase, cfgTop.hasMat);
      const mBot1 = measurePiece(eBot1.artwork, cfgBot1.frame, cfgBot1.heightBase, cfgBot1.hasMat);
      const mBot2 = measurePiece(eBot2.artwork, cfgBot2.frame, cfgBot2.heightBase, cfgBot2.hasMat);

      const botW = mBot1.width + gap + mBot2.width;
      const sec3W = Math.max(mAnchor.width, mTop.width, botW);

      const anchorTop = Math.round(wallCenterY - mAnchor.height / 2);
      const anchorLeft = cursorX + Math.round((sec3W - mAnchor.width) / 2);

      const topY = anchorTop - gap - mTop.height;
      const topLeft = cursorX + Math.round((sec3W - mTop.width) / 2);

      const botY = anchorTop + mAnchor.height + gap;
      const bot1Left = cursorX + Math.round((sec3W - botW) / 2);
      const bot2Left = bot1Left + mBot1.width + gap;

      commitPiece(eTop, cfgTop, topLeft, topY, "noir");
      commitPiece(eAnchor, cfgAnchor, anchorLeft, anchorTop, "noir");
      commitPiece(eBot1, cfgBot1, bot1Left, botY, "noir");
      commitPiece(eBot2, cfgBot2, bot2Left, botY, "noir");

      cursorX += sec3W + gap;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: Sovereign Panorama & Sacred Portraits (Bottom 2.40 panorama, 2 Top portraits)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const ePano = artworkBySlug.get("unleashed-madness");
    const eTop1 = artworkBySlug.get("the-forest-spirits-gaze");
    const eTop2 = artworkBySlug.get("solitude-in-crimson");

    if (ePano && eTop1 && eTop2) {
      const cfgPano: CuratedPieceConfig = { slug: "unleashed-madness", role: "hero", frame: "darkWalnut", heightBase: 170, hasMat: false, rotation: -0.1 };
      const cfgTop1: CuratedPieceConfig = { slug: "the-forest-spirits-gaze", role: "supporting", frame: "antiqueGold", heightBase: 180, hasMat: false, rotation: 0.2 };
      const cfgTop2: CuratedPieceConfig = { slug: "solitude-in-crimson", role: "supporting", frame: "darkWalnut", heightBase: 175, hasMat: false, rotation: -0.2 };

      const mPano = measurePiece(ePano.artwork, cfgPano.frame, cfgPano.heightBase, cfgPano.hasMat);
      const mTop1 = measurePiece(eTop1.artwork, cfgTop1.frame, cfgTop1.heightBase, cfgTop1.hasMat);
      const mTop2 = measurePiece(eTop2.artwork, cfgTop2.frame, cfgTop2.heightBase, cfgTop2.hasMat);

      const topW = mTop1.width + gap + mTop2.width;
      const sec4W = Math.max(mPano.width, topW);

      const totalH = Math.max(mTop1.height, mTop2.height) + gap + mPano.height;
      const startY = Math.round(wallCenterY - totalH / 2);

      const top1Left = cursorX + Math.round((sec4W - topW) / 2);
      const top1Top = startY;

      const top2Left = top1Left + mTop1.width + gap;
      const top2Top = startY + (mTop1.height - mTop2.height);

      const panoLeft = cursorX + Math.round((sec4W - mPano.width) / 2);
      const panoTop = startY + Math.max(mTop1.height, mTop2.height) + gap;

      commitPiece(eTop1, cfgTop1, top1Left, top1Top, "panorama");
      commitPiece(eTop2, cfgTop2, top2Left, top2Top, "panorama");
      commitPiece(ePano, cfgPano, panoLeft, panoTop, "panorama");

      cursorX += sec4W + gap;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: Gilded Legend Masterpiece (Center grand anchor, Top companion, Bottom companion)
  // Completely fills all 3 tiers!
  // ──────────────────────────────────────────────────────────────────────────
  {
    const eCenter = artworkBySlug.get("princess-of-fantasy-world");
    const eTop = artworkBySlug.get("girls");
    const eBot = artworkBySlug.get("super-woman");

    if (eCenter && eTop && eBot) {
      const cfgCenter: CuratedPieceConfig = { slug: "princess-of-fantasy-world", role: "hero", frame: "antiqueGold", heightBase: 190, hasMat: false, rotation: 0.1 };
      const cfgTop: CuratedPieceConfig = { slug: "girls", role: "supporting", frame: "floaterCanvas", heightBase: 120, hasMat: false, rotation: -0.1 };
      const cfgBot: CuratedPieceConfig = { slug: "super-woman", role: "supporting", frame: "floaterCanvas", heightBase: 120, hasMat: false, rotation: 0.2 };

      const mCenter = measurePiece(eCenter.artwork, cfgCenter.frame, cfgCenter.heightBase, cfgCenter.hasMat);
      const mTop = measurePiece(eTop.artwork, cfgTop.frame, cfgTop.heightBase, cfgTop.hasMat);
      const mBot = measurePiece(eBot.artwork, cfgBot.frame, cfgBot.heightBase, cfgBot.hasMat);

      const sec5W = Math.max(mCenter.width, mTop.width, mBot.width);

      const centerTop = Math.round(wallCenterY - mCenter.height / 2);
      const centerLeft = cursorX + Math.round((sec5W - mCenter.width) / 2);

      const topY = centerTop - gap - mTop.height;
      const topLeft = cursorX + Math.round((sec5W - mTop.width) / 2);

      const botY = centerTop + mCenter.height + gap;
      const botLeft = cursorX + Math.round((sec5W - mBot.width) / 2);

      commitPiece(eTop, cfgTop, topLeft, topY, "gilded");
      commitPiece(eCenter, cfgCenter, centerLeft, centerTop, "gilded");
      commitPiece(eBot, cfgBot, botLeft, botY, "gilded");

      cursorX += sec5W + gap;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: Desert Twilight & Human Spirit (Tall portrait anchor, 2 stacked landscapes, closing portrait)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const eAnchor = artworkBySlug.get("butterfly-woman");
    const eStack1 = artworkBySlug.get("eyes-on-the-rearview");
    const eStack2 = artworkBySlug.get("desert-woman");
    const eClosing = artworkBySlug.get("beautiful-woman");

    if (eAnchor && eStack1 && eStack2 && eClosing) {
      const cfgAnchor: CuratedPieceConfig = { slug: "butterfly-woman", role: "anchor", frame: "darkWalnut", heightBase: 215, hasMat: false, rotation: 0.1 };
      const cfgStack1: CuratedPieceConfig = { slug: "eyes-on-the-rearview", role: "supporting", frame: "blackLacquer", heightBase: 120, hasMat: true, rotation: -0.1 };
      const cfgStack2: CuratedPieceConfig = { slug: "desert-woman", role: "supporting", frame: "antiqueGold", heightBase: 120, hasMat: false, rotation: 0.2 };
      const cfgClosing: CuratedPieceConfig = { slug: "beautiful-woman", role: "supporting", frame: "naturalOak", heightBase: 150, hasMat: true, rotation: -0.2 };

      const mAnchor = measurePiece(eAnchor.artwork, cfgAnchor.frame, cfgAnchor.heightBase, cfgAnchor.hasMat);
      const mStack1 = measurePiece(eStack1.artwork, cfgStack1.frame, cfgStack1.heightBase, cfgStack1.hasMat);
      const mStack2 = measurePiece(eStack2.artwork, cfgStack2.frame, cfgStack2.heightBase, cfgStack2.hasMat);
      const mClosing = measurePiece(eClosing.artwork, cfgClosing.frame, cfgClosing.heightBase, cfgClosing.hasMat);

      const stackW = Math.max(mStack1.width, mStack2.width);
      const sec6W = mAnchor.width + gap + stackW + gap + mClosing.width;

      const anchorLeft = cursorX;
      const anchorTop = Math.round(wallCenterY - mAnchor.height / 2);

      const stackLeft = anchorLeft + mAnchor.width + gap;
      const stackTotalH = mStack1.height + gap + mStack2.height;
      const stackTopY = Math.round(wallCenterY - stackTotalH / 2);

      const closingLeft = stackLeft + stackW + gap;
      const closingTop = Math.round(wallCenterY - mClosing.height / 2);

      commitPiece(eAnchor, cfgAnchor, anchorLeft, anchorTop, "desert");
      commitPiece(eStack1, cfgStack1, stackLeft + Math.round((stackW - mStack1.width) / 2), stackTopY, "desert");
      commitPiece(eStack2, cfgStack2, stackLeft + Math.round((stackW - mStack2.width) / 2), stackTopY + mStack1.height + gap, "desert");
      commitPiece(eClosing, cfgClosing, closingLeft, closingTop, "desert");

      cursorX += sec6W + paddingX;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Museum-quality ensemble fallback for newly published or unassigned artworks
  //
  // Instead of a rigid 2-stacked-column grid, unrecognised artworks are sorted
  // by aspect ratio and grouped into 3–5 piece ensembles that mirror the
  // curated sections above: a horizontal anchor at eye level with companions
  // above and below, panoramas paired with portrait flanks, stacked columns
  // of same-family works, etc. All gaps stay at the uniform `gap` value so
  // the wall feels continuous, not sectioned.
  // ──────────────────────────────────────────────────────────────────────────
  const unassigned: { artwork: PublicArtwork; index: number }[] = [];
  artworks.forEach((art, index) => {
    if (!assignedIndices.has(index)) {
      unassigned.push({ artwork: art, index });
    }
  });

  if (unassigned.length > 0) {
    // ── helpers ─────────────────────────────────────────────────────────────

    type AspectBucket = "panorama" | "landscape" | "square" | "portrait" | "tallPortrait";

    function inferBucket(aspect: number): AspectBucket {
      if (aspect >= 2.0) return "panorama";
      if (aspect >= 1.2) return "landscape";
      if (aspect >= 0.8) return "square";
      if (aspect >= 0.55) return "portrait";
      return "tallPortrait";
    }

    function pickFallbackFrame(
      bucket: AspectBucket,
      hash: number,
    ): MuseumFrameStyle {
      const wide: MuseumFrameStyle[] = [
        "darkWalnut",
        "antiqueGold",
        "floaterCanvas",
        "blackLacquer",
      ];
      const narrow: MuseumFrameStyle[] = [
        "galleryIron",
        "naturalOak",
        "blackLacquer",
        "darkWalnut",
      ];
      const pool =
        bucket === "panorama" || bucket === "landscape" ? wide : narrow;
      return pool[hash % pool.length];
    }

    function pickFallbackHeight(bucket: AspectBucket, hash: number): number {
      switch (bucket) {
        case "panorama":
          return 162 + (hash % 3) * 6; // 162 | 168 | 174
        case "landscape":
          return 155 + (hash % 4) * 10; // 155 | 165 | 175 | 185
        case "square":
          return 148 + (hash % 3) * 8; // 148 | 156 | 164
        case "portrait":
          return 130 + (hash % 4) * 10; // 130 | 140 | 150 | 160
        case "tallPortrait":
        default:
          return 155 + (hash % 3) * 10; // 155 | 165 | 175
      }
    }

    function pickFallbackRole(bucket: AspectBucket, isAnchor: boolean): SalonWallRole {
      if (isAnchor) return bucket === "panorama" ? "hero" : "anchor";
      return bucket === "tallPortrait" || bucket === "portrait"
        ? "accent"
        : "supporting";
    }

    // Annotate each unassigned artwork with geometry info
    type FallbackItem = {
      artwork: PublicArtwork;
      index: number;
      hash: number;
      bucket: AspectBucket;
      aspect: number;
    };

    const annotated: FallbackItem[] = unassigned.map(({ artwork, index }) => {
      const hash = hashString(artwork.slug || artwork.id);
      const aspect = getCameraAspectRatio(artwork, naturalAspects[artwork.id]);
      const bucket = inferBucket(aspect);
      return { artwork, index, hash, bucket, aspect };
    });

    // Sort: wide artworks first so ensembles are built anchor-first
    annotated.sort((a, b) => b.aspect - a.aspect);

    // ── ensemble builder ────────────────────────────────────────────────────
    // Consume annotated[] by pulling items in order and grouping them into
    // ensembles of 2–5. Each ensemble produces a mini museum cluster.

    const pool = [...annotated];

    function takeBucket(
      buckets: AspectBucket[],
      fallback?: FallbackItem,
    ): FallbackItem | undefined {
      const idx = pool.findIndex((it) => buckets.includes(it.bucket));
      if (idx >= 0) {
        const [taken] = pool.splice(idx, 1);
        return taken;
      }
      if (fallback) {
        const fi = pool.indexOf(fallback);
        if (fi >= 0) pool.splice(fi, 1);
        return fallback;
      }
      return undefined;
    }

    // Helper: place a single fallback item at (left, top) and add to pieces[]
    function placeFallbackItem(
      item: FallbackItem,
      frameKey: MuseumFrameStyle,
      heightBase: number,
      hasMat: boolean,
      role: SalonWallRole,
      left: number,
      top: number,
    ) {
      const m = measurePiece(item.artwork, frameKey, heightBase, hasMat);
      assignedIndices.add(item.index);
      pieces[item.index] = {
        artwork: item.artwork,
        index: item.index,
        numberLabel: String(item.index + 1).padStart(2, "0"),
        aspect: m.aspect,
        clusterId: "new-arrivals",
        role,
        left: Math.round(left),
        top: Math.round(top),
        width: m.width,
        height: m.height,
        mediaWidth: m.mediaWidth,
        mediaHeight: m.mediaHeight,
        border: m.border,
        mat: m.mat,
        hasMat,
        rotation: 0,
        frameColor: m.frameDef.frame,
        matColor: m.frameDef.mat,
        frameStyleKey: frameKey,
        centerX: Math.round(left + m.width / 2),
        centerY: Math.round(top + m.height / 2),
      };
      return m;
    }

    // Build the stage ceiling/floor safety margins once
    // Pieces must stay within [topSafe, bottomSafe]
    const topSafe = Math.round(safeHeight * 0.04);
    const bottomSafe = Math.round(safeHeight * 0.96);

    // Helper: clamp a top value so the frame stays within safe bounds
    function safeTop(top: number, h: number): number {
      return Math.max(topSafe, Math.min(bottomSafe - h, top));
    }

    while (pool.length > 0) {
      // ── pick the ensemble anchor (widest remaining) ────────────────────
      const anchor = pool.shift()!; // already sorted widest-first
      const anchorFrame = pickFallbackFrame(anchor.bucket, anchor.hash);
      const anchorH = pickFallbackHeight(anchor.bucket, anchor.hash);
      const anchorHasMat =
        anchorFrame === "blackLacquer" || anchorFrame === "naturalOak";
      const mAnchor = measurePiece(
        anchor.artwork,
        anchorFrame,
        anchorH,
        anchorHasMat,
      );
      const anchorRole = pickFallbackRole(anchor.bucket, true);

      // Eye-level centre for the anchor
      const anchorTop = safeTop(
        Math.round(wallCenterY - mAnchor.height / 2),
        mAnchor.height,
      );

      if (pool.length === 0) {
        // Solo piece — just place it and finish
        placeFallbackItem(
          anchor,
          anchorFrame,
          anchorH,
          anchorHasMat,
          anchorRole,
          cursorX,
          anchorTop,
        );
        cursorX += mAnchor.width + paddingX;
        break;
      }

      // ── try to pick a top companion ────────────────────────────────────
      const topCompanion = takeBucket(
        ["square", "portrait", "landscape", "tallPortrait"],
        pool[0],
      );

      // ── try to pick one or two bottom companions ───────────────────────
      const bot1 = pool.length > 0
        ? takeBucket(["portrait", "tallPortrait", "square", "landscape"], pool[0])
        : undefined;
      const bot2 = pool.length > 0
        ? takeBucket(["portrait", "tallPortrait", "square"], pool[0])
        : undefined;

      // ── measure companions ─────────────────────────────────────────────
      let mTop: ReturnType<typeof measurePiece> | undefined;
      let topFrame: MuseumFrameStyle | undefined;
      let topHasMat = false;
      let topH = 0;

      if (topCompanion) {
        topFrame = pickFallbackFrame(topCompanion.bucket, topCompanion.hash);
        topH = Math.round(
          pickFallbackHeight(topCompanion.bucket, topCompanion.hash) * 0.72,
        );
        topH = Math.max(80, Math.round(topH * scale));
        topHasMat =
          topFrame === "blackLacquer" || topFrame === "naturalOak";
        mTop = measurePiece(
          topCompanion.artwork,
          topFrame,
          Math.round(topH / scale),
          topHasMat,
        );
      }

      let mBot1: ReturnType<typeof measurePiece> | undefined;
      let bot1Frame: MuseumFrameStyle | undefined;
      let bot1HasMat = false;

      if (bot1) {
        bot1Frame = pickFallbackFrame(bot1.bucket, bot1.hash);
        const bH = Math.round(
          pickFallbackHeight(bot1.bucket, bot1.hash) * 0.74,
        );
        bot1HasMat = bot1Frame === "blackLacquer" || bot1Frame === "naturalOak";
        mBot1 = measurePiece(bot1.artwork, bot1Frame, Math.round(bH), bot1HasMat);
      }

      let mBot2: ReturnType<typeof measurePiece> | undefined;
      let bot2Frame: MuseumFrameStyle | undefined;
      let bot2HasMat = false;

      if (bot2) {
        bot2Frame = pickFallbackFrame(bot2.bucket, bot2.hash);
        const bH = Math.round(
          pickFallbackHeight(bot2.bucket, bot2.hash) * 0.74,
        );
        bot2HasMat = bot2Frame === "blackLacquer" || bot2Frame === "naturalOak";
        mBot2 = measurePiece(bot2.artwork, bot2Frame, Math.round(bH), bot2HasMat);
      }

      // ── compute ensemble geometry ──────────────────────────────────────
      // Bottom row width
      const botRowW = mBot1 && mBot2
        ? mBot1.width + gap + mBot2.width
        : mBot1
          ? mBot1.width
          : 0;

      const ensembleW = Math.max(
        mAnchor.width,
        mTop ? mTop.width : 0,
        botRowW,
      );

      // Vertical span check: top companion must fit above anchor, bottom must fit below
      // We need: anchorTop - gap - mTop.height >= topSafe
      // and: anchorTop + mAnchor.height + gap + maxBotH <= bottomSafe
      const maxBotH = mBot1
        ? (mBot2 ? Math.max(mBot1.height, mBot2.height) : mBot1.height)
        : 0;

      // Recompute anchorTop to fit everything within safe zone
      let fitTop = Math.round(wallCenterY - mAnchor.height / 2);
      if (mTop) {
        const neededAbove = mTop.height + gap;
        fitTop = Math.max(fitTop, topSafe + neededAbove);
      }
      if (maxBotH > 0) {
        const neededBelow = maxBotH + gap;
        fitTop = Math.min(fitTop, bottomSafe - mAnchor.height - neededBelow);
      }
      fitTop = Math.max(topSafe, fitTop);

      // ── place pieces ───────────────────────────────────────────────────
      const ensLeft = cursorX;

      // Anchor (eye level centre)
      const anchorPlacedTop = fitTop;
      const anchorLeft = ensLeft + Math.round((ensembleW - mAnchor.width) / 2);
      placeFallbackItem(
        anchor,
        anchorFrame,
        anchorH,
        anchorHasMat,
        anchorRole,
        anchorLeft,
        anchorPlacedTop,
      );

      // Top companion
      if (topCompanion && mTop && topFrame !== undefined) {
        const tTop = safeTop(anchorPlacedTop - gap - mTop.height, mTop.height);
        const tLeft = ensLeft + Math.round((ensembleW - mTop.width) / 2);
        placeFallbackItem(
          topCompanion,
          topFrame,
          Math.round(topH / scale),
          topHasMat,
          pickFallbackRole(topCompanion.bucket, false),
          tLeft,
          tTop,
        );
      }

      // Bottom row
      const botY = anchorPlacedTop + mAnchor.height + gap;

      if (bot1 && mBot1 && bot1Frame !== undefined) {
        if (bot2 && mBot2 && bot2Frame !== undefined) {
          // Two bottom companions side by side
          const rowLeft = ensLeft + Math.round((ensembleW - botRowW) / 2);
          const b1Top = safeTop(botY, mBot1.height);
          const b2Top = safeTop(botY, mBot2.height);
          placeFallbackItem(
            bot1,
            bot1Frame,
            Math.round(mBot1.height / scale),
            bot1HasMat,
            pickFallbackRole(bot1.bucket, false),
            rowLeft,
            b1Top,
          );
          placeFallbackItem(
            bot2,
            bot2Frame,
            Math.round(mBot2.height / scale),
            bot2HasMat,
            pickFallbackRole(bot2.bucket, false),
            rowLeft + mBot1.width + gap,
            b2Top,
          );
        } else {
          // Single bottom companion, centered
          const bLeft = ensLeft + Math.round((ensembleW - mBot1.width) / 2);
          const b1Top = safeTop(botY, mBot1.height);
          placeFallbackItem(
            bot1,
            bot1Frame,
            Math.round(mBot1.height / scale),
            bot1HasMat,
            pickFallbackRole(bot1.bucket, false),
            bLeft,
            b1Top,
          );
        }
      }

      cursorX += ensembleW + gap;
    }

    // Add trailing padding after the last ensemble
    cursorX += paddingX - gap;
  }

  const cleanPieces = pieces.filter(Boolean);
  const sceneWidth = Math.round(cursorX);
  const panMin = 0;
  const panMax = Math.max(0, sceneWidth - safeWidth);

  return {
    pieces: cleanPieces,
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
  const maxWidth = layout.stageWidth * (compact ? 0.88 : 0.54);
  const maxHeight = layout.stageHeight * (compact ? 0.48 : 0.72);
  const scale = clamp(
    Math.min(maxWidth / piece.width, maxHeight / piece.height),
    1.02,
    4.5,
  );
  const focalX = layout.stageWidth * (compact ? 0.5 : 0.58);
  const focalY = layout.stageHeight * (compact ? 0.28 : 0.48);

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
