/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/gallery/artwork-interaction.ts");
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

const { getSwipeDirection, getWheelDirection } = loaded.exports;

// Swiping left advances; swiping right goes back.
assert.equal(getSwipeDirection(180, 100, 100, 104), "next");
assert.equal(getSwipeDirection(100, 100, 180, 104), "previous");

// Ignore taps, small motion, and predominantly vertical gestures.
assert.equal(getSwipeDirection(10, 10, 45, 11), null);
assert.equal(getSwipeDirection(10, 10, 110, 100), null);
assert.equal(getSwipeDirection(10, 10, 110, 40), "previous");

// Invalid values and invalid thresholds fail closed.
assert.equal(getSwipeDirection(Number.NaN, 0, 100, 0), null);
assert.equal(getSwipeDirection(0, 0, 100, 0, -1), null);
assert.equal(getSwipeDirection(0, 0, 100, 0, 48, 0.5), null);

// Small wheel deltas wait for accumulation; the threshold chooses the direction.
assert.equal(getWheelDirection(20), null);
assert.equal(getWheelDirection(55), "next");
assert.equal(getWheelDirection(-80), "previous");
assert.equal(getWheelDirection(0), null);
assert.equal(getWheelDirection(Number.POSITIVE_INFINITY), null);
assert.equal(getWheelDirection(60, -1), null);

console.log("Artwork interaction checks passed: swipe direction, axis dominance, wheel thresholds, and invalid input.");
