import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getAdminProfile, type AdminProfile } from "@/lib/data/profile";
import type { Database } from "@/types/database.types";

export interface DashboardStats {
  totalArtworks: number;
  publishedArtworks: number;
  draftArtworks: number;
  newInquiries: number;
  totalOfferings: number;
  activeOfferings: number;
  pendingCleanupCount: number;
  profile: AdminProfile | null;
}

export type RecentInquiryItem = Database["public"]["Tables"]["commission_inquiries"]["Row"];

/**
 * Retrieves high-level operational statistics for the dashboard overview.
 */
export async function getDashboardStats(adminUserId: string): Promise<DashboardStats> {
  const supabase = createServiceClient();

  const [
    artworksResult,
    inquiriesResult,
    offeringsResult,
    cleanupResult,
    profile,
  ] = await Promise.all([
    supabase.from("artworks").select("status"),
    supabase.from("commission_inquiries").select("status").eq("status", "new"),
    supabase.from("commission_offerings").select("is_active"),
    supabase.from("storage_cleanup_queue").select("id", { count: "exact", head: true }),
    getAdminProfile(adminUserId),
  ]);

  const artworks = artworksResult.data || [];
  const publishedArtworks = artworks.filter((a) => a.status === "published").length;
  const draftArtworks = artworks.filter((a) => a.status === "draft").length;

  const newInquiries = (inquiriesResult.data || []).length;

  const offerings = offeringsResult.data || [];
  const activeOfferings = offerings.filter((o) => o.is_active).length;

  const pendingCleanupCount = cleanupResult.count || 0;

  return {
    totalArtworks: artworks.length,
    publishedArtworks,
    draftArtworks,
    newInquiries,
    totalOfferings: offerings.length,
    activeOfferings,
    pendingCleanupCount,
    profile,
  };
}

/**
 * Retrieves the most recent inquiries for the dashboard quick-access widget.
 */
export async function getRecentInquiries(limit = 5): Promise<RecentInquiryItem[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("commission_inquiries")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}
