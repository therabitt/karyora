import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { ensureAdminProfile } from "@/lib/data/profile";
import { z } from "zod";
import type { Database } from "@/types/database.types";

export type PendingUploadRow = Database["public"]["Tables"]["pending_uploads"]["Row"];

export const signedUploadRequestSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024, "File size must not exceed 25 MiB (26,214,400 bytes)"),
  purpose: z.enum(["artwork_source", "profile_avatar"]).default("artwork_source"),
});

export type SignedUploadRequestInput = z.infer<typeof signedUploadRequestSchema>;

export interface SignedUploadResult {
  uploadId: string;
  signedUrl: string;
  objectPath: string;
  expiresAt: string;
}

function sanitizeExtension(filename: string, mimeType: string): string {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";

  // Fallback to mimeType
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/**
 * Creates a server-authorized pending upload record and returns a signed upload URL.
 * Bound to an exact, unguessable path in artworks-private.
 */
export async function createSignedUpload({
  adminUserId,
  filename,
  mimeType,
  sizeBytes,
  purpose = "artwork_source",
}: SignedUploadRequestInput & { adminUserId: string }): Promise<SignedUploadResult> {
  const uploadId = crypto.randomUUID();
  const ext = sanitizeExtension(filename, mimeType);
  const objectPath = `artworks-private/${adminUserId}/${uploadId}/source.${ext}`;

  const now = new Date();
  const ttlSeconds = Number(
    process.env.KARYORA_PENDING_UPLOAD_TTL_SECONDS ||
      process.env.ARTLOOM_PENDING_UPLOAD_TTL_SECONDS ||
      3600
  );
  const graceSeconds = Number(
    process.env.KARYORA_UPLOAD_CLEANUP_GRACE_SECONDS ||
      process.env.ARTLOOM_UPLOAD_CLEANUP_GRACE_SECONDS ||
      600
  );

  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000); // Application finalization deadline
  const signedUploadExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours Supabase lifetime
  const cleanupAfter = new Date(signedUploadExpiresAt.getTime() + graceSeconds * 1000); // Token expiry + grace

  const supabase = createServiceClient();

  // Ensure the admin profile exists in public.profiles to satisfy foreign key constraints
  await ensureAdminProfile(adminUserId);

  // 1. Insert pending_uploads row
  const { error: insertError } = await supabase.from("pending_uploads").insert({
    id: uploadId,
    profile_id: adminUserId,
    purpose,
    bucket_id: "artworks-private",
    object_path: objectPath,
    original_filename: filename.slice(0, 255),
    declared_content_type: mimeType,
    declared_size_bytes: sizeBytes,
    state: "pending",
    expires_at: expiresAt.toISOString(),
    signed_upload_issued_at: now.toISOString(),
    signed_upload_expires_at: signedUploadExpiresAt.toISOString(),
    cleanup_after: cleanupAfter.toISOString(),
  });

  if (insertError) {
    console.error("Failed to insert pending_uploads record:", insertError);
    throw new Error(`Could not initialize upload registration: ${insertError.message}`);
  }

  // 2. Issue exact-path signed upload URL from Storage API (path relative to bucket)
  const storagePath = `${adminUserId}/${uploadId}/source.${ext}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from("artworks-private")
    .createSignedUploadUrl(storagePath);

  if (storageError || !storageData?.signedUrl) {
    console.error("Failed to generate signed upload URL:", storageError);
    // Mark pending record as rejected
    await supabase
      .from("pending_uploads")
      .update({ state: "rejected" })
      .eq("id", uploadId);

    throw new Error(`Could not generate authorized upload URL: ${storageError?.message || "Storage error"}`);
  }

  return {
    uploadId,
    signedUrl: storageData.signedUrl,
    objectPath,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Retrieves and validates an unconsumed pending upload.
 */
export async function getValidPendingUpload(
  uploadId: string,
  adminUserId: string
): Promise<PendingUploadRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pending_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("profile_id", adminUserId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Upload record not found or unauthorized.");
  }

  if (data.state !== "pending") {
    throw new Error(`Upload is no longer eligible (current state: ${data.state}).`);
  }

  const isExpired = new Date(data.expires_at).getTime() <= Date.now();
  if (isExpired) {
    // Mark as cleanup_pending
    await supabase
      .from("pending_uploads")
      .update({ state: "cleanup_pending" })
      .eq("id", uploadId);

    throw new Error("Upload has expired. Please select the file again.");
  }

  return data;
}

/**
 * Marks a pending upload as consumed upon successful entity creation/update.
 */
export async function markPendingUploadConsumed(
  uploadId: string,
  actualSizeBytes?: number,
  detectedContentType?: string
) {
  const supabase = createServiceClient();

  const updatePayload: Partial<PendingUploadRow> = {
    state: "consumed",
    updated_at: new Date().toISOString(),
  };

  if (actualSizeBytes) updatePayload.actual_size_bytes = actualSizeBytes;
  if (detectedContentType) updatePayload.detected_content_type = detectedContentType;

  await supabase
    .from("pending_uploads")
    .update(updatePayload)
    .eq("id", uploadId);
}
