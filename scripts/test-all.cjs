/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");

console.log("=================================================");
console.log(" KARYORA VERIFICATION TEST RUNNER ");
console.log("=================================================\n");

const tests = [
  { name: "Image Pipeline", path: "scripts/test-image-pipeline.cjs" },
  { name: "Inquiry Logic & Rate Limiting", path: "scripts/test-inquiry-logic.cjs" },
  { name: "Inquiry State Lifecycle Transitions", path: "scripts/test-inquiry-transitions.cjs" },
];

let failed = 0;

for (const test of tests) {
  console.log(`[TEST SUITE] ${test.name}`);
  try {
    execSync(`node ${test.path}`, { stdio: "inherit" });
    console.log(`PASS: ${test.name}\n`);
  } catch {
    console.error(`FAIL: ${test.name}\n`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} test suite(s) failed.`);
  process.exit(1);
} else {
  console.log("=================================================");
  console.log(" ✅ ALL TEST SUITES PASSED CLEANLY!");
  console.log("=================================================");
}
