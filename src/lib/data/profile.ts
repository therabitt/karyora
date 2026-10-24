import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isNextInternalBailout } from "@/lib/utils/errors";
import type { Database } from "@/types/database.types";

export type PublicProfile = Database["public"]["Views"]["public_profile"]["Row"];
export type AdminProfile = Database["public"]["Tables"]["profiles"]["Row"];

const DEFAULT_PROFILE: PublicProfile = {
  display_name: "Karyora Artist",
  bio: "Independent visual artist and illustrator specializing in imaginative character design, atmospheric environmental painting, and narrative digital art.",
  avatar_path: null,
  contact_email: "artist@karyora.internal",
  social_links: {
    twitter: "https://x.com/karyora",
    artstation: "https://artstation.com/karyora",
  },
  commission_availability: "open",
  availability_message: "Commissions are currently open for personal and commercial projects.",
};

/**
 * Retrieves the public artist profile from the security-invoker view.
 * Omits private ID, auth keys, and internal timestamps.
 */
export async function getPublicProfile(): Promise<PublicProfile> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_PROFILE;
    }

    return data;
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn("Could not fetch public profile from database, using fallback:", err);
    return DEFAULT_PROFILE;
  }
}

/**
 * Retrieves the full artist profile for the administrative settings dashboard.
 * Requires administrator verification.
 */
export async function getAdminProfile(adminUserId: string): Promise<AdminProfile | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", adminUserId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch admin profile:", error);
    return null;
  }

  return data;
}

/**
 * Ensures an admin profile record exists in public.profiles for the given admin ID.
 * Prevents foreign key constraint violations on artworks, offerings, and pending_uploads.
 */
export async function ensureAdminProfile(adminUserId: string, email?: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", adminUserId)
      .maybeSingle();

    if (!data) {
      await supabase.from("profiles").upsert(
        {
          id: adminUserId,
          display_name: "Karyora Artist",
          contact_email: email || "artist@karyora.internal",
          bio: "Independent visual artist and illustrator specializing in imaginative character design, atmospheric environmental painting, and narrative digital art.",
          commission_availability: "open",
          availability_message: "Commissions are currently open for personal and commercial projects.",
          social_links: { instagram: "https://instagram.com" },
        },
        { onConflict: "id" }
      );
    }
  } catch (err) {
    console.warn("Could not ensure admin profile existence:", err);
  }
}
