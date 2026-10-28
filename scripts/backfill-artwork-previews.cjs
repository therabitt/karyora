#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

function loadEnvFiles() {
  // Prefer shell-provided secrets. Otherwise load local development env files
  // without adding a dotenv dependency or writing credentials to disk.
  for (const name of [".env.local", ".env"]) {
    const filePath = path.resolve(process.cwd(), name);
    if (!fs.existsSync(filePath)) continue;

    const contents = fs.readFileSync(filePath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;

      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else {
        value = value.replace(/\s+#.*$/, "").trim();
      }
      process.env[match[1]] = value;
    }
  }
}

function getBucketPath(fullPath) {
  const prefix = "artworks-public/";
  if (fullPath.startsWith(prefix)) return fullPath.slice(prefix.length);

  if (fullPath.startsWith("http://") || fullPath.startsWith("https://")) {
    const url = new URL(fullPath);
    const marker = "/storage/v1/object/public/artworks-public/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0) return decodeURIComponent(url.pathname.slice(index + marker.length));
  }

  throw new Error("Unsupported public_image_path format: " + fullPath);
}

async function listMissingPreviews(supabase) {
  const rows = [];
  const pageSize = 100;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("artworks")
      .select("id, title, public_image_path, public_preview_path")
      .eq("status", "published")
      .not("public_image_path", "is", null)
      .is("public_preview_path", null)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(
        "Could not find published artworks without previews. Apply migration " +
        "20261028000000_add_artwork_preview_image.sql first. Details: " + error.message
      );
    }

    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function main() {
  loadEnvFiles();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Set them in the shell or .env.local."
    );
  }

  const apply = process.argv.includes("--apply");
  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const artworks = await listMissingPreviews(supabase);
  console.log(
    (apply ? "APPLY MODE" : "DRY RUN") + ": " + artworks.length +
    " published artwork(s) need a preview."
  );

  if (!apply) {
    for (const artwork of artworks) {
      console.log("- " + artwork.title + " [" + artwork.id + "]");
    }
    console.log("No files or database rows were changed. Re-run with --apply to generate previews.");
    return;
  }

  let completed = 0;
  let failed = 0;

  for (const artwork of artworks) {
    let previewPath = null;
    let rollbackQueued = false;

    try {
      const sourcePath = getBucketPath(artwork.public_image_path);
      const source = await supabase.storage.from("artworks-public").download(sourcePath);
      if (source.error || !source.data) {
        throw new Error("Could not download current public image: " + (source.error?.message || "no data"));
      }

      const sourceBuffer = Buffer.from(await source.data.arrayBuffer());
      const previewBuffer = await sharp(sourceBuffer, {
        limitInputPixels: 64_000_000,
        failOn: "error",
      })
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();

      const objectId = crypto.randomUUID();
      previewPath = "artworks-public/previews/" + artwork.id + "/" + objectId + ".webp";

      const { error: queueError } = await supabase.from("storage_cleanup_queue").upsert(
        {
          bucket_id: "artworks-public",
          object_path: previewPath,
          reason: "rollback",
          state: "queued",
          process_after: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          last_error: null,
        },
        { onConflict: "bucket_id,object_path" }
      );
      if (queueError) throw new Error("Could not queue rollback cleanup: " + queueError.message);
      rollbackQueued = true;

      const { error: uploadError } = await supabase.storage
        .from("artworks-public")
        .upload(previewPath.slice("artworks-public/".length), previewBuffer, {
          contentType: "image/webp",
          upsert: true,
        });
      if (uploadError) throw new Error("Preview upload failed: " + uploadError.message);

      const { data: updated, error: updateError } = await supabase
        .from("artworks")
        .update({ public_preview_path: previewPath, updated_at: new Date().toISOString() })
        .eq("id", artwork.id)
        .eq("status", "published")
        .is("public_preview_path", null)
        .select("id")
        .maybeSingle();

      if (updateError) throw new Error("Database update failed: " + updateError.message);
      if (!updated) {
        console.warn("Skipped " + artwork.title + ": row changed while preview was generated.");
        continue; // Keep rollback intent so the unreferenced preview is cleaned up later.
      }

      const { error: clearError } = await supabase
        .from("storage_cleanup_queue")
        .delete()
        .eq("bucket_id", "artworks-public")
        .eq("object_path", previewPath)
        .eq("reason", "rollback");
      if (clearError) {
        console.warn("Preview saved, but rollback queue cleanup failed for " + artwork.title + ".");
      } else {
        rollbackQueued = false;
      }

      completed += 1;
      console.log("Created preview for " + artwork.title + " (" + Math.round(previewBuffer.length / 1024) + " KiB).");
    } catch (error) {
      failed += 1;
      console.error("Failed preview for " + artwork.title + ": " + (error instanceof Error ? error.message : String(error)));
      // If an upload occurred, its pre-registered rollback intent remains available
      // for the existing cleanup worker to remove the unreferenced asset.
      if (!rollbackQueued) {
        console.warn("No rollback queue item is active for " + artwork.title + ".");
      }
    }
  }

  console.log("Finished: " + completed + " preview(s) created, " + failed + " failed.");
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
