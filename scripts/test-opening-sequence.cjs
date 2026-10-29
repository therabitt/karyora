/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadTypeScript(relativePath) {
  const sourcePath = path.join(__dirname, "..", relativePath);
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
  KARYORA_OPENING_SCENES,
  KARYORA_OPENING_SESSION_KEY,
  shouldPresentKaryoraOpening,
} = loadTypeScript("src/lib/opening-sequence.ts");
const {
  getRibbonCascadeDelay,
  getRibbonEntranceOriginX,
} = loadTypeScript("src/lib/gallery/ribbon-entrance.ts");

assert.equal(KARYORA_OPENING_SESSION_KEY, "karyora:opening:seen:v1");
assert.equal(KARYORA_OPENING_SCENES.length, 5);
assert.equal(KARYORA_OPENING_SCENES[0].id, "invitation");
assert.equal(KARYORA_OPENING_SCENES[4].id, "release");
assert.ok(KARYORA_OPENING_SCENES.every((scene) =>
  scene.id && scene.eyebrow && scene.headline && scene.description &&
  Number.isFinite(scene.durationMs) && scene.durationMs > 0
));
assert.ok(KARYORA_OPENING_SCENES.reduce((total, scene) => total + scene.durationMs, 680) >= 8000);
assert.equal(shouldPresentKaryoraOpening(true, false), true);
assert.equal(shouldPresentKaryoraOpening(false, false), false);
assert.equal(shouldPresentKaryoraOpening(true, true), false);
assert.equal(shouldPresentKaryoraOpening(false, true), false);

assert.equal(getRibbonCascadeDelay(0), 0);
assert.equal(getRibbonCascadeDelay(-1), 84);
assert.equal(getRibbonCascadeDelay(1), 120);
assert.equal(getRibbonCascadeDelay(-2), 166);
assert.equal(getRibbonCascadeDelay(2), 202);
assert.ok(getRibbonCascadeDelay(-1) < getRibbonCascadeDelay(1));
assert.ok(getRibbonCascadeDelay(1) < getRibbonCascadeDelay(-2));
assert.ok(getRibbonCascadeDelay(2) < getRibbonCascadeDelay(-3));
assert.ok(getRibbonCascadeDelay(-3) < getRibbonCascadeDelay(3));
assert.equal(getRibbonCascadeDelay(Number.NaN), 0);
assert.equal(getRibbonCascadeDelay(Number.POSITIVE_INFINITY), 0);

assert.equal(getRibbonEntranceOriginX(1200, 100, 200), 400);
assert.equal(getRibbonEntranceOriginX(1200, 400, 400), 0);
assert.equal(getRibbonEntranceOriginX(1200, 800, 200), -300);
assert.equal(getRibbonEntranceOriginX(0, 0, 0), 0);
assert.equal(getRibbonEntranceOriginX(1200, Number.NaN, 200), 0);
assert.equal(getRibbonEntranceOriginX(1200, 0, -1), 0);

console.log("Opening sequence checks passed: session gating, scene contract, deterministic cascade timing, and stage-centered panel origins.");
