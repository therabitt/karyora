/**
 * OKLab & OKLCH Perceptual Color Science Module
 *
 * Implements Björn Ottosson's OKLab color space (2020) for uniform human visual perception.
 * Used to calculate accurate perceptual distances (ΔE_OK), color temperature, chroma,
 * and harmonious contrast ratios without the perceptual distortions of HSL or sRGB.
 */

export interface OKLabColor {
  L: number; // Perceptual lightness: 0.0 (black) to 1.0 (white)
  a: number; // Green (-) to Red (+) axis: roughly -0.4 to +0.4
  b: number; // Blue (-) to Yellow (+) axis: roughly -0.4 to +0.4
}

export interface OKLCHColor {
  L: number; // Perceptual lightness: 0.0 to 1.0
  C: number; // Perceptual chroma / saturation: 0.0 to ~0.35+
  h: number; // Perceptual hue angle: 0.0 to 360.0 degrees
}

export interface RGBColor {
  r: number; // 0 to 255
  g: number; // 0 to 255
  b: number; // 0 to 255
}

// ─── sRGB <-> Linear RGB ─────────────────────────────────────────────────────

export function srgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const s = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

// ─── Linear RGB <-> OKLab ───────────────────────────────────────────────────

export function rgbToOklab(rgb: RGBColor): OKLabColor {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabToRgb(lab: OKLabColor): RGBColor {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: linearToSrgb(4.0767434099 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

// ─── OKLab <-> OKLCH ────────────────────────────────────────────────────────

export function oklabToOklch(lab: OKLabColor): OKLCHColor {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L: lab.L, C, h };
}

export function oklchToOklab(lch: OKLCHColor): OKLabColor {
  const rad = (lch.h * Math.PI) / 180;
  return {
    L: lch.L,
    a: lch.C * Math.cos(rad),
    b: lch.C * Math.sin(rad),
  };
}

// ─── Hex <-> RGB & OKLab ────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGBColor {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  const num = parseInt(clean.slice(0, 6), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGBColor): string {
  const r = Math.max(0, Math.min(255, rgb.r)).toString(16).padStart(2, "0");
  const g = Math.max(0, Math.min(255, rgb.g)).toString(16).padStart(2, "0");
  const b = Math.max(0, Math.min(255, rgb.b)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`.toUpperCase();
}

export function hexToOklab(hex: string): OKLabColor {
  return rgbToOklab(hexToRgb(hex));
}

export function oklabToHex(lab: OKLabColor): string {
  return rgbToHex(oklabToRgb(lab));
}

export function oklchToHex(lch: OKLCHColor): string {
  return oklabToHex(oklchToOklab(lch));
}

// ─── Perceptual Color Metrics (Delta E OK, Temperature, Neutrals) ────────────

/**
 * Perceptual Euclidean distance in OKLab space.
 * 0.02 = barely noticeable difference (JND)
 * 0.06 = distinct shade
 * 0.12+ = clearly distinct color
 */
export function deltaEOk(a: OKLabColor, b: OKLabColor): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Perceptual color temperature:
 * Evaluates warm (+1) vs cool (-1) balance based on OKLab a (red-green) and b (yellow-blue).
 */
export function getColorTemperature(lab: OKLabColor): {
  type: "warm" | "cool" | "neutral";
  score: number; // -1.0 (deep cold blue) to +1.0 (intense warm amber/red)
} {
  const lch = oklabToOklch(lab);
  if (lch.C < 0.035) {
    return { type: "neutral", score: 0 };
  }

  // Warm angles: ~15 deg (red) to ~95 deg (warm yellow/amber)
  // Cool angles: ~165 deg (cyan) to ~285 deg (indigo/violet)
  const rad = ((lch.h - 55) * Math.PI) / 180;
  const score = Math.cos(rad); // Peaks around 55 deg (amber/orange), troughs around 235 deg (deep cyan/blue)

  let type: "warm" | "cool" | "neutral" = "neutral";
  if (score > 0.2) type = "warm";
  else if (score < -0.2) type = "cool";

  return { type, score };
}

/**
 * Returns whether a color is perceptually near-monochrome / neutral gray.
 */
export function isPerceptuallyNeutral(lab: OKLabColor, threshold = 0.038): boolean {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b) < threshold;
}
