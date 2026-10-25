import "server-only";

import sharp from "sharp";
import {
  rgbToOklab,
  oklabToOklch,
  oklabToHex,
  deltaEOk,
  getColorTemperature,
  isPerceptuallyNeutral,
  type OKLabColor,
  type OKLCHColor,
} from "@/lib/color/oklab";

export interface ColorCluster {
  hex: string;
  oklab: OKLabColor;
  oklch: OKLCHColor;
  proportion: number; // 0.0 to 1.0 (fraction of opaque pixels)
  isNeutral: boolean;
  temperature: "warm" | "cool" | "neutral";
}

export interface ImageColorAnalysis {
  clusters: ColorCluster[];
  dominantCluster: ColorCluster;
  vividAccentCluster: ColorCluster | null;
  deepToneCluster: ColorCluster | null;
  lightToneCluster: ColorCluster | null;
  isMonochrome: boolean;
  averageLightness: number;
  averageChroma: number;
  overallTemperature: "warm" | "cool" | "neutral";
  totalSampledPixels: number;
  hasTransparency: boolean;
}

const SAMPLE_SIZE = 128; // 128x128 = 16,384 sample matrix
const MAX_CLUSTERS = 6;
const K_MEANS_ITERATIONS = 8;

/**
 * Extracts comprehensive perceptual color clusters and metrics from an image buffer using Sharp.
 * Handles alpha transparency, monochrome, high/low key contrast, and extreme luminance.
 */
