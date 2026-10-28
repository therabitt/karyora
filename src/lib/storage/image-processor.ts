import "server-only";

import sharp from "sharp";

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // 25 MiB = 26,214,400 bytes
export const MAX_DIMENSION = 10_000; // 10,000 pixels
export const MAX_TOTAL_PIXELS = 64_000_000; // 64 MP (e.g. 8,000 × 8,000 px)
export const MAX_ARTWORK_DERIVATIVE_DIMENSION = 1600; // 1,600px exhibition image
export const MAX_ARTWORK_PREVIEW_DIMENSION = 960; // Sharp preview variant, sufficient for high-DPI ribbon panels
export const MAX_AVATAR_DERIVATIVE_DIMENSION = 512; // 512 pixels bounding box

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
  format: "webp";
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

/**
 * Validates raw image buffer metadata before full pixel decode.
 * Inspects format, frame count, EXIF-orientation adjusted bounds, and pixel area.
 */
export async function validateSourceImageMetadata(buffer: Buffer) {
  if (!buffer || buffer.length === 0) {
    throw new ImageValidationError("Image buffer is empty.");
  }

  if (buffer.length > MAX_SOURCE_BYTES) {
    throw new ImageValidationError(
      `File size (${buffer.length} bytes) exceeds the allowed limit of 25 MiB (26,214,400 bytes).`
    );
  }

  const pipeline = sharp(buffer, {
    limitInputPixels: MAX_TOTAL_PIXELS,
    failOn: "error",
  });

  const metadata = await pipeline.metadata();

  // Validate format
  const allowedFormats = ["jpeg", "png", "webp"];
  if (!metadata.format || !allowedFormats.includes(metadata.format)) {
    throw new ImageValidationError(
      `Unsupported image format: ${metadata.format || "unknown"}. Allowed formats: JPEG, PNG, WebP.`
    );
  }

  // Reject animated or multi-frame images
  if (metadata.pages && metadata.pages > 1) {
    throw new ImageValidationError(
      "Animated or multi-frame image formats are prohibited."
    );
  }

  const rawWidth = metadata.width || 0;
  const rawHeight = metadata.height || 0;

  if (rawWidth <= 0 || rawHeight <= 0) {
    throw new ImageValidationError("Image dimensions could not be determined.");
  }

  // Account for EXIF orientation when checking effective bounds (Section 4.8.3)
  // Orientation 5, 6, 7, 8 swap width and height
  const orientation = metadata.orientation || 1;
  const isSwapped = [5, 6, 7, 8].includes(orientation);
  const effectiveWidth = isSwapped ? rawHeight : rawWidth;
  const effectiveHeight = isSwapped ? rawWidth : rawHeight;

  if (effectiveWidth > MAX_DIMENSION || effectiveHeight > MAX_DIMENSION) {
    throw new ImageValidationError(
      `Image dimensions (${effectiveWidth}x${effectiveHeight}) exceed the 10,000 x 10,000 pixel boundary.`
    );
  }

  const effectiveArea = effectiveWidth * effectiveHeight;
  if (effectiveArea > MAX_TOTAL_PIXELS) {
    throw new ImageValidationError(
      `Image area (${effectiveArea} pixels) exceeds the maximum allowed limit of 64,000,000 pixels.`
    );
  }

  return {
    format: metadata.format,
    effectiveWidth,
    effectiveHeight,
    orientation,
  };
}

/**
 * Generates an orientation-corrected, metadata-stripped WebP derivative.
 * Used for both artwork exhibition derivatives and public avatar images.
 */
export async function createPublicDerivative(
  buffer: Buffer,
  maxDimension: number = MAX_ARTWORK_DERIVATIVE_DIMENSION,
  quality = 85
): Promise<ProcessedImageResult> {
  // 1. Validate source metadata first
  await validateSourceImageMetadata(buffer);

  // 2. Process with Sharp
  // - limitInputPixels safeguards decoder
  // - .rotate() applies EXIF orientation to pixel matrix and resets orientation tag
  // - .resize() bounds within maxDimension x maxDimension without enlargement
  // - .webp() converts to WebP; EXIF, GPS, IPTC, and XMP metadata are NOT preserved
  const derivative = await sharp(buffer, {
    limitInputPixels: MAX_TOTAL_PIXELS,
    failOn: "error",
  })
    .rotate() // Applies EXIF orientation to pixels
    .resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: derivative.data,
    width: derivative.info.width,
    height: derivative.info.height,
    sizeBytes: derivative.info.size,
    format: "webp",
  };
}
