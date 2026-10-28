import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { CleanupReason } from "@/types/database.types";

export interface EnqueueCleanupParams {
  bucketId: "artworks-private" | "artworks-public" | "profiles-public";
  objectPath: string;
  reason: CleanupReason;
  processAfter?: Date;
}

/**
 * Enqueues a storage cleanup intent in storage_cleanup_queue.
 */
export async function enqueueCleanupItem({
  bucketId,
  objectPath,
  reason,
  processAfter = new Date(),
}: EnqueueCleanupParams) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("storage_cleanup_queue").upsert(
    {
      bucket_id: bucketId,
      object_path: objectPath,
      reason,
      state: "queued",
      process_after: processAfter.toISOString(),
      last_error: null,
    },
    { onConflict: "bucket_id,object_path" }
  );

  if (error) {
    console.error("Failed to enqueue storage cleanup intent:", error);
    throw new Error(`Failed to queue cleanup for ${bucketId}/${objectPath}`);
  }
}

/**
 * Executes a safe, reference-checked deletion attempt for an eligible cleanup item.
 * Verifies that no active database record points to the object before removing it from Storage.
 */
export async function processSingleCleanupItem(queueItemId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // 1. Atomically claim queue item
  const { data: item, error: claimError } = await supabase
    .from("storage_cleanup_queue")
    .update({
      state: "processing",
      processing_started_at: new Date().toISOString(),
      attempt_count: 1, // incremented in function or query
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", queueItemId)
    .eq("state", "queued")
    .lte("process_after", new Date().toISOString())
    .select()
    .single();

  if (claimError || !item) {
    return false;
  }

  try {
    // 2. Active reference verification (Section 5.5.3)
    // Check artworks table
    const { count: privateRef } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("private_image_path", item.object_path);

    const { count: publicRef } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("public_image_path", item.object_path);

    const { count: publicPreviewRef } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("public_preview_path", item.object_path);

    // Check profiles table
    const { count: avatarRef } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("avatar_path", item.object_path);

    if (
      (privateRef && privateRef > 0) ||
      (publicRef && publicRef > 0) ||
      (publicPreviewRef && publicPreviewRef > 0) ||
      (avatarRef && avatarRef > 0)
    ) {
      // Object is actively referenced; resolve queue row without deleting physical object
      await supabase.from("storage_cleanup_queue").delete().eq("id", item.id);
      return true;
    }

    // 3. Delete from Supabase Storage API
    const pathInBucket = item.object_path.startsWith(`${item.bucket_id}/`)
      ? item.object_path.slice(item.bucket_id.length + 1)
      : item.object_path;

    const { error: storageError } = await supabase.storage
      .from(item.bucket_id)
      .remove([pathInBucket, item.object_path]);

    if (storageError) {
      throw storageError;
    }

    // 4. Remove queue row on confirmed Storage API success
    await supabase.from("storage_cleanup_queue").delete().eq("id", item.id);
    return true;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Storage cleanup failure for ${item.bucket_id}/${item.object_path}:`, errorMessage);

    // Revert state to queued with sanitized error for safe retry
    await supabase
      .from("storage_cleanup_queue")
      .update({
        state: "queued",
        last_error: errorMessage.slice(0, 500),
        processing_started_at: null,
      })
      .eq("id", item.id);

    return false;
  }
}
