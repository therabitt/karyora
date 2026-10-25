/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/gallery/artwork-layout.ts");
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
  fitArtworkWithinBounds,
  getArtworkWindow,
  getResponsivePanelCount,
  resolveArtworkDimensions,
} = loaded.exports;

function assertAspectPreserved(source, fitted, tolerance = 0.015) {
  const sourceRatio = source.width / source.height;
  const fittedRatio = fitted.width / fitted.height;
  assert.ok(
    Math.abs(sourceRatio - fittedRatio) <= tolerance,
    "Aspect ratio changed: source " + sourceRatio + ", fitted " + fittedRatio,
  );
}

const portrait = fitArtworkWithinBounds(900, 1400, 420, 500);
assert.ok(portrait.width <= 420 && portrait.height <= 500);
assertAspectPreserved({ width: 900, height: 1400 }, portrait);

const landscape = fitArtworkWithinBounds(1800, 900, 640, 500);
assert.ok(landscape.width <= 640 && landscape.height <= 500);
assertAspectPreserved({ width: 1800, height: 900 }, landscape);

const square = fitArtworkWithinBounds(1000, 1000, 300, 500);
assert.deepEqual(square, { width: 300, height: 300 });

assert.deepEqual(resolveArtworkDimensions(null, undefined), { width: 3, height: 4 });
assert.deepEqual(
  getArtworkWindow(9, 0, 9).map((entry) => entry.index),
  [5, 6, 7, 8, 0, 1, 2, 3, 4],
);
assert.deepEqual(
  getArtworkWindow(5, 0, 9).map((entry) => entry.index),
  [3, 4, 0, 1, 2],
);
assert.deepEqual(
  getArtworkWindow(4, 0, 9).map((entry) => entry.index),
  [2, 3, 0, 1],
);
assert.equal(getResponsivePanelCount(390, 21), 3);
assert.equal(getResponsivePanelCount(800, 21), 5);
assert.equal(getResponsivePanelCount(1100, 21), 7);
assert.equal(getResponsivePanelCount(1500, 21), 9);

console.log("Artwork layout checks passed: ratios, fallback dimensions, circular window, and panel counts.");
