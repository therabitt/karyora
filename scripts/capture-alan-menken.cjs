/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const artifactDir = "/home/therabitt/.gemini/antigravity/brain/9109ef21-9891-4e15-9cec-4a517402d531";

const chrome = spawn("/usr/bin/chromium", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "about:blank",
]);

setTimeout(async () => {
  try {
    const targets = await new Promise((resolve, reject) => {
      http
        .get("http://localhost:9222/json/list", (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(JSON.parse(data)));
        })
        .on("error", reject);
    });

    const page = targets.find((t) => t.type === "page") || targets[0];
    const wsUrl = page.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);

    ws.onopen = () => {
      let id = 1;
      const callbacks = new Map();
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && callbacks.has(data.id)) {
          const cb = callbacks.get(data.id);
          callbacks.delete(data.id);
          cb(data.result);
        }
      };

      const send = (method, params = {}) => {
        return new Promise((res) => {
          const reqId = id++;
          callbacks.set(reqId, res);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      };

      (async () => {
        await send("Page.enable");

        // 1. Desktop Mode A (Staggered Multi-Artwork Ribbons)
        await send("Emulation.setDeviceMetricsOverride", {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await send("Page.navigate", { url: "http://localhost:3000" });
        await new Promise((r) => setTimeout(r, 2200));

        let screenshot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          path.join(artifactDir, "alan_menken_mode_a_ribbons_1440x900.png"),
          Buffer.from(screenshot.data, "base64")
        );
        console.log("✓ Saved Desktop Mode A Ribbons screenshot");

        // 2. Desktop Mode B (Sliced Poster)
        await send("Runtime.evaluate", {
          expression: `
            const slicedBtn = document.querySelector('button[aria-label="Segmented sliced artwork view"]');
            if (slicedBtn) slicedBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1200));

        screenshot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          path.join(artifactDir, "alan_menken_mode_b_sliced_1440x900.png"),
          Buffer.from(screenshot.data, "base64")
        );
        console.log("✓ Saved Desktop Mode B Sliced Poster screenshot");

        // 3. Desktop Menu Overlay (Image 4)
        await send("Runtime.evaluate", {
          expression: `
            const menuBtn = document.querySelector('button[aria-label="Open Navigation Menu"]');
            if (menuBtn) menuBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 800));

        screenshot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          path.join(artifactDir, "alan_menken_menu_overlay_1440x900.png"),
          Buffer.from(screenshot.data, "base64")
        );
        console.log("✓ Saved Desktop Menu Overlay screenshot");

        // 4. Mobile Mode A (Staggered Ribbons on 390x844)
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true,
        });
        // Close menu and switch back to ribbons
        await send("Runtime.evaluate", {
          expression: `
            const closeBtn = document.querySelector('button[aria-label="Close Navigation Menu"]');
            if (closeBtn) closeBtn.click();
            const ribbonsBtn = document.querySelector('button[aria-label="Multi-artwork ribbons view"]');
            if (ribbonsBtn) ribbonsBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1200));

        screenshot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          path.join(artifactDir, "alan_menken_mobile_mode_a_390x844.png"),
          Buffer.from(screenshot.data, "base64")
        );
        console.log("✓ Saved Mobile Mode A Ribbons screenshot");

        // 5. Mobile Mode B (Sliced Poster on 390x844)
        await send("Runtime.evaluate", {
          expression: `
            const slicedBtn = document.querySelector('button[aria-label="Segmented sliced artwork view"]');
            if (slicedBtn) slicedBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1000));

        screenshot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          path.join(artifactDir, "alan_menken_mobile_mode_b_390x844.png"),
          Buffer.from(screenshot.data, "base64")
        );
        console.log("✓ Saved Mobile Mode B Sliced screenshot");

        console.log("All visual verification captures completed!");
        ws.close();
        chrome.kill();
        process.exit(0);
      })();
    };
  } catch (err) {
    console.error("Capture err:", err.message);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
