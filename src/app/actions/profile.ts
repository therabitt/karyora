"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { profileUpdateSchema } from "@/types/domain";
import { revalidatePath } from "next/cache";

export interface ProfileActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Updates the artist profile and commission availability settings.
 * Protected by runtime requireAdmin() check.
 */
export async function updateProfileAction(
  prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  let adminContext;
  try {
    adminContext = await requireAdmin();
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Unauthorized: Administrator access required.",
    };
  }

  // Parse social links from individual fields
  const socialTwitter = formData.get("social_twitter")?.toString().trim();
  const socialInstagram = formData.get("social_instagram")?.toString().trim();
  const socialArtstation = formData.get("social_artstation")?.toString().trim();
  const socialCara = formData.get("social_cara")?.toString().trim();

  const social_links: Record<string, string> = {};
  if (socialTwitter) social_links.twitter = socialTwitter;
  if (socialInstagram) social_links.instagram = socialInstagram;
  if (socialArtstation) social_links.artstation = socialArtstation;
  if (socialCara) social_links.cara = socialCara;

  const rawInput = {
    display_name: formData.get("display_name")?.toString() || "",
    bio: formData.get("bio")?.toString() || "",
    contact_email: formData.get("contact_email")?.toString().trim() || null,
    commission_availability: formData.get("commission_availability")?.toString() || "open",
    availability_message: formData.get("availability_message")?.toString().trim() || "",
    social_links,
  };

  const parsed = profileUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createServiceClient();
  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio,
      contact_email: parsed.data.contact_email,
      commission_availability: parsed.data.commission_availability,
      availability_message: parsed.data.availability_message,
      social_links: parsed.data.social_links,
    })
    .eq("id", adminContext.adminUserId);

  if (dbError) {
    console.error("Profile update failed in database:", dbError);
    return {
      error: "Failed to update profile settings. Please try again.",
    };
  }

  // Revalidate public and admin paths
  revalidatePath("/");
  revalidatePath("/commission");
  revalidatePath("/contact");
  revalidatePath("/dashboard/settings");

  return {
    success: true,
  };
}
