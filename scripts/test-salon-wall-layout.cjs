/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.join(__dirname, "..");

function loadModule(relativePath) {
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loaded = new Module(sourcePath, module);
  loaded.filename = sourcePath;
  loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
  loaded._compile(compiled, sourcePath);
  return loaded.exports;
}

const {
  buildSalonWallLayout,
  getSalonWallAspect,
} = loadModule("src/lib/gallery/salon-wall-layout.ts");
const {
  getDefaultCamera,
  getFocusCamera,
  getOverviewCamera,
  getPanBounds,
  getPanForIndex,
  getWallCamera,
  SALON_WALL_STEP_SCALE,
} = loadModule("src/lib/gallery/salon-wall-camera.ts");

/**
 * Production-like fixture: the 19 real published slugs, deliberately none of
 * them from the old 22-slug curated manifest. This is the case the previous
 * test missed.
 */
const PRODUCTION_ASPECTS = [
  0.72, 2.16, 1.28, 0.69, 0.74, 1.9, 0.72, 0.69, 0.84, 0.98, 1.28, 1.43,
  2.0, 1.45, 1.0, 1.0, 1.48, 0.73, 0.52,
];
const PRODUCTION_SLUGS = [
  "the-crucifixion-with-the-virgin-and-saint-john",
  "the-creation-of-adam",
  "self-portrait-vincent-van-gogh-1889",
  "portrait-of-a-young-man",
  "portrait-of-pope-julius-ii",
  "guernica",
  "the-old-guitarist",
  "mona-lisa",
  "lute-player",
  "les-demoiselles-davignon",
  "impression-sunrise",
  "fine-wind-clear-morning-red-fuji",
  "the-creation-of-the-sun-moon-and-vegetation",
  "cleopatra-artemisia-gentileschi",
  "a-roman-triumph",
  "a-female-saint",
  "water-lily-pond-evening-right-panel",
  "super-woman",
  "beautiful-rythm",
];

function makeArtwork(index, aspect, slug) {
  return {
    id: `art-${index}`,
    title: `Artwork ${index}`,
    slug: slug || `production-work-${index}`,
    image_width: Math.max(1, Math.round(1000 * aspect)),
    image_height: 1000,
    public_image_path: `artworks-public/artworks/art-${index}/v1.webp`,
  };
}

const productionArtworks = PRODUCTION_ASPECTS.map((aspect, index) =>
  makeArtwork(index + 1, aspect, PRODUCTION_SLUGS[index]),
);

const VIEWPORTS = [
  [360, 740],
  [390, 844],
  [768, 900],
  [1024, 768],
  [1280, 820],
  [1440, 900],
  [1694, 787],
];

function visiblePieces(layout, camera, viewport) {
  return layout.pieces.filter((piece) => {
    const left = piece.left * camera.scale + camera.tx;
    const top = piece.top * camera.scale + camera.ty;
    const right = (piece.left + piece.width) * camera.scale + camera.tx;
    const bottom = (piece.top + piece.height) * camera.scale + camera.ty;
    return right > 0 && left < viewport.width && bottom > 0 && top < viewport.height;
  }).length;
}

