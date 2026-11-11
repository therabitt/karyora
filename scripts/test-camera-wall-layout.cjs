/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(
  __dirname,
  "../src/lib/gallery/camera-wall-layout.ts",
);
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

const {
  buildCameraWallLayout,
  getCameraAspectRatio,
  getFocusCamera,
  getPanForIndex,
  getWallCamera,
} = loaded.exports;

function makeArtwork(index, width, height, slug = `artwork-${index}`) {
  return {
    id: `art-${index}`,
    title: `Artwork ${index}`,
    slug,
    image_width: width,
    image_height: height,
    public_image_path: `artworks-public/artworks/art-${index}/v1.webp`,
  };
}

const aspects = [
  [1600, 900],
  [1600, 900],
  [1359, 1600],
  [1600, 952],
  [1600, 1067],
  [946, 1600],
  [1600, 1133],
  [1600, 667],
  [1600, 900],
  [672, 1600],
  [1041, 1600],
  [889, 1600],
  [1120, 1600],
  [900, 1600],
  [1266, 1493],
  [1600, 900],
  [1057, 1600],
  [1600, 895],
  [1600, 900],
  [1095, 1600],
  [1059, 1600],
  [689, 1600],
];
const slugs = [
  "mafia-bikini-bottom",
  "monochrome-rose",
  "moonlit-netrunner",
  "the-blue-messenger",
  "a-distant-moon",
  "sunlit-melancholy",
  "pastel-selfie",
  "unleashed-madness",
  "eyes-on-the-rearview",
  "an-elegy-for-innocence",
  "the-forest-spirits-gaze",
  "witch-underworld",
  "lilith",
  "frieren",
  "solitude-in-crimson",
  "princess-of-fantasy-world",
  "super-woman",
  "butterfly-woman",
  "desert-woman",
  "girls",
  "beautiful-woman",
  "beautiful-rythm",
];
const artworks = aspects.map(([width, height], index) =>
  makeArtwork(index + 1, width, height, slugs[index]),
);

function verifyLayoutAt(stageWidth, stageHeight) {
  const stage = { stageWidth, stageHeight };
  const layout = buildCameraWallLayout(artworks, stage);

  assert.equal(layout.pieces.length, artworks.length);
  assert.ok(layout.sceneWidth > layout.stageWidth);
  assert.ok(layout.panMax > layout.panMin);
  assert.equal(layout.panMin, 0);
  assert.equal(layout.panMax, layout.sceneWidth - stage.stageWidth);
  assert.equal(layout.initialPan, 0);

  for (const piece of layout.pieces) {
    assert.ok(Number.isFinite(piece.left) && Number.isFinite(piece.top));
    assert.ok(Number.isFinite(piece.width) && Number.isFinite(piece.height));
    assert.ok(piece.top >= 0, `${piece.artwork.id} top is inside the stage`);
    assert.ok(
      piece.top + piece.height <= stage.stageHeight + 0.001,
      `${piece.artwork.id} bottom is inside the stage`,
    );
    assert.ok(piece.mediaWidth > 0 && piece.mediaHeight > 0);
    assert.ok(
      Math.abs(piece.mediaWidth / piece.mediaHeight - piece.aspect) < 0.001,
      `${piece.artwork.id} media keeps the artwork aspect ratio`,
    );
    assert.ok(piece.width > 0 && piece.height > 0);
    assert.ok(["anchor", "supporting", "accent"].includes(piece.role));
    assert.ok(piece.clusterId.length > 0);
  }

  for (let index = 1; index < layout.pieces.length; index += 1) {
    const previous = layout.pieces[index - 1];
    const current = layout.pieces[index];
    assert.ok(
      current.left >= previous.left + previous.width,
      "frames must not overlap horizontally",
    );
    assert.ok(current.left - (previous.left + previous.width) >= 16);
  }

  assert.equal(
    JSON.stringify(buildCameraWallLayout(artworks, stage)),
    JSON.stringify(layout),
    "curated placement must be deterministic",
  );

  const centeredIndex = Math.min(4, layout.pieces.length - 1);
  const centered = getWallCamera(layout, getPanForIndex(layout, centeredIndex));
  assert.equal(centered.scale, 1);
  assert.ok(
    Math.abs(
      layout.pieces[centeredIndex].centerX +
        centered.tx -
        stage.stageWidth / 2,
    ) < 0.001,
  );
  assert.equal(getWallCamera(layout, -100000).pan, layout.panMin);
  assert.equal(getWallCamera(layout, 100000).pan, layout.panMax);

  for (const index of [0, 5, 8, layout.pieces.length - 1]) {
    const piece = layout.pieces[index];
    const camera = getFocusCamera(layout, index);
    assert.ok(camera.scale >= 1.02);
    const focalX = stage.stageWidth * (stage.stageWidth < 1280 ? 0.5 : 0.59);
    const focalY = stage.stageHeight * (stage.stageWidth < 1280 ? 0.26 : 0.46);
    assert.ok(
      Math.abs(piece.centerX * camera.scale + camera.tx - focalX) < 0.5,
    );
    assert.ok(
      Math.abs(piece.centerY * camera.scale + camera.ty - focalY) < 0.5,
    );
    const maxWidth = stage.stageWidth * (stage.stageWidth < 1280 ? 0.9 : 0.56);
    const maxHeight = stage.stageHeight * (stage.stageWidth < 1280 ? 0.48 : 0.76);
    assert.ok(piece.width * camera.scale <= maxWidth + 0.5);
    assert.ok(piece.height * camera.scale <= maxHeight + 0.5);
  }

  return layout;
}

