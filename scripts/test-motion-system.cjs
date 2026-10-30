/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/motion/motion-tokens.ts");
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
  parseCssTimeToMs,
  getMotionStaggerDelay,
  getStaggerDelayExpression,
  getSliceStaggerRank,
  getSliceStaggerDelay,
  getCubicBezierProgress,
} = loaded.exports;

assert.equal(parseCssTimeToMs("180ms", 0), 180);
assert.equal(parseCssTimeToMs("0.72s", 0), 720);
assert.equal(parseCssTimeToMs("invalid", 123), 123);
assert.equal(parseCssTimeToMs("-20ms", 123), 123);
assert.equal(getMotionStaggerDelay(0, 58, 232), 0);
assert.equal(getMotionStaggerDelay(1, 58, 232), 58);
assert.equal(getMotionStaggerDelay(4, 58, 232), 232);
assert.equal(getMotionStaggerDelay(9, 58, 232), 232);
assert.equal(getMotionStaggerDelay(Number.NaN, 58, 232), 0);
assert.equal(getStaggerDelayExpression(0, "--motion-stagger-slice-step"), "0ms");
assert.equal(
  getStaggerDelayExpression(3, "--motion-stagger-slice-step"),
  "calc(var(--motion-stagger-slice-step) + var(--motion-stagger-slice-step) + var(--motion-stagger-slice-step))",
);

assert.deepEqual([0, 1, 2, 3, 4].map((index) => getSliceStaggerRank(index, 5)), [2, 1, 0, 1, 2]);
assert.deepEqual(
  [0, 1, 2, 3, 4].map((index) => getSliceStaggerDelay(index, 5, "next", 60, 12)),
  [120, 60, 0, 72, 132],
);
assert.deepEqual(
  [0, 1, 2, 3, 4].map((index) => getSliceStaggerDelay(index, 5, "previous", 60, 12)),
  [132, 72, 0, 60, 120],
);
assert.deepEqual(
  [0, 1, 2, 3, 4].map((index) => getSliceStaggerDelay(index, 5, "next", 60, 12, true)),
  [12, 72, 120, 60, 0],
);
assert.equal(getSliceStaggerRank(-1, 5), 0);
assert.equal(getSliceStaggerDelay(-1, 5, "next", 60, 12), 0);

const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
const doc = fs.readFileSync(path.join(__dirname, "../docs/design/motion-system.md"), "utf8");
const slicedShowcase = fs.readFileSync(
  path.join(__dirname, "../src/components/gallery/AlanMenkenShowcase.tsx"),
  "utf8",
);
assert.match(
  slicedShowcase,
  /isSliceLayoutChange\s*\?\s*"z-30"\s*:\s*"z-10"/,
  "Same-layout Sliced transitions must render incoming strips above outgoing strips so old panels cannot mask the shared timing",
);
const tokenLines = [...css.matchAll(/^\s*(--motion-[\w-]+):\s*([^;]+);/gm)];
const motionTokens = new Map(tokenLines.map(([, token, value]) => [token, value.trim()]));

const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
assert.equal(motionTokens.get("--motion-ease-standard"), easing);
assert.equal(motionTokens.get("--motion-ease-out"), "cubic-bezier(0.16, 1, 0.3, 1)");
assert.equal(motionTokens.get("--motion-ease-in"), "cubic-bezier(0.7, 0, 0.84, 0)");
assert.equal(motionTokens.get("--motion-ease-spring"), "cubic-bezier(0.22, 1.12, 0.36, 1)");
assert.equal(motionTokens.has("--motion-ease-unified-experiment"), false);
assert.equal(getCubicBezierProgress(0, easing), 0);
assert.equal(getCubicBezierProgress(1, easing), 1);
assert.ok(getCubicBezierProgress(0.25, easing) > 0.25);
assert.ok(getCubicBezierProgress(0.75, easing) > getCubicBezierProgress(0.25, easing));
assert.equal(getCubicBezierProgress(0.4, "linear"), 0.4);

assert.equal(motionTokens.get("--motion-duration-micro"), "225ms");
assert.equal(motionTokens.get("--motion-duration-ui"), "350ms");
assert.equal(motionTokens.get("--motion-duration-navigation"), "575ms");
assert.equal(motionTokens.get("--motion-duration-slice-panel"), "850ms");
assert.equal(motionTokens.get("--motion-delay-slice-handoff"), "1050ms");
assert.ok(
  parseCssTimeToMs(motionTokens.get("--motion-delay-slice-handoff"), 0) >=
    parseCssTimeToMs(motionTokens.get("--motion-duration-slice-panel"), 0) +
      Math.floor((5 - 1) / 2) * parseCssTimeToMs(motionTokens.get("--motion-stagger-slice-step"), 0) +
      parseCssTimeToMs(motionTokens.get("--motion-stagger-slice-tie"), 0) + 60,
  "Sliced incoming panels must wait until outgoing panels finish plus a clearance margin",
);
assert.equal(motionTokens.get("--motion-duration-detail-exit-total"), "850ms");
assert.equal(motionTokens.get("--motion-duration-detail-enter-total"), "1000ms");
assert.equal(motionTokens.get("--motion-duration-reduced"), "120ms");
assert.equal(motionTokens.get("--motion-duration-ribbon-focus"), "1250ms");
assert.equal(motionTokens.get("--motion-duration-ribbon-near"), "1120ms");
assert.equal(motionTokens.get("--motion-duration-ribbon-middle"), "1000ms");
assert.equal(motionTokens.get("--motion-duration-ribbon-far"), "900ms");
const ribbonFocusEasing = "cubic-bezier(0.72, 0, 0.28, 1)";
assert.equal(motionTokens.get("--motion-ease-ribbon-focus"), ribbonFocusEasing);
const ribbonQuarterProgress = getCubicBezierProgress(0.25, ribbonFocusEasing);
const ribbonMidpointProgress = getCubicBezierProgress(0.5, ribbonFocusEasing);
const ribbonThreeQuarterProgress = getCubicBezierProgress(0.75, ribbonFocusEasing);
assert.ok(ribbonQuarterProgress < 0.12, "Ribbon focus should ease into motion deliberately");
assert.ok(Math.abs(ribbonMidpointProgress - 0.5) < 0.001, "Ribbon focus should accelerate through a balanced midpoint");
assert.ok(ribbonThreeQuarterProgress > 0.88, "Ribbon focus should settle with a clear ease-out");
assert.ok(
  parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-focus"), 0) >
    parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-near"), 0),
  "The focused Ribbon artwork must have the longest transition duration",
);
assert.ok(
  parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-near"), 0) >
    parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-middle"), 0),
  "Near Ribbon panels should settle after middle-distance panels",
);
assert.ok(
  parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-middle"), 0) >
    parseCssTimeToMs(motionTokens.get("--motion-duration-ribbon-far"), 0),
  "Middle-distance Ribbon panels should settle after far panels",
);
assert.ok(tokenLines.length >= 20, "Expected a documented set of canonical motion tokens");
for (const [, token, value] of tokenLines) {
  assert.ok(doc.includes("`" + token + "`"), "Missing documentation for " + token);
  assert.ok(value.trim(), "Empty motion token: " + token);
}

console.log("Motion system checks passed: token parsing, stagger sequence, easing progress, and documentation coverage.");
