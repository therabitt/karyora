import {
  oklabToOklch,
  oklchToOklab,
  oklabToHex,
  hexToOklab,
  hexToRgb,
  deltaEOk,
  getColorTemperature,
  type OKLabColor,
} from "@/lib/color/oklab";
import type { ImageColorAnalysis } from "@/lib/storage/palette-extractor";

export type PatternType =
  | "topographic"
  | "geometric"
  | "botanical"
  | "astrolabe"
  | "filigree"
  | "horizon"
  | "minimal";

export interface PaletteCandidate {
  rearColor: string;
  rearLab: OKLabColor;
  abstractBg: string;
  middleBgColor: string;
  patternType: PatternType;
  accentColor: string;
  subtleLineColor: string;
  plateTag: string;
  temperature: "warm" | "cool" | "neutral";
  strategyName: string;
  score: number;
  uniquenessDistance: number;
}

export interface CatalogPaletteReference {
  slug?: string;
  dominantHex: string;
  dominantLab: OKLabColor;
}

export interface GeneratedArtworkPalette {
  rearColor: string;
  rearLab: OKLabColor;
  abstractBg: string;
  middleBgColor: string;
  patternType: PatternType;
  accentColor: string;
  subtleLineColor: string;
  plateTag: string;
  temperature: "warm" | "cool" | "neutral";
  harmonyScore: number;
  uniquenessDistance: number;
  strategyUsed: string;
  clusters: Array<{
    hex: string;
    proportion: number;
    isNeutral: boolean;
  }>;
}

/**
 * Nudges an OKLab color to fit the editorial rear card constraints:
 * Lightness should sit between 0.22 and 0.42 to ensure the white artwork card in front
 * and typography pop cleanly without looking washed out or blindingly bright.
 */
function normalizeRearCardLightness(lab: OKLabColor, isMonochrome = false): OKLabColor {
  const lch = oklabToOklch(lab);
  let targetL = lch.L;
  let targetC = lch.C;

  if (isMonochrome) {
    // Pure neutral monochrome: keep strictly low-chroma slate/charcoal
    targetL = Math.max(0.24, Math.min(0.40, targetL));
    targetC = Math.min(targetC, 0.02);
  } else {
    // Chromatic: ensure enough lightness contrast against white (#FFFFFF) while keeping body
    targetL = Math.max(0.25, Math.min(0.42, targetL));
    // Soften extreme neon saturation so rear card remains an elegant gallery backing
    targetC = Math.max(0.035, Math.min(0.16, targetC));
  }

  return oklchToOklab({
    L: targetL,
    C: targetC,
    h: lch.h,
  });
}

/**
 * Generates an appropriate abstract linework pattern type based on image hue & category.
 */
function determinePatternType(
  hue: number,
  category?: string,
  isMonochrome = false
): PatternType {
  if (isMonochrome) return "minimal";

  const cat = (category || "").toLowerCase();
  if (cat.includes("landscape") || cat.includes("environment")) {
    return hue > 60 && hue < 170 ? "botanical" : "horizon";
  }
  if (cat.includes("character") || cat.includes("fan-art")) {
    if (hue >= 180 && hue <= 250) return "geometric";
    if (hue >= 250 && hue <= 325) return "astrolabe";
    if (hue > 325 || hue < 40) return "filigree";
  }

  // Fallback based on hue circle
  if (hue >= 180 && hue <= 255) return "geometric";
  if (hue >= 75 && hue < 180) return "botanical";
  if (hue >= 255 && hue <= 325) return "astrolabe";
  if (hue > 325 || hue < 45) return "filigree";
  if (hue >= 45 && hue < 75) return "horizon";

  return "topographic";
}

/**
 * Formats a clean, editorial plate tag.
 */
function createPlateTag(
  title: string,
  descriptor: string
): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").trim().toUpperCase();
  const truncated = cleanTitle.length > 20 ? cleanTitle.slice(0, 18) + ".." : cleanTitle;
  return `${truncated} · ${descriptor.toUpperCase()}`;
}

/**
 * Builds a CSS 135deg linear-gradient string for the middle card with subtle spatial depth.
 */
function buildMiddleGradient(baseLab: OKLabColor): { gradient: string; midHex: string } {
  const lch = oklabToOklch(baseLab);
  // Middle card is deeper (L: 0.12 to 0.22) with slightly richer chroma
  const darkStopLab = oklchToOklab({
    L: Math.max(0.11, Math.min(0.18, lch.L * 0.7)),
    C: Math.min(0.14, lch.C * 0.9),
    h: lch.h,
  });
  const midStopLab = oklchToOklab({
    L: Math.max(0.16, Math.min(0.24, lch.L * 0.95)),
    C: Math.min(0.16, lch.C * 1.05),
    h: (lch.h + 5) % 360,
  });
  const deepStopLab = oklchToOklab({
    L: Math.max(0.08, Math.min(0.14, lch.L * 0.55)),
    C: Math.min(0.12, lch.C * 0.8),
    h: (lch.h - 5 + 360) % 360,
  });

  const c1 = oklabToHex(darkStopLab);
  const c2 = oklabToHex(midStopLab);
  const c3 = oklabToHex(deepStopLab);

  return {
    gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
    midHex: c2,
  };
}

