import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { enqueueCleanupItem } from "@/lib/storage/cleanup";
import {
  createPublicResponsiveDerivatives,
  getArtworkResponsiveTargetEdges,
  validateSourceImageMetadata,
  type ProcessedImageResult,
} from "@/lib/storage/image-processor";
import { getArtworkResponsiveObjectPaths } from "@/lib/storage/artwork-image-variants";
import { extractImageColorAnalysis } from "@/lib/storage/palette-extractor";
import { generateArtworkHarmoniousPalette } from "@/lib/color/palette-engine";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

export type ArtworkRow = Database["public"]["Tables"]["artworks"]["Row"];

function getPathInBucket(bucket: string, fullPath: string): string {
  const prefix = `${bucket}/`;
  return fullPath.startsWith(prefix) ? fullPath.slice(prefix.length) : fullPath;
}

/**
 * Downloads a stored source file from artworks-private.
 */
export async function downloadPrivateSource(objectPath: string): Promise<Buffer> {
  const supabase = createServiceClient();
  const pathInBucket = getPathInBucket("artworks-private", objectPath);

  // Try the stripped path in bucket first
  let res = await supabase.storage
    .from("artworks-private")
    .download(pathInBucket);

  // Fallback to raw objectPath in case older uploads used the full path
  if ((res.error || !res.data) && pathInBucket !== objectPath) {
    const fallback = await supabase.storage
      .from("artworks-private")
      .download(objectPath);
    if (!fallback.error && fallback.data) {
      res = fallback;
    }
  }

  if (res.error || !res.data) {
    console.error(`Failed to download private source ${objectPath}:`, res.error);
    throw new Error("Could not retrieve original image source.");
  }

  const arrayBuffer = await res.data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates and uploads a WebP derivative to artworks-public with a rollback cleanup intent.
 */
export async function generateAndUploadArtworkDerivative(
  artworkId: string,
  sourceBuffer: Buffer
): Promise<{ derivativePath: string; result: ProcessedImageResult; objectPaths: string[] }> {
  const supabase = createServiceClient();
  const sourceMetadata = await validateSourceImageMetadata(sourceBuffer);
  const targetEdges = getArtworkResponsiveTargetEdges(
    sourceMetadata.effectiveWidth,
    sourceMetadata.effectiveHeight
  );
  const derivativeId = crypto.randomUUID();
  const storageBase = `artworks/${artworkId}/${derivativeId}`;
  const responsiveDirectory = `${storageBase}/responsive`;
  const publicDirectory = `artworks-public/${responsiveDirectory}`;
  const objectPaths = targetEdges.map((edge) => `${publicDirectory}/${edge}.webp`);

  // Register rollback cleanup intents before processing or uploading every variant.
  const processAfter = new Date(Date.now() + 10 * 60 * 1000);
  await Promise.all(objectPaths.map((objectPath) => enqueueCleanupItem({
    bucketId: "artworks-public",
    objectPath,
    reason: "rollback",
    processAfter,
  })));

  const variants = await createPublicResponsiveDerivatives(sourceBuffer);
  if (
    variants.length !== targetEdges.length ||
    variants.some((variant, index) => variant.maxEdge !== targetEdges[index])
  ) {
    throw new Error("Responsive artwork variants did not match their planned dimensions.");
  }

  const uploads = await Promise.all(variants.map(async (variant) => {
    const path = `${responsiveDirectory}/${variant.maxEdge}.webp`;
    const { error } = await supabase.storage
      .from("artworks-public")
      .upload(path, variant.buffer, {
        contentType: "image/webp",
        upsert: false,
      });
    return { path, error };
  }));

  const failedUpload = uploads.find((upload) => upload.error);
  if (failedUpload?.error) {
    console.error("Failed to upload responsive artwork variants:", failedUpload.error);
    throw new Error("Failed to store the optimized exhibition image set.");
  }

  const primary = variants[variants.length - 1];
  const derivativePath = `${publicDirectory}/${primary.maxEdge}.webp`;
  return { derivativePath, result: primary, objectPaths };
}
/**
 * Publishes a draft artwork, generating an exhibition WebP derivative and updating status.
 */
export async function publishArtwork({
  artworkId,
  adminUserId,
}: {
  artworkId: string;
  adminUserId: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = createServiceClient();

  // 1. Verify artwork exists, belongs to admin, and is Draft
  const { data: artwork, error: fetchError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", artworkId)
    .eq("profile_id", adminUserId)
    .maybeSingle();

  if (fetchError || !artwork) {
    return { error: "Artwork not found or unauthorized." };
  }

  if (artwork.status === "published") {
    return { error: "Artwork is already published." };
  }

  if (!artwork.private_image_path) {
    return { error: "Artwork has no source image to publish." };
  }

  try {
    // 2. Download private source image
    const sourceBuffer = await downloadPrivateSource(artwork.private_image_path);

    // 3. Generate derivative and upload with rollback intent
    const { derivativePath, result: derivative, objectPaths } = await generateAndUploadArtworkDerivative(
      artwork.id,
      sourceBuffer
    );

    // 4. Extract colors and generate harmonious, unique palette metadata
    let paletteMetadata: unknown = null;
    try {
      const analysis = await extractImageColorAnalysis(sourceBuffer);
      paletteMetadata = generateArtworkHarmoniousPalette({
        analysis,
        title: artwork.title,
        category: artwork.category,
      });
    } catch (paletteErr) {
      console.warn("Palette extraction failed during publication, proceeding:", paletteErr);
    }

    // 5. Update artwork to published status atomically
    const now = new Date().toISOString();
    const updatePayload: Database["public"]["Tables"]["artworks"]["Update"] = {
      status: "published",
      published_at: now,
      public_image_path: derivativePath,
      image_width: derivative.width,
      image_height: derivative.height,
      updated_at: now,
    };
    if (paletteMetadata) {
      updatePayload.palette_metadata = JSON.parse(JSON.stringify(paletteMetadata));
    }

    let { error: updateError } = await supabase
      .from("artworks")
      .update(updatePayload)
      .eq("id", artwork.id)
      .eq("status", "draft");

    // Graceful fallback if database column migration is pending in remote schema cache
    if (updateError && updateError.code === "PGRST204" && paletteMetadata) {
      console.warn("palette_metadata column not yet in schema cache, retrying publication without palette metadata");
      delete updatePayload.palette_metadata;
      const retryResult = await supabase
        .from("artworks")
        .update(updatePayload)
        .eq("id", artwork.id)
        .eq("status", "draft");
      updateError = retryResult.error;
    }

    // The dimensions migration is required before deployment. This final fallback only
    // preserves publication if the database schema cache is briefly stale after migration;
    // image dimensions will then be measured by the browser on first display.
    if (
      updateError &&
      updateError.code === "PGRST204" &&
      ("image_width" in updatePayload || "image_height" in updatePayload)
    ) {
      console.warn("Artwork dimension columns not yet in schema cache; publishing without stored dimensions");
      delete updatePayload.image_width;
      delete updatePayload.image_height;
      const retryResult = await supabase
        .from("artworks")
        .update(updatePayload)
        .eq("id", artwork.id)
        .eq("status", "draft");
      updateError = retryResult.error;
    }

    if (updateError) {
      console.error("Failed to update artwork status to published:", updateError);
      return {
        error: "Failed to commit publication status. Rollback cleanup will handle temporary files.",
      };
    }

    // 5. Remove the rollback intent since publication succeeded
    await supabase
      .from("storage_cleanup_queue")
      .delete()
      .eq("bucket_id", "artworks-public")
      .in("object_path", objectPaths)
      .eq("reason", "rollback");

    // 6. Revalidate public and admin pages
    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath(`/artworks/${artwork.slug}`);
    revalidatePath("/dashboard/artworks");
    revalidatePath(`/dashboard/artworks/${artwork.id}/edit`);

    return { success: true };
  } catch (err: unknown) {
    console.error("Publish artwork failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to publish artwork.",
    };
  }
}

/**
 * Unpublishes a published artwork, clearing public paths and enqueuing derivative cleanup.
 */
export async function unpublishArtwork({
  artworkId,
  adminUserId,
}: {
  artworkId: string;
  adminUserId: string;
}): Promise<{ success?: boolean; error?: string; cleanupPending?: boolean }> {
  const supabase = createServiceClient();

  const { data: artwork, error: fetchError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", artworkId)
    .eq("profile_id", adminUserId)
    .maybeSingle();

  if (fetchError || !artwork) {
    return { error: "Artwork not found or unauthorized." };
  }

  if (artwork.status === "draft") {
    return { error: "Artwork is already in draft status." };
  }

  const oldPublicPath = artwork.public_image_path;
  const oldPublicPaths = getArtworkResponsiveObjectPaths(oldPublicPath);

  // 1. Transactionally update artwork to draft
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("artworks")
    .update({
      status: "draft",
      published_at: null,
      public_image_path: null,
      is_featured: false,
      updated_at: now,
    })
    .eq("id", artwork.id)
    .eq("status", "published");

  if (updateError) {
    console.error("Failed to update artwork to draft:", updateError);
    return { error: "Failed to unpublish artwork in database." };
  }

  // 2. Enqueue and synchronously attempt cleanup for every public image variant.
  let cleanupPending = false;
  if (oldPublicPaths.length > 0) {
    try {
      await Promise.all(oldPublicPaths.map((objectPath) => enqueueCleanupItem({
        bucketId: "artworks-public",
        objectPath,
        reason: "unpublish",
        processAfter: new Date(),
      })));

      const pathsInBucket = oldPublicPaths.map((path) => getPathInBucket("artworks-public", path));
      const { error: removeError } = await supabase.storage
        .from("artworks-public")
        .remove(pathsInBucket);

      if (!removeError) {
        await supabase
          .from("storage_cleanup_queue")
          .delete()
          .eq("bucket_id", "artworks-public")
          .in("object_path", oldPublicPaths);
      } else {
        cleanupPending = true;
      }
    } catch (cleanupErr) {
      console.warn("Immediate responsive image cleanup failed, queued for retry:", cleanupErr);
      cleanupPending = true;
    }
  }

  // 3. Revalidate paths
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath(`/artworks/${artwork.slug}`);
  revalidatePath("/dashboard/artworks");
  revalidatePath(`/dashboard/artworks/${artwork.id}/edit`);

  return { success: true, cleanupPending };
}

/**
 * Deletes an artwork record and enqueues its storage objects for deletion.
 */
export async function deleteArtwork({
  artworkId,
  adminUserId,
}: {
  artworkId: string;
  adminUserId: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: artwork, error: fetchError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", artworkId)
    .eq("profile_id", adminUserId)
    .maybeSingle();

  if (fetchError || !artwork) {
    return { error: "Artwork not found or unauthorized." };
  }

  const privatePath = artwork.private_image_path;
  const publicPath = artwork.public_image_path;
  const publicPaths = getArtworkResponsiveObjectPaths(publicPath);

  // 1. Enqueue private source cleanup
  if (privatePath) {
    await enqueueCleanupItem({
      bucketId: "artworks-private",
      objectPath: privatePath,
      reason: "delete",
      processAfter: new Date(),
    });
  }

  // 2. Enqueue every public responsive variant for cleanup.
  await Promise.all(publicPaths.map((objectPath) => enqueueCleanupItem({
    bucketId: "artworks-public",
    objectPath,
    reason: "delete",
    processAfter: new Date(),
  })));

  // 3. Delete artwork row from database
  const { error: deleteError } = await supabase
    .from("artworks")
    .delete()
    .eq("id", artwork.id)
    .eq("profile_id", adminUserId);

  if (deleteError) {
    console.error("Failed to delete artwork record:", deleteError);
    return { error: "Failed to delete artwork." };
  }

  // 4. Best-effort synchronous deletion of all public responsive variants.
  if (publicPaths.length > 0) {
    try {
      const pathsInBucket = publicPaths.map((path) => getPathInBucket("artworks-public", path));
      const { error: removeError } = await supabase.storage
        .from("artworks-public")
        .remove(pathsInBucket);

      if (!removeError) {
        await supabase
          .from("storage_cleanup_queue")
          .delete()
          .eq("bucket_id", "artworks-public")
          .in("object_path", publicPaths);
      }
    } catch {
      // Retained in queue for retry.
    }
  }

  // 5. Revalidate paths
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath(`/artworks/${artwork.slug}`);
  revalidatePath("/dashboard/artworks");

  return { success: true };
}
