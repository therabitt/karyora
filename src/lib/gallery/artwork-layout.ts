export interface ArtworkDimensions {
  width: number;
  height: number;
}

export interface ArtworkWindowEntry {
  index: number;
  offset: number;
}

export function resolveArtworkDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
  fallback: ArtworkDimensions = { width: 3, height: 4 },
): ArtworkDimensions {
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    (width as number) > 0 &&
    (height as number) > 0
  ) {
    return { width: width as number, height: height as number };
  }

  return fallback;
}

/** Fit an artwork inside bounds without stretching or cropping its pixels. */
export function fitArtworkWithinBounds(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): ArtworkDimensions {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    !Number.isFinite(maxWidth) ||
    !Number.isFinite(maxHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    maxWidth <= 0 ||
    maxHeight <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

/** Return a circular artwork window centered on the current selection. */
export function getArtworkWindow(
  total: number,
  activeIndex: number,
  maxItems = 9,
): ArtworkWindowEntry[] {
  if (!Number.isInteger(total) || total <= 0 || !Number.isFinite(activeIndex)) {
    return [];
  }

  const count = Math.min(total, Math.max(1, Math.floor(maxItems)));
  const normalizedActive = ((Math.floor(activeIndex) % total) + total) % total;
  const firstOffset = -Math.floor(count / 2);

  return Array.from({ length: count }, (_, position) => {
    const offset = firstOffset + position;
    return {
      index: ((normalizedActive + offset) % total + total) % total,
      offset,
    };
  });
}

/** 3 previews on mobile, 5 on small screens, 7 on desktop, and 9 on wide screens. */
export function getResponsivePanelCount(viewportWidth: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const breakpointCount =
    viewportWidth >= 1280 ? 9 :
    viewportWidth >= 1024 ? 7 :
    viewportWidth >= 640 ? 5 : 3;

  const count = Math.min(Math.floor(total), breakpointCount);
  // Keep the active artwork centered by preferring odd panel counts. Two works
  // remain a two-panel case because hiding either would make selection confusing.
  return count > 2 && count % 2 === 0 ? count - 1 : count;
}
