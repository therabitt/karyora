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

  const testCases = [
    {
      name: "palette_monochrome_rose_verified",
      slug: "monochrome-rose",
      category: "Monochrome Rose (Architectural Graphite & Silver Mist Verification)",
    },
    {
      name: "palette_unleashed_madness",
      slug: "unleashed-madness",
      category: "Vivid Acid Green + Electric Violet (High-Chroma Clash)",
    },
    {
      name: "palette_frieren_separated",
      slug: "frieren",
      category: "Celestial Moonstone Slate + Chrono Gold (Resolved Cluster)",
    },
    {
      name: "palette_lilith_crimson",
      slug: "lilith",
      category: "Gothic Obsidian Crimson + Blood Rose (Resolved Cluster)",
    },
    {
      name: "palette_butterfly_coral",
      slug: "butterfly-woman",
      category: "Coral Crimson Metamorphosis (Resolved Green Collision)",
    },
    {
      name: "palette_eyes_rearview",
      slug: "eyes-on-the-rearview",
      category: "Retro Vermilion Sunset (Rich Warm Terrestrial)",
    },
    {
      name: "palette_beautiful_woman_neutral",
      slug: "beautiful-woman",
      category: "Graphite Slate (Architectural Neutral / Monochrome)",
    },
  ];

  console.log("Starting expanded palette verification captures...");

  for (const tc of testCases) {
    const url = `http://localhost:${activePort}/artworks/${tc.slug}`;
    const outputPath = path.join(artifactDir, `${tc.name}.png`);
    console.log(`\nCapturing [${tc.category}] from ${url}...`);

    const tmpProfile = `/tmp/chromium-cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cmd = `/usr/bin/chromium --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage --user-data-dir=${tmpProfile} --hide-scrollbars --window-size=1440,900 --run-all-compositor-stages-before-draw --virtual-time-budget=3500 --screenshot="${outputPath}" "${url}"`;

    try {
      execSync(cmd, { stdio: "inherit" });
      console.log(`  ✓ Saved: ${outputPath}`);
    } catch (err) {
      console.error(`  ✗ Failed to capture ${tc.name}:`, err.message);
    }
  }

  console.log("\nAll expanded palette verification captures completed!");
}

main();