export async function extractImageColorAnalysis(
  imageBuffer: Buffer
): Promise<ImageColorAnalysis> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Cannot extract palette from empty image buffer.");
  }

  // 1. Process with Sharp: rotate orientation, resize to matrix, extract raw RGBA
  const { data, info } = await sharp(imageBuffer, { failOn: "none" })
    .rotate()
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 4 (RGBA)
  const totalPixels = info.width * info.height;

  // 2. Filter pixels and convert to OKLab
  const validPixels: { oklab: OKLabColor; weight: number }[] = [];
  let transparentPixelCount = 0;
  let sumL = 0;
  let sumC = 0;
  let warmScoreTotal = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Ignore transparent / semi-transparent cutout pixels
    if (a < 128) {
      transparentPixelCount++;
      continue;
    }

    const lab = rgbToOklab({ r, g, b });
    const lch = oklabToOklch(lab);

    // Slight perceptual weighting: favor midtones & chromatic pixels over extreme flat black/white
    let weight = 1.0;
    if (lab.L < 0.05 || lab.L > 0.96) {
      weight = 0.4;
    } else if (lch.C > 0.06) {
      weight = 1.25;
    }

    validPixels.push({ oklab: lab, weight });
    sumL += lab.L;
    sumC += lch.C;

    const temp = getColorTemperature(lab);
    warmScoreTotal += temp.score;
  }

  const validCount = validPixels.length;
  if (validCount === 0) {
    // Fallback for 100% transparent or empty image
    const fallbackLab: OKLabColor = { L: 0.35, a: 0, b: 0 };
    const fallbackLch = oklabToOklch(fallbackLab);
    const fallbackCluster: ColorCluster = {
      hex: "#4A4A4A",
      oklab: fallbackLab,
      oklch: fallbackLch,
      proportion: 1.0,
      isNeutral: true,
      temperature: "neutral",
    };
    return {
      clusters: [fallbackCluster],
      dominantCluster: fallbackCluster,
      vividAccentCluster: null,
      deepToneCluster: fallbackCluster,
      lightToneCluster: fallbackCluster,
      isMonochrome: true,
      averageLightness: 0.35,
      averageChroma: 0,
      overallTemperature: "neutral",
      totalSampledPixels: 0,
      hasTransparency: true,
    };
  }

  const avgL = sumL / validCount;
  const avgC = sumC / validCount;
  const avgWarmth = warmScoreTotal / validCount;
  const overallTemperature: "warm" | "cool" | "neutral" =
    avgWarmth > 0.15 ? "warm" : avgWarmth < -0.15 ? "cool" : "neutral";

  // 3. Initialize K-Means centroids in OKLab space using k-means++ seeding
  const k = Math.min(MAX_CLUSTERS, Math.max(2, Math.floor(validCount / 50)));
  const centroids: OKLabColor[] = [];

  // Seed 1: pixel closest to median lightness
  centroids.push(validPixels[Math.floor(validCount / 2)].oklab);

  while (centroids.length < k) {
    let bestDist = -1;
    let bestIdx = 0;
    // Sample a subset for candidate seed
    const step = Math.max(1, Math.floor(validCount / 64));
    for (let i = 0; i < validCount; i += step) {
      const p = validPixels[i].oklab;
      let minDist = Infinity;
      for (const c of centroids) {
        const d = deltaEOk(p, c);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestDist) {
        bestDist = minDist;
        bestIdx = i;
      }
    }
    centroids.push({ ...validPixels[bestIdx].oklab });
  }

  // 4. Run K-Means iterations
  const assignments = new Int16Array(validCount);
  const clusterWeights = new Float64Array(k);

  for (let iter = 0; iter < K_MEANS_ITERATIONS; iter++) {
    // Reset accumulators
    const accL = new Float64Array(k);
    const accA = new Float64Array(k);
    const accB = new Float64Array(k);
    clusterWeights.fill(0);

    // Assign points to nearest centroid
    for (let i = 0; i < validCount; i++) {
      const p = validPixels[i].oklab;
      const w = validPixels[i].weight;
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let j = 0; j < k; j++) {
        const d = deltaEOk(p, centroids[j]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = j;
        }
      }

      assignments[i] = nearestIdx;
      accL[nearestIdx] += p.L * w;
      accA[nearestIdx] += p.a * w;
      accB[nearestIdx] += p.b * w;
      clusterWeights[nearestIdx] += w;
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      if (clusterWeights[j] > 0) {
        centroids[j] = {
          L: accL[j] / clusterWeights[j],
          a: accA[j] / clusterWeights[j],
          b: accB[j] / clusterWeights[j],
        };
      }
    }
  }

  // 5. Build and score final clusters
  const totalWeight = clusterWeights.reduce((a, b) => a + b, 0);
  const rawClusters: ColorCluster[] = [];

  for (let j = 0; j < k; j++) {
    if (clusterWeights[j] <= 0) continue;
    const lab = centroids[j];
    const lch = oklabToOklch(lab);
    const proportion = clusterWeights[j] / (totalWeight || 1);
    const temp = getColorTemperature(lab);
    const isNeutral = isPerceptuallyNeutral(lab);

    rawClusters.push({
      hex: oklabToHex(lab),
      oklab: lab,
      oklch: lch,
      proportion,
      isNeutral,
      temperature: temp.type,
    });
  }

  // Sort clusters by proportion descending
  rawClusters.sort((a, b) => b.proportion - a.proportion);

  // 6. Detect special roles: dominant, vivid accent, deep tone, light tone
  const dominantCluster = rawClusters[0];

  // Accent: highest chroma cluster with minimum proportion (at least 3%) and distinct from dominant
  let vividAccentCluster: ColorCluster | null = null;
  let maxAccentScore = -1;
  for (const c of rawClusters) {
    if (c.proportion < 0.02) continue;
    const distFromDom = deltaEOk(c.oklab, dominantCluster.oklab);
    const score = c.oklch.C * 1.5 + distFromDom * 0.8;
    if (c.oklch.C >= 0.05 && score > maxAccentScore && distFromDom > 0.08) {
      maxAccentScore = score;
      vividAccentCluster = c;
    }
  }

  // Deep tone: lowest lightness with minimum proportion
  let deepToneCluster: ColorCluster | null = null;
  let minL = Infinity;
  for (const c of rawClusters) {
    if (c.oklab.L < minL) {
      minL = c.oklab.L;
      deepToneCluster = c;
    }
  }

  // Light tone: highest lightness
  let lightToneCluster: ColorCluster | null = null;
  let maxL = -Infinity;
  for (const c of rawClusters) {
    if (c.oklab.L > maxL) {
      maxL = c.oklab.L;
      lightToneCluster = c;
    }
  }

  const isMonochrome = avgC < 0.035 && rawClusters.every((c) => c.oklch.C < 0.055);
  const hasTransparency = transparentPixelCount > totalPixels * 0.02;

  return {
    clusters: rawClusters,
    dominantCluster,
    vividAccentCluster,
    deepToneCluster,
    lightToneCluster,
    isMonochrome,
    averageLightness: avgL,
    averageChroma: avgC,
    overallTemperature,
    totalSampledPixels: validCount,
    hasTransparency,
  };
}