function verifyLayout(layout, artworks, stageWidth, stageHeight, label) {
  assert.equal(
    layout.pieces.length,
    artworks.length,
    `${label}: every artwork must be placed`,
  );
  assert.equal(layout.stageWidth, Math.max(320, stageWidth));
  assert.equal(layout.stageHeight, Math.max(320, stageHeight));
  assert.ok(layout.sceneWidth > 0);
  assert.ok(layout.sceneHeight > 0);

  const rowCounts = new Map();
  const clusters = new Set();
  for (const piece of layout.pieces) {
    assert.ok(Number.isFinite(piece.left) && Number.isFinite(piece.top));
    assert.ok(Number.isFinite(piece.width) && Number.isFinite(piece.height));
    assert.ok(piece.width > 0 && piece.height > 0);
    assert.ok(piece.mediaWidth > 0 && piece.mediaHeight > 0);
    assert.ok(
      Math.abs(piece.mediaWidth / piece.mediaHeight - piece.aspect) < 0.02,
      `${label}: ${piece.artwork.slug} keeps its aspect ratio`,
    );
    assert.ok(piece.left >= 0);
    assert.ok(piece.top >= 0);
    assert.ok(piece.left + piece.width <= layout.sceneWidth + 1);
    assert.ok(piece.top + piece.height <= layout.sceneHeight + 1);
    assert.ok(["anchor", "supporting", "accent"].includes(piece.role));
    assert.ok(piece.clusterId.length > 0);
    assert.ok(piece.readingOrder >= 0);
    rowCounts.set(piece.row, (rowCounts.get(piece.row) || 0) + 1);
    clusters.add(piece.clusterId);
  }

  for (let first = 0; first < layout.pieces.length; first += 1) {
    for (let second = first + 1; second < layout.pieces.length; second += 1) {
      const a = layout.pieces[first];
      const b = layout.pieces[second];
      const overlapsX = a.left < b.left + b.width && a.left + a.width > b.left;
      const overlapsY = a.top < b.top + b.height && a.top + a.height > b.top;
      assert.ok(
        !overlapsX || !overlapsY,
        `${label}: ${a.artwork.slug} overlaps ${b.artwork.slug}`,
      );
    }
  }

  assert.equal(
    JSON.stringify(buildSalonWallLayout(artworks, { stageWidth, stageHeight })),
    JSON.stringify(layout),
    `${label}: layout must be deterministic`,
  );

  return { rowCounts, clusters };
}

// 1. The real production collection must produce a composed salon wall.
{
  const layout = buildSalonWallLayout(productionArtworks, {
    stageWidth: 1694,
    stageHeight: 787,
  });
  const { rowCounts, clusters } = verifyLayout(
    layout,
    productionArtworks,
    1694,
    787,
    "production",
  );

  assert.equal(layout.rowCount, 3, "19 works should compose into 3 registers");
  assert.ok(clusters.size >= 4, "the wall must have multiple clusters");
  assert.ok(
    (rowCounts.get(0) || 0) >= 5,
    "top register should be populated",
  );
  assert.ok(
    (rowCounts.get(1) || 0) >= 5,
    "eye-level register should be populated",
  );
  assert.ok(
    (rowCounts.get(2) || 0) >= 5,
    "lower register should be populated",
  );
  const registerSizes = [0, 1, 2].map((row) => rowCounts.get(row) || 0);
  assert.ok(
    Math.max(...registerSizes) - Math.min(...registerSizes) <= 2,
    "registers should be balanced",
  );
  assert.ok(
    layout.sceneWidth <= layout.stageWidth * 1.6,
    "desktop wall must stay compact",
  );
  assert.ok(
    layout.pieces.some((piece) => piece.role === "anchor"),
    "the wall needs anchor works",
  );
  assert.ok(
    layout.pieces.some((piece) => piece.role === "supporting"),
    "the wall needs supporting works",
  );
  assert.ok(
    layout.pieces.some((piece) => piece.role === "accent"),
    "the wall needs accent works",
  );

  const overview = getOverviewCamera(layout, { width: 1694, height: 787 });
  assert.ok(
    overview.scale > 0.5 && overview.scale <= 1,
    "the desktop overview should fit the hang",
  );
  assert.ok(overview.tx >= 0 && overview.ty >= 0);
  assert.equal(
    visiblePieces(layout, overview, { width: 1694, height: 787 }),
    productionArtworks.length,
    "the desktop overview should show every artwork",
  );
  assert.ok(
    getPanBounds(layout, SALON_WALL_STEP_SCALE, {
      width: 1694,
      height: 787,
    }).max > 0,
    "the step-in wall view must have side content to scroll to",
  );

  // Every frame must be reachable and legible in focus mode.
  for (let index = 0; index < layout.pieces.length; index += 1) {
    const piece = layout.pieces[index];
    const camera = getFocusCamera(layout, index, { width: 1694, height: 787 });
    assert.ok(Number.isFinite(camera.scale) && Number.isFinite(camera.tx));
    assert.ok(camera.scale >= 0.55 && camera.scale <= 8);
    assert.ok(piece.width * camera.scale <= 1694 * 0.56 + 1);
    assert.ok(piece.height * camera.scale <= 787 * 0.72 + 1);
  }
}

