"use server";

import { requireAdmin } from "@/lib/auth/admin";
import {
  createSignedUpload,
  signedUploadRequestSchema,
  type SignedUploadRequestInput,
  type SignedUploadResult,
} from "@/lib/storage/signed-upload";

export interface SignedUploadActionResult {
  success?: boolean;
  data?: SignedUploadResult;
  error?: string;
}

/**
 * Server Action for requesting an exact-path signed upload URL to artworks-private.
 * Requires administrator verification.
 */
export async function requestArtworkUploadUrlAction(
  input: SignedUploadRequestInput
): Promise<SignedUploadActionResult> {
  try {
    const adminContext = await requireAdmin();

    const parsed = signedUploadRequestSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message || "Invalid upload parameters.",
      };
    }

    const result = await createSignedUpload({
      adminUserId: adminContext.adminUserId,
      filename: parsed.data.filename,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      purpose: parsed.data.purpose,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Failed to request signed upload URL:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to generate upload URL.",
    };
  }
}
