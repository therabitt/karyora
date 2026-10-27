export type ArtworkDirection = "previous" | "next";

/**
 * Resolve a horizontal swipe to an artwork direction.
 * Vertical or intentionally small movements are treated as non-navigation gestures.
 */
export function getSwipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minDistance = 48,
  axisDominance = 1.25,
): ArtworkDirection | null {
  const values = [startX, startY, endX, endY, minDistance, axisDominance];
  if (!values.every(Number.isFinite) || minDistance < 0 || axisDominance < 1) {
    return null;
  }

  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const horizontalDistance = Math.abs(deltaX);

  if (
    horizontalDistance < minDistance ||
    horizontalDistance < Math.abs(deltaY) * axisDominance
  ) {
    return null;
  }

  return deltaX < 0 ? "next" : "previous";
}

/**
 * Resolve accumulated vertical wheel delta to an artwork direction.
 * Small trackpad events should be accumulated by the caller before passing them here.
 */
export function getWheelDirection(
  accumulatedDeltaY: number,
  threshold = 55,
): ArtworkDirection | null {
  if (
    !Number.isFinite(accumulatedDeltaY) ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    Math.abs(accumulatedDeltaY) < threshold
  ) {
    return null;
  }

  if (accumulatedDeltaY === 0) return null;
  return accumulatedDeltaY > 0 ? "next" : "previous";
}
