/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const path = require("path");

const artifactDir = "/home/therabitt/.gemini/antigravity/brain/9109ef21-9891-4e15-9cec-4a517402d531";

const captures = [
  {
    name: "artwork_detail_kern_1440x900",
    url: "http://localhost:3000/artworks/solitude-in-crimson",
    width: 1440,
    height: 900,
    delay: 3000,
  },
  {
    name: "artwork_detail_kern_superwoman_1440x900",
    url: "http://localhost:3000/artworks/super-woman",
    width: 1440,
    height: 900,
    delay: 3000,
  },
  {
    name: "artwork_detail_kern_butterfly_1440x900",
    url: "http://localhost:3000/artworks/butterfly-woman",
    width: 1440,
    height: 900,
    delay: 3000,
  },
  {
    name: "artwork_detail_kern_1024x768",
    url: "http://localhost:3000/artworks/solitude-in-crimson",
    width: 1024,
    height: 768,
    delay: 3000,
  },
  {
    name: "artwork_detail_kern_768x1024",
    url: "http://localhost:3000/artworks/solitude-in-crimson",
    width: 768,
    height: 1024,
    delay: 3000,
  },
  {
    name: "artwork_detail_kern_390x844",
    url: "http://localhost:3000/artworks/solitude-in-crimson",
    width: 390,
    height: 844,
    delay: 3000,
  },
];

console.log("Starting KERN Inc. detail page verification captures...");

for (const cap of captures) {
  const outputPath = path.join(artifactDir, `${cap.name}.png`);
  console.log(`Capturing ${cap.name} (${cap.width}x${cap.height}) from ${cap.url}...`);

  const tmpProfile = `/tmp/chromium-cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cmd = `/usr/bin/chromium --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage --user-data-dir=${tmpProfile} --hide-scrollbars --window-size=${cap.width},${cap.height} --run-all-compositor-stages-before-draw --virtual-time-budget=${cap.delay} --screenshot="${outputPath}" "${cap.url}"`;

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`  ✓ Saved: ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ Failed to capture ${cap.name}:`, err.message);
  }
}

console.log("All KERN Inc. detail page captures completed!");
