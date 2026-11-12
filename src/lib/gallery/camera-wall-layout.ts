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
  // Genuinely curated ensemble fallback for unassigned artworks
  //
  // Six distinct composition templates — inspired by real salon hanging —
  // produce a wall that feels curated rather than generated:
  //
  //  T0 "Grand Flanked"    — Huge anchor left, two tiny accents stacked right
  //  T1 "Stacked Tower"    — Three pieces in one column: sm / LARGE / sm
  //  T2 "Portrait + Stack" — Tall portrait left, two landscape/square right
  //  T3 "Panorama Crown"   — Wide anchor center, portrait top-left, portrait bot-right
  //  T4 "High-Low Scatter" — Three pieces at VERY different heights
  //  T5 "Shoulder Cluster" — Anchor + right companion at different baselines
  //
  // Key aesthetic principles over the previous version:
  //  • Dramatic size range: accents at 0.42–0.52× anchor, NOT uniform 0.72×
  //  • Pieces use piece-relative Y alignment (align to anchor's top / bottom /
  //    midpoint), not always wallCenterY — this kills the rigid row banding
  //  • Subtle per-piece rotation (hash-based ±0.3°) for organic feel
  //  • Template chosen by anchor hash → deterministic but varied across wall
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

    function pickFallbackFrame(bucket: AspectBucket, hash: number): MuseumFrameStyle {
      const wide: MuseumFrameStyle[] = ["darkWalnut", "antiqueGold", "floaterCanvas", "blackLacquer"];
      const narrow: MuseumFrameStyle[] = ["galleryIron", "naturalOak", "blackLacquer", "darkWalnut"];
      const p = bucket === "panorama" || bucket === "landscape" ? wide : narrow;
      return p[hash % p.length];
    }

    // Anchor heights — LARGER than before so the size contrast is visible
    function pickAnchorHeight(bucket: AspectBucket, hash: number): number {
      switch (bucket) {
        case "panorama":    return 175 + (hash % 3) * 15; // 175 | 190 | 205
        case "landscape":   return 180 + (hash % 4) * 12; // 180 | 192 | 204 | 216
        case "square":      return 170 + (hash % 3) * 15; // 170 | 185 | 200
        case "portrait":    return 185 + (hash % 3) * 15; // 185 | 200 | 215
        default:            return 190 + (hash % 3) * 15; // 190 | 205 | 220
      }
    }

    // Companion heights as a FRACTION of anchor height
    // Using very small fractions creates the dramatic size contrast in the reference
    function companionHBase(anchorHBase: number, ratio: number): number {
      return Math.max(72, Math.round(anchorHBase * ratio));
    }

    // Subtle per-piece rotation (hash-driven, ±0.3°) — breaks the mechanical flatness
    function pickRotation(hash: number): number {
      // values: -0.3 | -0.2 | -0.1 | 0 | 0.1 | 0.2 | 0.3
      return ((hash % 7) - 3) * 0.1;
    }

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

    // Sort widest-first so each ensemble's anchor is always the most horizontal piece
    annotated.sort((a, b) => b.aspect - a.aspect);

    const pool = [...annotated];

    // Pull the first item matching any preferred bucket (or just pool[0])
    function pull(preferred?: AspectBucket[]): FallbackItem | undefined {
      if (pool.length === 0) return undefined;
      if (preferred) {
        const idx = pool.findIndex((it) => preferred.includes(it.bucket));
        if (idx >= 0) return pool.splice(idx, 1)[0];
      }
      return pool.shift();
    }

    // Safety margins: pieces must be fully inside [topSafe, bottomSafe]
    const topSafe = Math.round(safeHeight * 0.04);
    const bottomSafe = Math.round(safeHeight * 0.96);
    function safeTop(top: number, h: number): number {
      return Math.max(topSafe, Math.min(bottomSafe - h, top));
    }

    // Place one item into pieces[], clamping to safe zone
    function place(
      item: FallbackItem,
      frameKey: MuseumFrameStyle,
      hBase: number,
      hasMat: boolean,
      role: SalonWallRole,
      left: number,
      top: number,
      rotation: number,
    ) {
      const m = measurePiece(item.artwork, frameKey, hBase, hasMat);
      const clampedTop = safeTop(top, m.height);
      assignedIndices.add(item.index);
      pieces[item.index] = {
        artwork: item.artwork,
        index: item.index,
        numberLabel: String(item.index + 1).padStart(2, "0"),
        aspect: m.aspect,
        clusterId: "new-arrivals",
        role,
        left: Math.round(left),
        top: Math.round(clampedTop),
        width: m.width,
        height: m.height,
        mediaWidth: m.mediaWidth,
        mediaHeight: m.mediaHeight,
        border: m.border,
        mat: m.mat,
        hasMat,
        rotation,
        frameColor: m.frameDef.frame,
        matColor: m.frameDef.mat,
        frameStyleKey: frameKey,
        centerX: Math.round(left + m.width / 2),
        centerY: Math.round(clampedTop + m.height / 2),
      };
      // Return measured dims plus the clamped top so callers can derive dependent positions
      return { ...m, placedTop: Math.round(clampedTop) };
    }

    while (pool.length > 0) {
      const anchor = pool.shift()!; // widest remaining → becomes ensemble anchor
      const aFrame = pickFallbackFrame(anchor.bucket, anchor.hash);
      const aHBase = pickAnchorHeight(anchor.bucket, anchor.hash);
      const aHasMat = aFrame === "blackLacquer" || aFrame === "naturalOak";
      const mA = measurePiece(anchor.artwork, aFrame, aHBase, aHasMat);
      const aRole: SalonWallRole = anchor.bucket === "panorama" ? "hero" : "anchor";
      const aRot = pickRotation(anchor.hash);

      if (pool.length === 0) {
        // Solo — place at eye level and exit
        const aTop = safeTop(Math.round(wallCenterY - mA.height / 2), mA.height);
        place(anchor, aFrame, aHBase, aHasMat, aRole, cursorX, aTop, aRot);
        cursorX += mA.width + paddingX;
        break;
      }

      // Choose template via anchor hash (6 templates, deterministic)
      const tmpl = anchor.hash % 6;

      // ───────────────────────────────────────────────────────────────────
      // Template 0: "Grand Flanked"
      // Anchor (large) on the left. Two small accents stacked to its right,
      // top-aligned with anchor top. Creates an L-shape / organic cluster.
      // ───────────────────────────────────────────────────────────────────
      if (tmpl === 0) {
        const c1 = pull(["portrait", "tallPortrait", "square", "landscape"]);
        const c2 = pool.length > 0 ? pull(["portrait", "square", "tallPortrait"]) : undefined;

        const c1HBase = c1 ? companionHBase(aHBase, 0.49) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "naturalOak";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.44) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "naturalOak";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        const rightColW = Math.max(mC1 ? mC1.width : 0, mC2 ? mC2.width : 0);
        const ensW = mA.width + (rightColW > 0 ? gap + rightColW : 0);

        // Anchor: eye level, left side of ensemble
        const aTop = safeTop(Math.round(wallCenterY - mA.height / 2), mA.height);
        place(anchor, aFrame, aHBase, aHasMat, aRole, cursorX, aTop, aRot);

        if (c1 && mC1) {
          // Top-aligned with anchor: creates a natural "shoulder" hang
          const c1Top = safeTop(aTop, mC1.height);
          const c1Left = cursorX + mA.width + gap + Math.round((rightColW - mC1.width) / 2);
          place(c1, c1Frame, c1HBase, c1HasMat, "accent", c1Left, c1Top, pickRotation(c1.hash));

          if (c2 && mC2) {
            // Directly below c1 — not aligned to anchor bottom, hangs from c1
            const c2Top = safeTop(c1Top + mC1.height + gap, mC2.height);
            const c2Left = cursorX + mA.width + gap + Math.round((rightColW - mC2.width) / 2);
            place(c2, c2Frame, c2HBase, c2HasMat, "accent", c2Left, c2Top, pickRotation(c2.hash));
          }
        }

        cursorX += ensW + gap;

      // ───────────────────────────────────────────────────────────────────
      // Template 1: "Stacked Tower"
      // Three pieces in a single vertical column: small-top / LARGE-middle / small-bottom
      // All centered at the same X. The scale contrast (0.60 / 1.0 / 0.52) is dramatic.
      // ───────────────────────────────────────────────────────────────────
      } else if (tmpl === 1) {
        const c1 = pull(); // top
        const c2 = pool.length > 0 ? pull() : undefined; // bottom

        const c1HBase = c1 ? companionHBase(aHBase, 0.60) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "naturalOak";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.52) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "naturalOak";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        const colW = Math.max(mA.width, mC1 ? mC1.width : 0, mC2 ? mC2.width : 0);
        const totalH = (mC1 ? mC1.height + gap : 0) + mA.height + (mC2 ? gap + mC2.height : 0);
        const startY = safeTop(Math.round(wallCenterY - totalH / 2), totalH);
        let y = startY;

        if (c1 && mC1) {
          const c1Left = cursorX + Math.round((colW - mC1.width) / 2);
          place(c1, c1Frame, c1HBase, c1HasMat, "supporting", c1Left, y, pickRotation(c1.hash));
          y += mC1.height + gap;
        }
        const aLeft = cursorX + Math.round((colW - mA.width) / 2);
        place(anchor, aFrame, aHBase, aHasMat, aRole, aLeft, y, aRot);
        y += mA.height + gap;

        if (c2 && mC2) {
          const c2Left = cursorX + Math.round((colW - mC2.width) / 2);
          place(c2, c2Frame, c2HBase, c2HasMat, "accent", c2Left, y, pickRotation(c2.hash));
        }

        cursorX += colW + gap;

      // ───────────────────────────────────────────────────────────────────
      // Template 2: "Portrait + Landscape Stack"
      // Tall portrait anchor on the left. Two landscape/square pieces
      // stacked to the right, top-aligned with anchor. The right column's
      // combined height ≈ anchor height, so the stack fills the same zone.
      // ───────────────────────────────────────────────────────────────────
      } else if (tmpl === 2) {
        const c1 = pull(["landscape", "square", "panorama", "portrait"]);
        const c2 = pool.length > 0 ? pull(["landscape", "square", "portrait"]) : undefined;

        const c1HBase = c1 ? companionHBase(aHBase, 0.57) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "naturalOak";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.50) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "naturalOak";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        const rightW = Math.max(mC1 ? mC1.width : 0, mC2 ? mC2.width : 0);
        const ensW = mA.width + (rightW > 0 ? gap + rightW : 0);

        const aTop = safeTop(Math.round(wallCenterY - mA.height / 2), mA.height);
        place(anchor, aFrame, aHBase, aHasMat, aRole, cursorX, aTop, aRot);

        if (c1 && mC1) {
          // Right column top-aligned with anchor top
          const c1Left = cursorX + mA.width + gap + Math.round((rightW - mC1.width) / 2);
          const p1 = place(c1, c1Frame, c1HBase, c1HasMat, "supporting", c1Left, safeTop(aTop, mC1.height), pickRotation(c1.hash));

          if (c2 && mC2) {
            const c2Left = cursorX + mA.width + gap + Math.round((rightW - mC2.width) / 2);
            place(c2, c2Frame, c2HBase, c2HasMat, "supporting", c2Left, safeTop(p1.placedTop + mC1.height + gap, mC2.height), pickRotation(c2.hash));
          }
        }

        cursorX += ensW + gap;

      // ───────────────────────────────────────────────────────────────────
      // Template 3: "Panorama Crown"
      // Wide anchor at eye level. Portrait flanks it left and right at
      // ASYMMETRIC heights: left flank top-aligned with anchor top,
      // right flank bottom-aligned with anchor bottom. This is the classic
      // salon asymmetry that feels curated, not mechanical.
      // ───────────────────────────────────────────────────────────────────
      } else if (tmpl === 3) {
        const c1 = pull(["portrait", "tallPortrait", "square"]); // left flank (high)
        const c2 = pool.length > 0 ? pull(["portrait", "tallPortrait", "square", "landscape"]) : undefined; // right flank (low)

        const c1HBase = c1 ? companionHBase(aHBase, 0.62) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "galleryIron";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.55) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "galleryIron";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        const leftW = mC1 ? mC1.width + gap : 0;
        const rightW = mC2 ? gap + mC2.width : 0;
        const ensW = leftW + mA.width + rightW;

        const aTop = safeTop(Math.round(wallCenterY - mA.height / 2), mA.height);
        const aLeft = cursorX + leftW;
        place(anchor, aFrame, aHBase, aHasMat, aRole, aLeft, aTop, aRot);

        if (c1 && mC1) {
          // Left flank: top edge lines up with anchor top (hangs HIGH relative to anchor)
          place(c1, c1Frame, c1HBase, c1HasMat, "supporting", cursorX, safeTop(aTop, mC1.height), pickRotation(c1.hash));
        }
        if (c2 && mC2) {
          // Right flank: BOTTOM edge lines up with anchor bottom (hangs LOW — the asymmetry)
          const c2Top = safeTop(aTop + mA.height - mC2.height, mC2.height);
          place(c2, c2Frame, c2HBase, c2HasMat, "accent", aLeft + mA.width + gap, c2Top, pickRotation(c2.hash));
        }

        cursorX += ensW + gap;

      // ───────────────────────────────────────────────────────────────────
      // Template 4: "High-Low Scatter"
      // Three pieces placed at deliberately DIFFERENT Y positions across the
      // full wall height. First piece hangs HIGH (near ceiling zone), second
      // is at eye level, third hangs LOW (near floor zone). This template
      // alone covers the full vertical span and breaks any row reading.
      // ───────────────────────────────────────────────────────────────────
      } else if (tmpl === 4) {
        const c1 = pull(); // eye-level second piece
        const c2 = pool.length > 0 ? pull() : undefined; // low third piece

        const c1HBase = c1 ? companionHBase(aHBase, 0.70) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "naturalOak";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.48) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "naturalOak";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        // Anchor: HIGH — deliberately near the ceiling zone
        const highZoneBottom = Math.round(topSafe + safeHeight * 0.30);
        const aTop = safeTop(highZoneBottom - mA.height, mA.height);
        place(anchor, aFrame, aHBase, aHasMat, aRole, cursorX, aTop, aRot);
        let xCursor = cursorX + mA.width + gap;

        if (c1 && mC1) {
          // Eye level (true center)
          const midY = safeTop(Math.round(wallCenterY - mC1.height / 2), mC1.height);
          place(c1, c1Frame, c1HBase, c1HasMat, "supporting", xCursor, midY, pickRotation(c1.hash));
          xCursor += mC1.width + gap;
        }
        if (c2 && mC2) {
          // LOW — deliberately near the floor zone
          const lowZoneTop = Math.round(bottomSafe - safeHeight * 0.30);
          const lowY = safeTop(lowZoneTop, mC2.height);
          place(c2, c2Frame, c2HBase, c2HasMat, "accent", xCursor, lowY, pickRotation(c2.hash));
          xCursor += mC2.width;
        }

        cursorX = xCursor + gap;

      // ───────────────────────────────────────────────────────────────────
      // Template 5: "Shoulder Cluster"
      // Anchor and a medium companion side by side at different baselines,
      // plus a small accent placed high above the companion (not above the
      // anchor). Creates an offset cluster — no piece shares a baseline.
      // ───────────────────────────────────────────────────────────────────
      } else {
        const c1 = pull(["landscape", "square", "portrait"]); // right companion, medium
        const c2 = pool.length > 0 ? pull(["portrait", "square", "tallPortrait"]) : undefined; // accent above companion

        const c1HBase = c1 ? companionHBase(aHBase, 0.72) : 0;
        const c1Frame = c1 ? pickFallbackFrame(c1.bucket, c1.hash) : "naturalOak";
        const c1HasMat = c1Frame === "blackLacquer" || c1Frame === "naturalOak";
        const mC1 = c1 ? measurePiece(c1.artwork, c1Frame, c1HBase, c1HasMat) : null;

        const c2HBase = c2 ? companionHBase(aHBase, 0.42) : 0;
        const c2Frame = c2 ? pickFallbackFrame(c2.bucket, c2.hash) : "galleryIron";
        const c2HasMat = c2Frame === "blackLacquer" || c2Frame === "naturalOak";
        const mC2 = c2 ? measurePiece(c2.artwork, c2Frame, c2HBase, c2HasMat) : null;

        // Anchor: slightly below center (bottom-heavy reads as deliberate)
        const aTop = safeTop(
          Math.round(wallCenterY - mA.height / 2) + Math.round(safeHeight * 0.04),
          mA.height,
        );
        place(anchor, aFrame, aHBase, aHasMat, aRole, cursorX, aTop, aRot);

        const rightX = cursorX + mA.width + gap;
        const rightColW = Math.max(mC1 ? mC1.width : 0, mC2 ? mC2.width : 0);

        if (c1 && mC1) {
          // Companion: slightly above center (asymmetric vertical offset vs anchor)
          const c1Top = safeTop(
            Math.round(wallCenterY - mC1.height / 2) - Math.round(safeHeight * 0.05),
            mC1.height,
          );
          const p1 = place(c1, c1Frame, c1HBase, c1HasMat, "supporting", rightX + Math.round((rightColW - mC1.width) / 2), c1Top, pickRotation(c1.hash));

          if (c2 && mC2) {
            // Small accent: hangs directly above companion (not above anchor)
            const c2Top = safeTop(p1.placedTop - gap - mC2.height, mC2.height);
            place(c2, c2Frame, c2HBase, c2HasMat, "accent", rightX + Math.round((rightColW - mC2.width) / 2), c2Top, pickRotation(c2.hash));
          }
        }

        cursorX += mA.width + gap + rightColW + gap;
      }
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
