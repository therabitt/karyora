import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

const BUCKET_PUBLIC = "artworks-public";
const BUCKET_PRIVATE = "artworks-private";
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 10_000;
const MAX_TOTAL_PIXELS = 64_000_000;
const MAX_ARTWORK_DIMENSION = 1600;
const VARIANT_EDGES = [64, 128, 256, 384, 512, 768, 1024, 1280, 1600];
const APPLY = process.argv.includes("--apply");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) before running this script.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function stripBucketPrefix(path, bucket) {
  return path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
}
function isResponsivePath(path) {
  if (!path) return false;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  const withoutBucket = clean.startsWith(`${BUCKET_PUBLIC}/`)
    ? clean.slice(BUCKET_PUBLIC.length + 1)
    : clean;
  const parts = withoutBucket.split("/");
  if (parts.length !== 5 || parts[0] !== "artworks" || parts[3] !== "responsive") return false;
  const edgeText = parts[4].endsWith(".webp") ? parts[4].slice(0, -".webp".length) : "";
  const edge = Number(edgeText);
  return Number.isInteger(edge) && edge > 0 && edge <= MAX_ARTWORK_DIMENSION;
}
function targetEdges(width, height) {
  const maxEdge = Math.min(MAX_ARTWORK_DIMENSION, Math.max(width, height));
  return [...VARIANT_EDGES.filter((edge) => edge < maxEdge), maxEdge];
}
async function enqueueCleanup(paths, reason) {
  if (!paths.length) return;
  const { error } = await supabase.from("storage_cleanup_queue").upsert(
    paths.map((object_path) => ({
      bucket_id: BUCKET_PUBLIC,
      object_path,
      reason,
      state: "queued",
      process_after: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      last_error: null,
    })),
    { onConflict: "bucket_id,object_path" },
  );
  if (error) throw new Error(`Could not queue cleanup: ${error.message}`);
}
async function downloadSource(artwork) {
  if (artwork.private_image_path) {
    const { data, error } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .download(stripBucketPrefix(artwork.private_image_path, BUCKET_PRIVATE));
    if (!error && data) return Buffer.from(await data.arrayBuffer());
  }
  const { data, error } = await supabase.storage
    .from(BUCKET_PUBLIC)
    .download(stripBucketPrefix(artwork.public_image_path, BUCKET_PUBLIC));
  if (error || !data) throw new Error("Unable to download either the private source or current public derivative.");
  return Buffer.from(await data.arrayBuffer());
}
async function buildVariants(source, edges) {
  const variants = [];
  for (const edge of edges) {
    const result = await sharp(source, {
      limitInputPixels: MAX_TOTAL_PIXELS,
      failOn: "error",
    })
      .rotate()
      .resize(edge, edge, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    variants.push({
      maxEdge: Math.max(result.info.width, result.info.height),
      width: result.info.width,
      height: result.info.height,
      buffer: result.data,
    });
  }
  return variants;
}

async function processArtwork(artwork) {
  if (!artwork.public_image_path || isResponsivePath(artwork.public_image_path)) {
    return { skipped: true, reason: "already responsive or no public image path" };
  }

  const source = await downloadSource(artwork);
  if (source.length === 0 || source.length > MAX_SOURCE_BYTES) {
    throw new Error("Source is empty or exceeds the 25 MiB processing limit.");
  }
  const metadata = await sharp(source, {
    limitInputPixels: MAX_TOTAL_PIXELS,
    failOn: "error",
  }).metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
    throw new Error("Source format is not supported for responsive variants.");
  }
  const orientation = metadata.orientation || 1;
  const swapped = [5, 6, 7, 8].includes(orientation);
  const effectiveWidth = swapped ? (metadata.height || 0) : (metadata.width || 0);
  const effectiveHeight = swapped ? (metadata.width || 0) : (metadata.height || 0);
  if (
    !effectiveWidth || !effectiveHeight ||
    effectiveWidth > MAX_DIMENSION || effectiveHeight > MAX_DIMENSION ||
    effectiveWidth * effectiveHeight > MAX_TOTAL_PIXELS
  ) {
    throw new Error("Source dimensions exceed the supported image-processing limits.");
  }

  const edges = targetEdges(effectiveWidth, effectiveHeight);
  const derivativeId = randomUUID();
  const baseDirectory = `artworks/${artwork.id}/${derivativeId}`;
  const responsiveDirectory = `${baseDirectory}/responsive`;
  const objectPaths = edges.map((edge) => `${BUCKET_PUBLIC}/${responsiveDirectory}/${edge}.webp`);

  if (!APPLY) {
    return { skipped: false, previous: artwork.public_image_path, variants: edges.length, edges };
  }

  await enqueueCleanup(objectPaths, "rollback");
  const variants = await buildVariants(source, edges);
  if (variants.length !== edges.length || variants.some((variant, i) => variant.maxEdge !== edges[i])) {
    throw new Error("Generated responsive variants do not match their planned output paths.");
  }

  const uploads = await Promise.all(variants.map(async (variant) => {
    const path = `${responsiveDirectory}/${variant.maxEdge}.webp`;
    const { error } = await supabase.storage.from(BUCKET_PUBLIC).upload(path, variant.buffer, {
      contentType: "image/webp",
      upsert: false,
    });
    return { path, error };
  }));
  const failedUpload = uploads.find((upload) => upload.error);
  if (failedUpload?.error) {
    throw new Error(`Failed uploading responsive variant ${failedUpload.path}: ${failedUpload.error.message}`);
  }

  await enqueueCleanup([artwork.public_image_path], "replace");
  const primary = variants[variants.length - 1];
  const primaryPath = `${BUCKET_PUBLIC}/${responsiveDirectory}/${primary.maxEdge}.webp`;
  const { data: updated, error: updateError } = await supabase
    .from("artworks")
    .update({
      public_image_path: primaryPath,
      image_width: primary.width,
      image_height: primary.height,
      updated_at: new Date().toISOString(),
    })
    .eq("id", artwork.id)
    .eq("public_image_path", artwork.public_image_path)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    throw new Error(updateError?.message || "The artwork path changed while backfill was running.");
  }

  const { error: clearError } = await supabase
    .from("storage_cleanup_queue")
    .delete()
    .eq("bucket_id", BUCKET_PUBLIC)
    .in("object_path", objectPaths)
    .eq("reason", "rollback");
  if (clearError) console.warn(`Live image variants have cleanup intents that need inspection for ${artwork.id}: ${clearError.message}`);

  return { skipped: false, previous: artwork.public_image_path, current: primaryPath, variants: variants.length, edges };
}

const { data: artworks, error } = await supabase
  .from("artworks")
  .select("id,title,private_image_path,public_image_path,image_width,image_height,status")
  .eq("status", "published")
  .not("public_image_path", "is", null);

if (error) {
  console.error(`Could not list published artworks: ${error.message}`);
  process.exit(1);
}

console.log(`Artwork responsive backfill: ${APPLY ? "APPLY MODE" : "DRY RUN"}; ${artworks.length} published artwork(s) found.`);
let failed = 0;
for (const artwork of artworks) {
  try {
    const result = await processArtwork(artwork);
    console.log(JSON.stringify({ id: artwork.id, title: artwork.title, ...result }));
  } catch (err) {
    failed += 1;
    console.error(JSON.stringify({ id: artwork.id, title: artwork.title, error: err instanceof Error ? err.message : String(err) }));
  }
}
console.log(`Completed. ${failed} item(s) failed.`);
if (failed > 0) process.exitCode = 1;
