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

function makeArtwork(index, width, height) {
  return {
    id: `art-${index}`,
    title: `Artwork ${index}`,
    slug: `artwork-${index}`,
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
const artworks = aspects.map(([width, height], index) =>
  makeArtwork(index + 1, width, height),
);

const stage = { stageWidth: 1440, stageHeight: 828 };
const layout = buildCameraWallLayout(artworks, stage);

// The complete archive is one continuous wall.
assert.equal(layout.pieces.length, 22);
assert.ok(layout.sceneWidth > layout.stageWidth, "wall must be wider than the stage");
assert.ok(layout.panMax > layout.panMin, "camera must have a pan range");
assert.equal(layout.panMin, 0);
assert.equal(layout.panMax, layout.sceneWidth - stage.stageWidth);
assert.equal(layout.initialPan, 0);

// Every frame stays inside the stage vertically and preserves its artwork ratio.
for (const piece of layout.pieces) {
  assert.ok(piece.top >= 0, `${piece.artwork.id} top is inside the stage`);
  assert.ok(
    piece.top + piece.height <= stage.stageHeight,
    `${piece.artwork.id} bottom is inside the stage`,
  );
  assert.ok(piece.mediaWidth > 0 && piece.mediaHeight > 0);
  assert.ok(
    Math.abs(piece.mediaWidth / piece.mediaHeight - piece.aspect) < 0.001,
    `${piece.artwork.id} media keeps the artwork aspect ratio`,
  );
  assert.ok(piece.width > 0 && piece.height > 0);
}

// The row is ordered, non-overlapping, and deterministic.
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
);

// The hang is varied, not a uniform grid.
assert.ok(new Set(layout.pieces.map((piece) => Math.round(piece.height))).size > 4);
assert.ok(new Set(layout.pieces.map((piece) => piece.rotation)).size > 2);
assert.ok(new Set(layout.pieces.map((piece) => piece.frameColor)).size === 3);

// The camera centers a chosen frame and clamps to the ends of the wall.
const centered = getWallCamera(layout, getPanForIndex(layout, 4));
assert.equal(centered.scale, 1);
assert.ok(Math.abs(layout.pieces[4].centerX + centered.tx - stage.stageWidth / 2) < 0.001);
assert.equal(getWallCamera(layout, -100000).pan, layout.panMin);
assert.equal(getWallCamera(layout, 100000).pan, layout.panMax);

// Zoom targets the frame at the camera's focal point and never shrinks it.
for (const index of [0, 5, 8, 21]) {
  const piece = layout.pieces[index];
  const camera = getFocusCamera(layout, index);
  assert.ok(camera.scale >= 1.02);
  assert.ok(Math.abs(piece.centerX * camera.scale + camera.tx - stage.stageWidth * 0.59) < 0.5);
  assert.ok(Math.abs(piece.centerY * camera.scale + camera.ty - stage.stageHeight * 0.46) < 0.5);
  assert.ok(piece.width * camera.scale <= stage.stageWidth * 0.56 + 0.5);
  assert.ok(piece.height * camera.scale <= stage.stageHeight * 0.76 + 0.5);
}

// Mobile uses the compact focal point and keeps a usable foot.
const mobile = { stageWidth: 390, stageHeight: 772 };
const mobileLayout = buildCameraWallLayout(artworks, mobile);
const mobileFocus = getFocusCamera(mobileLayout, 5);
assert.ok(
  Math.abs(
    mobileLayout.pieces[5].centerX * mobileFocus.scale +
      mobileFocus.tx -
      mobile.stageWidth / 2,
  ) < 0.5,
);
assert.ok(
  mobileLayout.pieces[5].width * mobileFocus.scale <=
    mobile.stageWidth * 0.9 + 0.5,
);

// Legacy rows without dimensions use the natural aspect fallback.
assert.equal(getCameraAspectRatio(makeArtwork(1, 1600, 800)), 2);
assert.equal(getCameraAspectRatio(makeArtwork(1, null, null), 1.5), 1.5);
assert.equal(getCameraAspectRatio(makeArtwork(1, null, null)), 0.72);
const legacy = buildCameraWallLayout(
  [{ ...makeArtwork(1, null, null) }],
  { ...stage, naturalAspects: { "art-1": 1.25 } },
);
assert.equal(legacy.pieces[0].aspect, 1.25);

console.log(
  "Camera wall checks passed: continuous row, frame geometry, pan bounds, zoom focal point, mobile, and natural-aspect fallback.",
);