// Test all specified widths, including both sides of the compact breakpoint.
const viewports = [
  [360, 700],
  [390, 772],
  [768, 900],
  [1024, 768],
  [1279, 820],
  [1280, 820],
  [1440, 828],
];
const layouts = viewports.map(([width, height]) =>
  verifyLayoutAt(width, height),
);

// Curated metadata must create visual chapters and role hierarchy.
const desktop = layouts[layouts.length - 1];
assert.equal(new Set(desktop.pieces.map((piece) => piece.clusterId)).size, 6);
assert.ok(desktop.pieces.some((piece) => piece.role === "anchor"));
assert.ok(desktop.pieces.some((piece) => piece.role === "supporting"));
assert.ok(desktop.pieces.some((piece) => piece.role === "accent"));
assert.ok(
  new Set(desktop.pieces.map((piece) => piece.height.toFixed(1))).size > 8,
  "the wall should have a clear range of artwork scales",
);
assert.ok(
  desktop.pieces.some(
    (piece, index) =>
      index > 0 && piece.clusterId !== desktop.pieces[index - 1].clusterId,
  ),
  "cluster boundaries should be represented in the composition",
);

// The artwork must occupy clearly different vertical bands, not a single row.
const verticalCenters = desktop.pieces.map((piece) => piece.centerY / desktop.stageHeight);
assert.ok(
  Math.max(...verticalCenters) - Math.min(...verticalCenters) >= 0.45,
  "the Salon Wall must span upper, middle, and lower hanging positions",
);
for (const clusterId of new Set(desktop.pieces.map((piece) => piece.clusterId))) {
  const clusterPieces = desktop.pieces.filter((piece) => piece.clusterId === clusterId);
  const clusterCenters = clusterPieces.map((piece) => piece.centerY / desktop.stageHeight);
  assert.ok(
    Math.max(...clusterCenters) - Math.min(...clusterCenters) >= 0.2,
    `cluster ${clusterId} must have visible vertical composition`,
  );
}
assert.ok(
  desktop.pieces.some((piece) => piece.centerY / desktop.stageHeight < 0.3),
  "at least one work should hang in the upper band",
);
assert.ok(
  desktop.pieces.some((piece) => piece.centerY / desktop.stageHeight > 0.7),
  "at least one work should hang in the lower band",
);

// New work gets a deterministic fallback, without a schema change.
const newArtwork = makeArtwork(99, 1200, 1600, "a-new-published-work");
const fallbackA = buildCameraWallLayout([...artworks, newArtwork], {
  stageWidth: 1440,
  stageHeight: 828,
});
const fallbackB = buildCameraWallLayout([...artworks, newArtwork], {
  stageWidth: 1440,
  stageHeight: 828,
});
assert.deepEqual(
  fallbackA.pieces.at(-1),
  fallbackB.pieces.at(-1),
  "new-work fallback must be stable between renders",
);
assert.equal(fallbackA.pieces.at(-1).clusterId, "new-arrivals");
assert.ok(["anchor", "supporting", "accent"].includes(fallbackA.pieces.at(-1).role));

// Natural dimensions remain the fallback for legacy rows.
assert.equal(getCameraAspectRatio(makeArtwork(1, 1600, 800)), 2);
assert.equal(getCameraAspectRatio(makeArtwork(1, null, null), 1.5), 1.5);
assert.equal(getCameraAspectRatio(makeArtwork(1, null, null)), 0.72);
const legacy = buildCameraWallLayout(
  [{ ...makeArtwork(1, null, null) }],
  {
    stageWidth: 1440,
    stageHeight: 828,
    naturalAspects: { "art-1": 1.25 },
  },
);
assert.equal(legacy.pieces[0].aspect, 1.25);

console.log(
  "Salon Wall checks passed: curated clusters and roles, deterministic new-work fallback, preserved ratios, non-overlap, 7 viewport sizes, pan bounds, and focus camera.",
);
