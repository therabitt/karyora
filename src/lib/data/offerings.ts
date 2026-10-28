import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isNextInternalBailout } from "@/lib/utils/errors";
import type { Database } from "@/types/database.types";

export type PublicOffering = Database["public"]["Views"]["public_commission_offerings"]["Row"];
export type AdminOffering = Database["public"]["Tables"]["commission_offerings"]["Row"] & {
  inquiry_count?: number;
};

export const DEFAULT_OFFERINGS: PublicOffering[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    title: "Character Portrait / Bust",
    slug: "character-portrait-bust",
    description: "Detailed head-and-shoulders character portrait with expressive lighting, rendered textures, and stylized atmospheric backdrop.",
    price_from: 500000,
    price_currency: "IDR",
    display_order: 1,
    is_active: true,
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    title: "Half-Body Illustration",
    slug: "half-body-illustration",
    description: "Dynamic waist-up character framing featuring detailed costume rendering, props or weapons, and atmospheric lighting effects.",
    price_from: 900000,
    price_currency: "IDR",
    display_order: 2,
    is_active: true,
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    title: "Full Illustration & Environment",
    slug: "full-illustration-environment",
    description: "Complete narrative painting with full-figure character integration, perspective environmental background, and cinematic lighting.",
    price_from: 1500000,
    price_currency: "IDR",
    display_order: 3,
    is_active: true,
  },
];

export interface PublicOfferingsResult {
  offerings: PublicOffering[];
  state: "available" | "empty" | "unavailable";
}

/**
 * Retrieves active commission offerings for public presentation.
 * Uses public_commission_offerings security-invoker view.
 *
 * Do not display demo defaults as live services or prices when the public query
 * returns no rows or fails. The page can distinguish a genuinely empty list
 * from a temporary data-access failure using the returned state.
 */
export async function getActiveCommissionOfferings(): Promise<PublicOfferingsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_commission_offerings")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch public commission offerings:", error);
      return { offerings: [], state: "unavailable" };
    }

    if (!data || data.length === 0) {
      return { offerings: [], state: "empty" };
    }

    return { offerings: data, state: "available" };
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn("Could not fetch public commission offerings:", err);
    return { offerings: [], state: "unavailable" };
  }
}

type OfferingWithInquiriesRow = Database["public"]["Tables"]["commission_offerings"]["Row"] & {
  commission_inquiries?: { count: number }[];
};

/**
 * Retrieves all commission offerings (both active and inactive) for administrator dashboard.
 */
export async function getAdminOfferings(): Promise<AdminOffering[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("commission_offerings")
    .select("*, commission_inquiries(count)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch admin offerings:", error);
    return [];
  }

  const rows = data as unknown as OfferingWithInquiriesRow[];
  return rows.map((item) => ({
    ...item,
    inquiry_count: item.commission_inquiries?.[0]?.count || 0,
  }));
}

/**
 * Retrieves a single offering by ID for administrative editing.
 */
export async function getAdminOfferingById(id: string): Promise<AdminOffering | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("commission_offerings")
    .select("*, commission_inquiries(count)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error(`Failed to fetch offering ${id}:`, error);
    return null;
  }

  const row = data as unknown as OfferingWithInquiriesRow;
  return {
    ...row,
    inquiry_count: row.commission_inquiries?.[0]?.count || 0,
  };
}
