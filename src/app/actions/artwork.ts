"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import {
  downloadPrivateSource,
  generateAndUploadArtworkDerivative,
  publishArtwork,
  unpublishArtwork,
  deleteArtwork,
} from "@/lib/storage/artwork-lifecycle";
import { validateSourceImageMetadata } from "@/lib/storage/image-processor";
import { extractImageColorAnalysis } from "@/lib/storage/palette-extractor";
import { generateArtworkHarmoniousPalette } from "@/lib/color/palette-engine";
import {
  getValidPendingUpload,
  markPendingUploadConsumed,
} from "@/lib/storage/signed-upload";
import { enqueueCleanupItem } from "@/lib/storage/cleanup";
import { artworkInputSchema } from "@/types/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ArtworkActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseTags(rawTags: string | null | undefined): string[] {
  if (!rawTags) return [];
  return rawTags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .slice(0, 20);
}

/**
 * Creates a new artwork record with private source staging and optional immediate publication.
 */
export async function createArtworkAction(
  prevState: ArtworkActionResult | null,
  formData: FormData
): Promise<ArtworkActionResult> {
  let adminContext;
  try {
    adminContext = await requireAdmin();
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Unauthorized: Administrator access required.",
    };
  }

  const uploadId = formData.get("upload_id")?.toString().trim();
  if (!uploadId) {
    return {
      error: "An image file must be uploaded before creating the artwork.",
      fieldErrors: { image: ["Please select and upload an artwork image."] },
    };
  }

  const rawTags = formData.get("tags")?.toString();
  const rawStatus = formData.get("status")?.toString() || "draft";
  const shouldPublish = rawStatus === "published";
  const isFeaturedRequested =
    formData.get("is_featured") === "true" || formData.get("is_featured") === "on";

  const rawInput = {
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    alt_text: formData.get("alt_text")?.toString() || "",
    category: formData.get("category")?.toString() || "other",
    medium: formData.get("medium")?.toString() || "digital-painting",
    tags: parseTags(rawTags),
    // Status invariant: draft cannot be featured
    is_featured: shouldPublish ? isFeaturedRequested : false,
  };

  const parsed = artworkInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 1. Verify pending upload
    const pendingUpload = await getValidPendingUpload(
      uploadId,
      adminContext.adminUserId
    );

    // 2. Download and validate actual source bytes
    const sourceBuffer = await downloadPrivateSource(pendingUpload.object_path);
    const validatedMeta = await validateSourceImageMetadata(sourceBuffer);

    const supabase = createServiceClient();
    const artworkId = crypto.randomUUID();
    const now = new Date().toISOString();

    let publicImagePath: string | null = null;
    let publishedAt: string | null = null;

    // 3. If published, generate exhibition WebP derivative
    if (shouldPublish) {
      const { derivativePath } = await generateAndUploadArtworkDerivative(
        artworkId,
        sourceBuffer
      );
      publicImagePath = derivativePath;
      publishedAt = now;
    }

    // 4. Insert into artworks table
    const { error: dbError } = await supabase.from("artworks").insert({
      id: artworkId,
      profile_id: adminContext.adminUserId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      alt_text: parsed.data.alt_text,
      category: parsed.data.category,
      medium: parsed.data.medium,
      tags: parsed.data.tags,
      private_image_path: pendingUpload.object_path,
      public_image_path: publicImagePath,
      status: shouldPublish ? "published" : "draft",
      is_featured: shouldPublish ? parsed.data.is_featured : false,
      published_at: publishedAt,
    });

    if (dbError) {
      console.error("Database error creating artwork:", dbError);
      if (dbError.code === "23505") {
        return {
          error: "An artwork with this slug already exists. Please choose a different slug.",
        };
      }
      return {
        error: "Failed to create artwork record. Please try again.",
      };
    }

    // 5. Mark pending upload as consumed
    await markPendingUploadConsumed(
      uploadId,
      sourceBuffer.length,
      validatedMeta.format
    );

    // 6. If published, remove rollback intent
    if (publicImagePath) {
      await supabase
        .from("storage_cleanup_queue")
        .delete()
        .eq("bucket_id", "artworks-public")
        .eq("object_path", publicImagePath)
        .eq("reason", "rollback");
    }

    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath(`/artworks/${parsed.data.slug}`);
    revalidatePath("/dashboard/artworks");
  } catch (err: unknown) {
    console.error("Artwork creation failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to process artwork.",
    };
  }

  redirect("/dashboard/artworks");
}

/**
 * Updates an existing artwork's metadata and optionally replaces its image source.
 */
