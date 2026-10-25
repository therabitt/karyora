/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const http = require("http");
const path = require("path");

const artifactDir = "/home/therabitt/.gemini/antigravity/brain/9109ef21-9891-4e15-9cec-4a517402d531";

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, () => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  let activePort = 3000;
  if (await checkPort(3001)) {
    activePort = 3001;
  } else if (await checkPort(3000)) {
    activePort = 3000;
  }
  console.log(`Using active port: ${activePort}`);

  const captures = [
    {
      name: "palette_forest_spirits_gaze",
      url: `http://localhost:${activePort}/artworks/the-forest-spirits-gaze`,
      width: 1440,
      height: 900,
      delay: 3500,
    },
    {
      name: "palette_solitude_in_crimson",
      url: `http://localhost:${activePort}/artworks/solitude-in-crimson`,
      width: 1440,
      height: 900,
      delay: 3500,
    },
    {
      name: "palette_beautiful_rythm",
      url: `http://localhost:${activePort}/artworks/beautiful-rythm`,
      width: 1440,
      height: 900,
      delay: 3500,
    },
  ];

  console.log("Starting palette verification captures...");

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

  console.log("All palette verification captures completed!");
}

main();

