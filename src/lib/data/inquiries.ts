import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { Database, InquiryStatus } from "@/types/database.types";

export type AdminInquiry = Database["public"]["Tables"]["commission_inquiries"]["Row"];

export interface InquiryStatusCounts {
  all: number;
  new: number;
  reviewing: number;
  accepted: number;
  declined: number;
  completed: number;
}

import { getPermittedStatusTransitions } from "@/types/domain";

export { getPermittedStatusTransitions };

export interface GetAdminInquiriesResult {
  inquiries: AdminInquiry[];
  counts: InquiryStatusCounts;
}

/**
 * Retrieves all inquiries with optional status filtering and counts per status tab.
 */
export async function getAdminInquiries(
  statusFilter?: InquiryStatus
): Promise<GetAdminInquiriesResult> {
  const supabase = createServiceClient();

  // 1. Fetch all inquiry statuses to compute accurate tab counts
  const { data: statusRows, error: countError } = await supabase
    .from("commission_inquiries")
    .select("status");

  const counts: InquiryStatusCounts = {
    all: 0,
    new: 0,
    reviewing: 0,
    accepted: 0,
    declined: 0,
    completed: 0,
  };

  if (!countError && statusRows) {
    counts.all = statusRows.length;
    for (const row of statusRows) {
      if (row.status in counts) {
        counts[row.status as InquiryStatus]++;
      }
    }
  }

  // 2. Query filtered inquiries
  let query = supabase
    .from("commission_inquiries")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Failed to fetch admin inquiries:", error);
    return {
      inquiries: [],
      counts,
    };
  }

  return {
    inquiries: data,
    counts,
  };
}

/**
 * Retrieves a single inquiry by ID for administrator review and note management.
 */
export async function getAdminInquiryById(id: string): Promise<AdminInquiry | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("commission_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error(`Failed to fetch admin inquiry ${id}:`, error);
    return null;
  }

  return data;
}