export async function updateArtworkAction(
  artworkId: string,
  prevState: ArtworkActionResult | null,
  formData: FormData
): Promise<ArtworkActionResult> {
  let adminContext;
  try {
    adminContext = await requireAdmin();
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Unauthorized: Administrator access required.",
    };
  }

  const supabase = createServiceClient();

  // Fetch existing artwork to check current status
  const { data: currentArtwork, error: fetchError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", artworkId)
    .eq("profile_id", adminContext.adminUserId)
    .maybeSingle();

  if (fetchError || !currentArtwork) {
    return { error: "Artwork not found or unauthorized." };
  }

  const isFeaturedRequested =
    formData.get("is_featured") === "true" || formData.get("is_featured") === "on";
  const isPublished = currentArtwork.status === "published";

  const rawTags = formData.get("tags")?.toString();
  const rawInput = {
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    alt_text: formData.get("alt_text")?.toString() || "",
    category: formData.get("category")?.toString() || "other",
    medium: formData.get("medium")?.toString() || "digital-painting",
    tags: parseTags(rawTags),
    // Status invariant: draft cannot be featured
    is_featured: isPublished ? isFeaturedRequested : false,
  };

  const parsed = artworkInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Check if an image replacement was uploaded
  const newUploadId = formData.get("upload_id")?.toString().trim();

  try {
    let newPrivatePath = currentArtwork.private_image_path;
    let newPublicPath = currentArtwork.public_image_path;

    if (newUploadId) {
      // Image replacement flow (Section 4.8.6)
      const pendingUpload = await getValidPendingUpload(
        newUploadId,
        adminContext.adminUserId
      );

      const sourceBuffer = await downloadPrivateSource(pendingUpload.object_path);
      const validatedMeta = await validateSourceImageMetadata(sourceBuffer);

      if (isPublished) {
        // Generate new derivative with rollback intent
        const { derivativePath } = await generateAndUploadArtworkDerivative(
          currentArtwork.id,
          sourceBuffer
        );
        newPublicPath = derivativePath;
      }

      newPrivatePath = pendingUpload.object_path;

      // Queue old private source for cleanup
      if (currentArtwork.private_image_path) {
        await enqueueCleanupItem({
          bucketId: "artworks-private",
          objectPath: currentArtwork.private_image_path,
          reason: "replace",
          processAfter: new Date(),
        });
      }

      // Queue old public derivative for cleanup if replacing
      if (isPublished && currentArtwork.public_image_path) {
        await enqueueCleanupItem({
          bucketId: "artworks-public",
          objectPath: currentArtwork.public_image_path,
          reason: "replace",
          processAfter: new Date(),
        });
      }

      await markPendingUploadConsumed(
        newUploadId,
        sourceBuffer.length,
        validatedMeta.format
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("artworks")
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        alt_text: parsed.data.alt_text,
        category: parsed.data.category,
        medium: parsed.data.medium,
        tags: parsed.data.tags,
        is_featured: isPublished ? parsed.data.is_featured : false,
        private_image_path: newPrivatePath,
        public_image_path: newPublicPath,
        updated_at: now,
      })
      .eq("id", currentArtwork.id)
      .eq("profile_id", adminContext.adminUserId);

    if (updateError) {
      console.error("Failed to update artwork in database:", updateError);
      if (updateError.code === "23505") {
        return {
          error: "An artwork with this slug already exists. Please choose a different slug.",
        };
      }
      return {
        error: "Failed to update artwork details.",
      };
    }

    // If replacement derivative was uploaded, remove rollback intent
    if (newUploadId && isPublished && newPublicPath) {
      await supabase
        .from("storage_cleanup_queue")
        .delete()
        .eq("bucket_id", "artworks-public")
        .eq("object_path", newPublicPath)
        .eq("reason", "rollback");
    }

    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath(`/artworks/${parsed.data.slug}`);
    revalidatePath("/dashboard/artworks");
    revalidatePath(`/dashboard/artworks/${currentArtwork.id}/edit`);

    return { success: true };
  } catch (err: unknown) {
    console.error("Artwork update failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to update artwork.",
    };
  }
}

/**
 * Publishes an artwork to the public portfolio.
 */
export async function publishArtworkAction(
  artworkId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminContext = await requireAdmin();
    return await publishArtwork({
      artworkId,
      adminUserId: adminContext.adminUserId,
    });
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Failed to publish artwork.",
    };
  }
}

/**
 * Unpublishes an artwork, taking it down from the public gallery.
 */
export async function unpublishArtworkAction(
  artworkId: string
): Promise<{ success?: boolean; error?: string; cleanupPending?: boolean }> {
  try {
    const adminContext = await requireAdmin();
    return await unpublishArtwork({
      artworkId,
      adminUserId: adminContext.adminUserId,
    });
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Failed to unpublish artwork.",
    };
  }
}

/**
 * Deletes an artwork and enqueues its storage files for removal.
 */
export async function deleteArtworkAction(
  artworkId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminContext = await requireAdmin();
    const res = await deleteArtwork({
      artworkId,
      adminUserId: adminContext.adminUserId,
    });

    if (res.error) {
      return res;
    }

    redirect("/dashboard/artworks");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }

    return {
      error: err instanceof Error ? err.message : "Failed to delete artwork.",
    };
  }
}

/**
 * Regenerates the artwork-aware harmonious palette for an artwork using Sharp and OKLab.
 */
export async function regenerateArtworkPaletteAction(
  artworkId: string
): Promise<{ success?: boolean; error?: string; palette?: unknown }> {
  try {
    const adminContext = await requireAdmin();
    const supabase = createServiceClient();

    const { data: artwork, error: fetchErr } = await supabase
      .from("artworks")
      .select("*")
      .eq("id", artworkId)
      .eq("profile_id", adminContext.adminUserId)
      .maybeSingle();

    if (fetchErr || !artwork) {
      return { error: "Artwork not found or unauthorized." };
    }

    const imagePath = artwork.private_image_path || artwork.public_image_path;
    if (!imagePath) {
      return { error: "Artwork has no image source to analyze." };
    }

    const sourceBuffer = await downloadPrivateSource(imagePath);
    const analysis = await extractImageColorAnalysis(sourceBuffer);
    const generatedPalette = generateArtworkHarmoniousPalette({
      analysis,
      title: artwork.title,
      category: artwork.category,
    });

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("artworks")
      .update({
        palette_metadata: JSON.parse(JSON.stringify(generatedPalette)),
        updated_at: now,
      })
      .eq("id", artwork.id);

    if (updateError) {
      console.warn("Could not save palette to database column:", updateError.message);
    }

    revalidatePath(`/artworks/${artwork.slug}`);
    revalidatePath("/gallery");
    revalidatePath(`/dashboard/artworks/${artwork.id}/edit`);

    return { success: true, palette: generatedPalette };
  } catch (err: unknown) {
    console.error("Palette regeneration failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to regenerate palette.",
    };
  }
}