/**
 * Creates subtle linework RGBA with high contrast against the middle background.
 */
function buildSubtleLineColor(accentHex: string, opacity = 0.24): string {
  const rgb = hexToRgb(accentHex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Generates and scores a single candidate palette.
 */
function createCandidate({
  rearSourceLab,
  middleSourceLab,
  accentSourceLab,
  title,
  descriptor,
  category,
  strategyName,
  isMonochrome,
  catalogRefs,
}: {
  rearSourceLab: OKLabColor;
  middleSourceLab: OKLabColor;
  accentSourceLab: OKLabColor;
  title: string;
  descriptor: string;
  category?: string;
  strategyName: string;
  isMonochrome: boolean;
  catalogRefs: CatalogPaletteReference[];
}): PaletteCandidate {
  const rearLab = normalizeRearCardLightness(rearSourceLab, isMonochrome);
  const rearHex = oklabToHex(rearLab);
  const rearLch = oklabToOklch(rearLab);

  const { gradient, midHex } = buildMiddleGradient(middleSourceLab);

  // Accent: ensure high luminance and vividness
  const accentLch = oklabToOklch(accentSourceLab);
  const accentLab = oklchToOklab({
    L: Math.max(0.68, Math.min(0.86, accentLch.L < 0.6 ? 0.76 : accentLch.L)),
    C: isMonochrome ? 0.02 : Math.max(0.09, Math.min(0.24, accentLch.C * 1.2)),
    h: accentLch.h,
  });
  const accentHex = oklabToHex(accentLab);

  const subtleLineColor = buildSubtleLineColor(accentHex, 0.25);
  const patternType = determinePatternType(rearLch.h, category, isMonochrome);
  const plateTag = createPlateTag(title, descriptor);
  const temp = getColorTemperature(rearLab);

  // Calculate minimum distance to existing catalog palettes (Uniqueness Metric)
  let minCatalogDist = 1.0;
  for (const ref of catalogRefs) {
    const d = deltaEOk(rearLab, ref.dominantLab);
    if (d < minCatalogDist) {
      minCatalogDist = d;
    }
  }

  // ─── SCORING FORMULA ────────────────────────────────────────────────────────
  // 1. Uniqueness Reward & Collision Penalty:
  //    ΔE_OK < 0.08 = almost indistinguishable shade (heavy penalty)
  //    ΔE_OK >= 0.12 = distinctly unique palette (full reward)
  let uniquenessScore = 0;
  if (minCatalogDist < 0.08) {
    uniquenessScore = -150 * (0.08 - minCatalogDist);
  } else if (minCatalogDist >= 0.12) {
    uniquenessScore = 30 + Math.min(20, minCatalogDist * 50);
  } else {
    uniquenessScore = 15;
  }

  // 2. Harmony & Depth: contrast between rear card and middle card
  const depthDist = deltaEOk(rearLab, hexToOklab(midHex));
  const depthScore = Math.min(25, depthDist * 60);

  // 3. Accent Contrast: linework pop against dark middle card
  const accentDist = deltaEOk(accentLab, hexToOklab(midHex));
  const accentScore = Math.min(30, accentDist * 50);

  const totalScore = 50 + uniquenessScore + depthScore + accentScore;

  return {
    rearColor: rearHex,
    rearLab,
    abstractBg: gradient,
    middleBgColor: midHex,
    patternType,
    accentColor: accentHex,
    subtleLineColor,
    plateTag,
    temperature: temp.type,
    strategyName,
    score: totalScore,
    uniquenessDistance: minCatalogDist,
  };
}

/**
 * Artwork-Aware Harmony + Palette Uniqueness Engine:
 * Generates multiple candidates from the image's extracted color clusters and selects
 * the candidate that maximizes fidelity, temperature harmony, visual depth, and catalog uniqueness.
 */
export function generateArtworkHarmoniousPalette({
  analysis,
  title,
  category,
  catalogExistingPalettes = [],
}: {
  analysis: ImageColorAnalysis;
  title: string;
  category?: string;
  catalogExistingPalettes?: CatalogPaletteReference[];
}): GeneratedArtworkPalette {
  const { clusters, dominantCluster, vividAccentCluster, deepToneCluster, isMonochrome } =
    analysis;

  // ─── ACHROMATIC MONOCHROME ARTWORK ARCHIVE ─────────────────────────────────
  // Pure Black & White sketches, line art, ink washes, and monochrome vectors
  // are never assigned chromatic/complementary hues. They receive a dedicated
  // architectural graphite, obsidian charcoal, and pearl silver palette.
  if (isMonochrome) {
    return {
      rearColor: "#2A3036",
      rearLab: hexToOklab("#2A3036"),
      abstractBg: "linear-gradient(135deg, #131618 0%, #1E2226 50%, #0E1012 100%)",
      middleBgColor: "#1E2226",
      patternType: "minimal",
      accentColor: "#C2CCD6",
      subtleLineColor: "rgba(194, 204, 214, 0.22)",
      plateTag: createPlateTag(title, "GRAPHITE STUDY"),
      temperature: "neutral",
      harmonyScore: 100,
      uniquenessDistance: 0.25,
      strategyUsed: "achromatic-monochrome-archive",
      clusters: clusters.slice(0, 5).map((c) => ({
        hex: c.hex,
        proportion: Math.round(c.proportion * 1000) / 10,
        isNeutral: true,
      })),
    };
  }

  const candidates: PaletteCandidate[] = [];

  // ─── STRATEGY 1: Dominant Anchor + Split-Complementary Glow ────────────────
  const domLab = dominantCluster.oklab;
  const domLch = oklabToOklch(domLab);
  const compHue = (domLch.h + 175) % 360;
  const compLab = oklchToOklab({
    L: Math.max(0.18, domLch.L * 0.8),
    C: Math.max(0.04, domLch.C * 0.9),
    h: compHue,
  });
  const accentSource = vividAccentCluster?.oklab || compLab;

  candidates.push(
    createCandidate({
      rearSourceLab: domLab,
      middleSourceLab: compLab,
      accentSourceLab: accentSource,
      title,
      descriptor: isMonochrome ? "MONOCHROME ARCHIVE" : "CHROMATIC HARMONY",
      category,
      strategyName: "dominant-split-complementary",
      isMonochrome,
      catalogRefs: catalogExistingPalettes,
    })
  );

  // ─── STRATEGY 2: Secondary Tone Inversion (Exploiting Multi-Color Depth) ───
  if (clusters.length > 1 && clusters[1].proportion >= 0.08) {
    const secCluster = clusters[1];
    const secLab = secCluster.oklab;
    const secLch = oklabToOklch(secLab);

    candidates.push(
      createCandidate({
        rearSourceLab: secLab,
        middleSourceLab: domLab,
        accentSourceLab: vividAccentCluster?.oklab || oklchToOklab({ L: 0.78, C: 0.16, h: (secLch.h + 170) % 360 }),
        title,
        descriptor: "TONAL COUNTERPOINT",
        category,
        strategyName: "secondary-inversion",
        isMonochrome,
        catalogRefs: catalogExistingPalettes,
      })
    );
  }

  // ─── STRATEGY 3: Vivid Accent Grounding (High-Energy Pieces) ───────────────
  if (vividAccentCluster && vividAccentCluster.proportion >= 0.05) {
    const accLab = vividAccentCluster.oklab;
    const deepLab = deepToneCluster?.oklab || domLab;

    candidates.push(
      createCandidate({
        rearSourceLab: accLab,
        middleSourceLab: deepLab,
        accentSourceLab: oklchToOklab({ L: 0.82, C: 0.18, h: (vividAccentCluster.oklch.h + 60) % 360 }),
        title,
        descriptor: "VIVID RESONANCE",
        category,
        strategyName: "vivid-accent-lead",
        isMonochrome,
        catalogRefs: catalogExistingPalettes,
      })
    );
  }

  // ─── STRATEGY 4: Deep Atmospheric Monograph ────────────────────────────────
  if (deepToneCluster) {
    const deepLab = deepToneCluster.oklab;
    const deepLch = oklabToOklch(deepLab);
    const luminousAccent = vividAccentCluster?.oklab || oklchToOklab({ L: 0.80, C: 0.15, h: (deepLch.h + 180) % 360 });

    candidates.push(
      createCandidate({
        rearSourceLab: deepLab,
        middleSourceLab: oklchToOklab({ L: 0.14, C: deepLch.C * 0.7, h: deepLch.h }),
        accentSourceLab: luminousAccent,
        title,
        descriptor: "NOCTURNE MONOGRAPH",
        category,
        strategyName: "deep-atmospheric",
        isMonochrome,
        catalogRefs: catalogExistingPalettes,
      })
    );
  }

  // Sort candidates by total score descending
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];

  return {
    rearColor: winner.rearColor,
    rearLab: winner.rearLab,
    abstractBg: winner.abstractBg,
    middleBgColor: winner.middleBgColor,
    patternType: winner.patternType,
    accentColor: winner.accentColor,
    subtleLineColor: winner.subtleLineColor,
    plateTag: winner.plateTag,
    temperature: winner.temperature,
    harmonyScore: Math.round(winner.score),
    uniquenessDistance: Math.round(winner.uniquenessDistance * 1000) / 1000,
    strategyUsed: winner.strategyName,
    clusters: clusters.slice(0, 5).map((c) => ({
      hex: c.hex,
      proportion: Math.round(c.proportion * 1000) / 10,
      isNeutral: c.isNeutral,
    })),
  };
}
