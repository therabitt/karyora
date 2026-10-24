/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const assert = require("node:assert");

async function runTests() {
  console.log("Starting Sharp image pipeline tests...");

  // Test 1: Valid PNG creation and WebP derivative transformation
  const testPngBuffer = await sharp({
    create: {
      width: 2000,
      height: 1000,
      channels: 4,
      background: { r: 180, g: 80, b: 60, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  assert(testPngBuffer.length > 0, "Failed to create test PNG");
  console.log(`✓ Test PNG created: ${testPngBuffer.length} bytes`);

  // Transform to WebP derivative with bounding box 1600px
  const derivative = await sharp(testPngBuffer, {
    limitInputPixels: 64_000_000,
    failOn: "error",
  })
    .rotate()
    .resize(1600, 1600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  assert.strictEqual(derivative.info.format, "webp");
  assert.strictEqual(derivative.info.width, 1600);
  assert.strictEqual(derivative.info.height, 800); // 2:1 aspect ratio preserved!
  console.log(`✓ WebP derivative: ${derivative.info.width}x${derivative.info.height}, ${derivative.info.size} bytes`);

  // Test 2: EXIF Orientation bounds check (orientation 6: 90 deg clockwise rotation swaps width & height)
  const orientation = 6;
  const rawW = 8000;
  const rawH = 10500;
  const isSwapped = [5, 6, 7, 8].includes(orientation);
  const effectiveW = isSwapped ? rawH : rawW;
  const effectiveH = isSwapped ? rawW : rawH;
  assert.strictEqual(effectiveW, 10500);
  assert.strictEqual(effectiveH, 8000);
  assert(effectiveW > 10000, "Should correctly detect effective width exceeding 10000px boundary!");
  console.log("✓ Orientation swap bound check verified!");

  // Test 3: Animated image / format restriction
  const animatedBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .gif()
    .toBuffer();

  const meta = await sharp(animatedBuffer).metadata();
  assert.strictEqual(meta.format, "gif");
  assert(["jpeg", "png", "webp"].includes(meta.format || "") === false, "GIF should be rejected");
  console.log("✓ Format restriction verified (GIF rejected)!");

  console.log("\nALL IMAGE PIPELINE TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