// 2. Responsive default framing: desktop overview, tablet/phone band.
for (const [width, height] of VIEWPORTS) {
  const layout = buildSalonWallLayout(productionArtworks, {
    stageWidth: width,
    stageHeight: height,
  });
  verifyLayout(layout, productionArtworks, width, height, `${width}x${height}`);

  const defaultCamera = getDefaultCamera(layout, { width, height });
  const camera =
    defaultCamera.mode === "overview"
      ? getOverviewCamera(layout, { width, height })
      : getWallCamera(
          layout,
          defaultCamera.pan,
          defaultCamera.scale,
          { width, height },
        );
  const visible = visiblePieces(layout, camera, { width, height });

  if (width >= 1024) {
    assert.equal(defaultCamera.mode, "overview");
    assert.ok(visible >= 16, `${width}x${height}: overview must show most works`);
  } else {
    assert.equal(defaultCamera.mode, "wall");
    assert.ok(visible >= 4, `${width}x${height}: mobile band must show several works`);
  }
}

// 3. Wall panning must clamp at both ends and never wrap.
{
  const layout = buildSalonWallLayout(productionArtworks, {
    stageWidth: 1024,
    stageHeight: 768,
  });
  const bounds = getPanBounds(layout, 1, { width: 1024, height: 768 });
  assert.equal(typeof bounds.max, "number");
  assert.equal(getWallCamera(layout, -10000, 1, { width: 1024, height: 768 }).tx, 0);
  assert.ok(
    Math.abs(
      getWallCamera(layout, 10000, 1, { width: 1024, height: 768 }).tx +
        bounds.max,
    ) < 0.001,
  );
  const centered = getPanForIndex(layout, 5, 1, { width: 1024, height: 768 });
  assert.ok(centered >= bounds.min && centered <= bounds.max);
}

// 4. A new artwork must join the wall without overlap or invalid geometry.
{
  const newArtwork = makeArtwork(99, 0.8, "a-new-published-work");
  const layout = buildSalonWallLayout(
    [...productionArtworks, newArtwork],
    { stageWidth: 1440, stageHeight: 900 },
  );
  verifyLayout(
    layout,
    [...productionArtworks, newArtwork],
    1440,
    900,
    "new artwork",
  );
  assert.ok(layout.pieces.some((piece) => piece.artwork.id === "art-99"));
}

// 5. Tiny and large collections must stay finite.
for (const count of [1, 2, 7, 12, 50]) {
  const artworks = Array.from({ length: count }, (_, index) =>
    makeArtwork(index + 1, 0.6 + (index % 5) * 0.35, `work-${index + 1}`),
  );
  const layout = buildSalonWallLayout(artworks, {
    stageWidth: 1440,
    stageHeight: 900,
  });
  verifyLayout(layout, artworks, 1440, 900, `${count} works`);
}

// 6. Legacy rows without stored dimensions fall back to natural aspect.
{
  const legacy = makeArtwork(1, 1, "legacy-work");
  legacy.image_width = null;
  legacy.image_height = null;
  const withNatural = buildSalonWallLayout([legacy], {
    stageWidth: 1440,
    stageHeight: 900,
    naturalAspects: { "art-1": 1.25 },
  });
  assert.equal(withNatural.pieces[0].aspect, 1.25);
  const withoutNatural = buildSalonWallLayout([legacy], {
    stageWidth: 1440,
    stageHeight: 900,
  });
  assert.equal(withoutNatural.pieces[0].aspect, 0.72);
  assert.equal(getSalonWallAspect(makeArtwork(1, 2), undefined), 2);
}

console.log(
  "Salon Wall checks passed: production-like composition, 3 registers, clusters, deterministic layout, overview fit, responsive bands, pan bounds, focus framing, new/tiny/large collections, and aspect fallback.",
);
