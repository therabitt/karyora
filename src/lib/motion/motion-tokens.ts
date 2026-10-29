/**
 * Reads the canonical motion tokens defined in globals.css.
 *
 * CSS animations and Web Animations API transitions share these tokens so their
 * durations and easing curves do not drift apart. The fallbacks keep server-side
 * rendering and restricted browser environments safe.
 */
export function parseCssTimeToMs(value: string, fallbackMs: number): number {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(-?(?:\d+\.?\d*|\.\d+))(ms|s)$/);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return fallbackMs;

  return match[2] === "s" ? amount * 1000 : amount;
}

export function getMotionDuration(token: string, fallbackMs: number): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallbackMs;
  }

  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue(token);

  return parseCssTimeToMs(value, fallbackMs);
}

export function getMotionEasing(token: string, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();

  return value || fallback;
}

export function getMotionStaggerDelay(
  distance: number,
  stepMs: number,
  maximumDelayMs: number,
): number {
  if (!Number.isFinite(distance) || !Number.isFinite(stepMs) || !Number.isFinite(maximumDelayMs)) {
    return 0;
  }

  const rank = Math.max(0, Math.floor(Math.abs(distance)));
  return Math.min(rank * Math.max(0, stepMs), Math.max(0, maximumDelayMs));
}

/**
 * Produces a CSS calc expression using repeated additions rather than time
 * arithmetic. This avoids depending on CSS multiplication support.
 */
export function getStaggerDelayExpression(rank: number, token: string): string {
  if (!Number.isFinite(rank) || rank <= 0) return "0ms";

  const terms = Array.from(
    { length: Math.min(32, Math.floor(rank)) },
    () => `var(${token})`,
  );

  return terms.length ? `calc(${terms.join(" + ")})` : "0ms";
}

export function getSliceStaggerRank(index: number, count: number): number {
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count <= 0 ||
    index < 0 ||
    index >= count
  ) {
    return 0;
  }

  const center = (count - 1) / 2;
  return Math.floor(Math.abs(index - center));
}

/**
 * Staggers slices from the center out. A small directional tie-break means the
 * left/right pair is not perfectly simultaneous, while preserving each ring's
 * clear 60 ms rhythm. On exit, outer rings leave before inner rings.
 */
export function getSliceStaggerDelay(
  index: number,
  count: number,
  direction: "next" | "previous",
  stepMs: number,
  tieMs: number,
  reverse = false,
): number {
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count <= 0 ||
    index < 0 ||
    index >= count ||
    !Number.isFinite(stepMs) ||
    !Number.isFinite(tieMs)
  ) {
    return 0;
  }

  const center = (count - 1) / 2;
  const ring = getSliceStaggerRank(index, count);
  const outermostRing = Math.floor(center);
  const ringRank = reverse ? outermostRing - ring : ring;
  const isLeftOfCenter = index < center;
  const firstSide = direction === "next" ? "left" : "right";
  const isFirstSide = index !== center &&
    ((isLeftOfCenter && firstSide === "left") ||
      (!isLeftOfCenter && firstSide === "right"));
  const tieRank = index === center ? 0 : Number(reverse ? isFirstSide : !isFirstSide);

  return Math.max(0, ringRank) * Math.max(0, stepMs) +
    tieRank * Math.max(0, tieMs);
}

function cubicBezierCoordinate(t: number, point1: number, point2: number): number {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * point1 +
    3 * inverse * t * t * point2 +
    t * t * t
  );
}

/**
 * Computes y(x) for a CSS cubic-bezier easing, used to keep image crop scaling
 * synchronized with the animated Ribbon frame's easing curve.
 */
export function getCubicBezierProgress(progress: number, easing: string): number {
  const x = Math.max(0, Math.min(1, progress));
  // Preserve exact endpoints so geometry derived from these samples cannot drift
  // from the WAAPI frame at the start or finish.
  if (x === 0 || x === 1) return x;

  const match = easing.match(
    /^cubic-bezier\(\s*(-?(?:\d+\.?\d*|\.\d+))\s*,\s*(-?(?:\d+\.?\d*|\.\d+))\s*,\s*(-?(?:\d+\.?\d*|\.\d+))\s*,\s*(-?(?:\d+\.?\d*|\.\d+))\s*\)$/i,
  );
  if (!match) return x;

  const [, x1Text, y1Text, x2Text, y2Text] = match;
  const x1 = Number(x1Text);
  const y1 = Number(y1Text);
  const x2 = Number(x2Text);
  const y2 = Number(y2Text);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return x;

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (cubicBezierCoordinate(midpoint, x1, x2) < x) low = midpoint;
    else high = midpoint;
  }

  return cubicBezierCoordinate((low + high) / 2, y1, y2);
}
