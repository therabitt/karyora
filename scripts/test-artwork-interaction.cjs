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

const {
  getSwipeDirection,
  getWheelDirection,
  shouldHandleArtworkKeyboardNavigation,
} = loaded.exports;

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


// Keyboard navigation works immediately from the page body, with no
// click or focus action required on the artwork stage.
const keyboardContext = {
  key: "ArrowRight",
  defaultPrevented: false,
  modifierPressed: false,
  navigationOpen: false,
  artworkCount: 9,
  editableTarget: false,
  interactiveTarget: false,
  interactiveTargetWithinStage: false,
};
assert.equal(shouldHandleArtworkKeyboardNavigation(keyboardContext), true);

// A plain link or button outside a composite widget does not disable global
// arrow navigation because those controls have no native left/right semantics.
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, interactiveTarget: false }),
  true,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, key: "ArrowLeft" }),
  true,
);

// A focused artwork preview/button inside the stage still supports arrow navigation.
assert.equal(
  shouldHandleArtworkKeyboardNavigation({
    ...keyboardContext,
    interactiveTarget: true,
    interactiveTargetWithinStage: true,
  }),
  true,
);

// Do not hijack typing, browser-modified shortcuts, an open navigation menu, or
// arrow-key interactions belonging to composite widgets outside the artwork stage.
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, editableTarget: true }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, modifierPressed: true }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, navigationOpen: true }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({
    ...keyboardContext,
    interactiveTarget: true,
    interactiveTargetWithinStage: false,
  }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, defaultPrevented: true }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, artworkCount: 1 }),
  false,
);
assert.equal(
  shouldHandleArtworkKeyboardNavigation({ ...keyboardContext, key: "Enter" }),
  false,
);

console.log("Artwork interaction checks passed: swipe direction, axis dominance, wheel thresholds, keyboard scope, and invalid input.");
