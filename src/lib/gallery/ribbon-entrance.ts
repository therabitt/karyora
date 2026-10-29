const RIBBON_CASCADE_DELAYS = [0, 84, 166, 254, 338] as const;

/**
 * Stagger panels around the selected artwork in a repeatable, lightly syncopated
 * cascade. The positive side enters a fraction after its negative-side partner.
 */
export function getRibbonCascadeDelay(offset: number): number {
  if (!Number.isFinite(offset)) return 0;

  const normalizedOffset = Math.trunc(offset);
  const distance = Math.abs(normalizedOffset);
  const baseDelay = distance <= RIBBON_CASCADE_DELAYS.length - 1
    ? RIBBON_CASCADE_DELAYS[distance]
    : RIBBON_CASCADE_DELAYS[RIBBON_CASCADE_DELAYS.length - 1] +
      (distance - (RIBBON_CASCADE_DELAYS.length - 1)) * 84;

  return baseDelay + (normalizedOffset > 0 && distance > 0 ? 36 : 0);
}

/**
 * Horizontal translation that brings a panel's center to the stage's center.
 * The caller supplies stage-local coordinates, not viewport coordinates.
 */
export function getRibbonEntranceOriginX(
  stageWidth: number,
  left: number,
  width: number,
): number {
  if (![stageWidth, left, width].every(Number.isFinite) || width < 0) return 0;
  return Math.round(stageWidth / 2 - (left + width / 2));
}
