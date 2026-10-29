import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { timingSafeEqual, randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PUBLIC_BUCKET = "artworks-public";
const PRIVATE_BUCKET = "artworks-private";
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 10_000;
const MAX_TOTAL_PIXELS = 64_000_000;
const MAX_ARTWORK_EDGE = 1600;
const EDGES = [64, 128, 256, 384, 512, 768, 1024, 1280, 1600];

function stripBucketPrefix(path: string, bucket: string) {
  return path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
}

function isResponsivePath(path: string | null) {
  if (!path) return false;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  const withoutBucket = clean.startsWith(`${PUBLIC_BUCKET}/`)
    ? clean.slice(PUBLIC_BUCKET.length + 1)
    : clean;
  const parts = withoutBucket.split("/");
  if (parts.length !== 5 || parts[0] !== "artworks" || parts[3] !== "responsive") return false;
  const edgeText = parts[4].endsWith(".webp") ? parts[4].slice(0, -".webp".length) : "";
  const edge = Number(edgeText);
  return Number.isInteger(edge) && edge > 0 && edge <= MAX_ARTWORK_EDGE;
}

function authorized(request: Request) {
  const expected = process.env.KARYORA_RESPONSIVE_BACKFILL_TOKEN ?? "";
  const provided = new URL(request.url).searchParams.get("token") ?? "";
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const artworkId = url.searchParams.get("id") ?? "";
  const mode = url.searchParams.get("mode") ?? "dry-run";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artworkId)) {
    return NextResponse.json({ error: "A valid artwork id is required." }, { status: 400 });
  }
  if (mode !== "dry-run" && mode !== "apply") {
    return NextResponse.json({ error: "mode must be dry-run or apply." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) {
    return NextResponse.json({ error: "Server storage credentials are not configured." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("id,title,private_image_path,public_image_path,image_width,image_height,status")
      .eq("id", artworkId)
      .eq("status", "published")
      .not("public_image_path", "is", null)
      .maybeSingle();

    if (artworkError || !artwork) {
      return NextResponse.json({ error: "Published artwork not found." }, { status: 404 });
    }
    if (isResponsivePath(artwork.public_image_path)) {
      return NextResponse.json({ status: "skipped", id: artwork.id, reason: "already-responsive" });
    }

    let sourceBuffer: Buffer | null = null;
    let source: "private" | "public-fallback" = "private";

    if (artwork.private_image_path) {
      const privateResult = await supabase.storage
        .from(PRIVATE_BUCKET)
        .download(stripBucketPrefix(artwork.private_image_path, PRIVATE_BUCKET));
      if (!privateResult.error && privateResult.data) {
        sourceBuffer = Buffer.from(await privateResult.data.arrayBuffer());
      }
    }

    if (!sourceBuffer) {
      source = "public-fallback";
      const publicResult = await supabase.storage
        .from(PUBLIC_BUCKET)
        .download(stripBucketPrefix(artwork.public_image_path!, PUBLIC_BUCKET));
      if (publicResult.error || !publicResult.data) {
        throw new Error("Unable to download a valid source image.");
      }
      sourceBuffer = Buffer.from(await publicResult.data.arrayBuffer());
    }

    const buffer = sourceBuffer;
    if (buffer.length === 0 || buffer.length > MAX_SOURCE_BYTES) {
      throw new Error("Source image is empty or exceeds 25 MiB.");
    }

    const metadata = await sharp(buffer, {
      limitInputPixels: MAX_TOTAL_PIXELS,
      failOn: "error",
    }).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
      throw new Error("Source image format is unsupported.");
    }

    const orientation = metadata.orientation || 1;
    const swapsAxes = [5, 6, 7, 8].includes(orientation);
    const width = swapsAxes ? (metadata.height || 0) : (metadata.width || 0);
    const height = swapsAxes ? (metadata.width || 0) : (metadata.height || 0);
    if (
      !width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION ||
      width * height > MAX_TOTAL_PIXELS
    ) {
      throw new Error("Source image dimensions exceed the supported limits.");
    }

    const maxEdge = Math.min(MAX_ARTWORK_EDGE, Math.max(width, height));
    const targetEdges = [...EDGES.filter((edge) => edge < maxEdge), maxEdge];

    if (mode === "dry-run") {
      return NextResponse.json({
        status: "planned",
        id: artwork.id,
        title: artwork.title,
        source,
        sourceBytes: buffer.length,
        sourceFormat: metadata.format,
        sourceDimensions: { width, height },
        outputEdges: targetEdges,
        outputVariantCount: targetEdges.length,
      });
    }

    const variants: Array<{
      maxEdge: number;
      width: number;
      height: number;
      buffer: Buffer;
      sizeBytes: number;
    }> = [];

    for (const edge of targetEdges) {
      const output = await sharp(buffer, {
        limitInputPixels: MAX_TOTAL_PIXELS,
        failOn: "error",
      })
        .rotate()
        .resize(edge, edge, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });
      variants.push({
        maxEdge: Math.max(output.info.width, output.info.height),
        width: output.info.width,
        height: output.info.height,
        buffer: output.data,
        sizeBytes: output.info.size,
      });
    }

    if (variants.length !== targetEdges.length || variants.some((item, index) => item.maxEdge !== targetEdges[index])) {
      throw new Error("Generated variant dimensions did not match planned paths.");
    }

    const baseDirectory = `artworks/${artwork.id}/${randomUUID()}/responsive`;
    const publicPrefix = `${PUBLIC_BUCKET}/${baseDirectory}`;
    const objectPaths = variants.map((variant) => `${publicPrefix}/${variant.maxEdge}.webp`);
    const processAfter = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: queueError } = await supabase.from("storage_cleanup_queue").upsert(
      objectPaths.map((object_path) => ({
        bucket_id: PUBLIC_BUCKET,
        object_path,
        reason: "rollback",
        state: "queued",
        process_after: processAfter,
        last_error: null,
      })),
      { onConflict: "bucket_id,object_path" },
    );
    if (queueError) throw new Error("Could not register safe rollback cleanup intents.");

    for (const variant of variants) {
      const { error: uploadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .upload(`${baseDirectory}/${variant.maxEdge}.webp`, variant.buffer, {
          contentType: "image/webp",
          upsert: false,
        });
      if (uploadError) throw new Error(`Failed to upload ${variant.maxEdge}px image variant.`);
    }

    const { error: replaceQueueError } = await supabase.from("storage_cleanup_queue").upsert(
      {
        bucket_id: PUBLIC_BUCKET,
        object_path: artwork.public_image_path,
        reason: "replace",
        state: "queued",
        process_after: processAfter,
        last_error: null,
      },
      { onConflict: "bucket_id,object_path" },
    );
    if (replaceQueueError) throw new Error("Could not register cleanup for the replaced public image.");

    const primary = variants[variants.length - 1];
    const primaryPath = `${publicPrefix}/${primary.maxEdge}.webp`;
    const { data: updated, error: updateError } = await supabase
      .from("artworks")
      .update({
        public_image_path: primaryPath,
        image_width: primary.width,
        image_height: primary.height,
        updated_at: new Date().toISOString(),
      })
      .eq("id", artwork.id)
      .eq("status", "published")
      .eq("public_image_path", artwork.public_image_path)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Artwork changed during backfill; original path was retained.");
    }

    const { error: clearRollbackError } = await supabase
      .from("storage_cleanup_queue")
      .delete()
      .eq("bucket_id", PUBLIC_BUCKET)
      .in("object_path", objectPaths)
      .eq("reason", "rollback");
    if (clearRollbackError) {
      // The cleanup worker reference-checks active responsive directories before removing files.
      console.warn("Could not clear rollback cleanup intents after successful publication.");
    }

    return NextResponse.json({
      status: "updated",
      id: artwork.id,
      title: artwork.title,
      variants: variants.map(({ maxEdge: edge, width: outWidth, height: outHeight, sizeBytes }) => ({
        edge, width: outWidth, height: outHeight, sizeBytes,
      })),
      totalVariantBytes: variants.reduce((sum, item) => sum + item.sizeBytes, 0),
      newPublicImagePath: primaryPath,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Responsive backfill failed.",
    }, { status: 500 });
  }
}
