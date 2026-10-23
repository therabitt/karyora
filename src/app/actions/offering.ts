"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { offeringInputSchema } from "@/types/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface OfferingActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates a new commission offering.
 */
export async function createOfferingAction(
  prevState: OfferingActionResult | null,
  formData: FormData
): Promise<OfferingActionResult> {
  let adminContext;
  try {
    adminContext = await requireAdmin();
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Unauthorized: Administrator access required.",
    };
  }

  const rawPrice = formData.get("price_from")?.toString().trim();
  const rawOrder = formData.get("display_order")?.toString().trim();

  const rawInput = {
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    price_from: rawPrice ? Number(rawPrice) : null,
    price_currency: formData.get("price_currency")?.toString().toUpperCase() || "IDR",
    display_order: rawOrder ? Number(rawOrder) : 0,
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };

  const parsed = offeringInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createServiceClient();
  const { error: dbError } = await supabase.from("commission_offerings").insert({
    profile_id: adminContext.adminUserId,
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    price_from: parsed.data.price_from,
    price_currency: parsed.data.price_currency,
    display_order: parsed.data.display_order,
    is_active: parsed.data.is_active,
  });

  if (dbError) {
    console.error("Offering creation error:", dbError);
    if (dbError.code === "23505") {
      return {
        error: "An offering with this slug already exists. Please choose a different slug.",
      };
    }
    return {
      error: "Failed to create offering. Please try again.",
    };
  }

  revalidatePath("/commission");
  revalidatePath("/dashboard/offerings");
  redirect("/dashboard/offerings");
}

/**
 * Updates an existing commission offering.
 */
export async function updateOfferingAction(
  offeringId: string,
  prevState: OfferingActionResult | null,
  formData: FormData
): Promise<OfferingActionResult> {
  let adminContext;
  try {
    adminContext = await requireAdmin();
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Unauthorized: Administrator access required.",
    };
  }

  const rawPrice = formData.get("price_from")?.toString().trim();
  const rawOrder = formData.get("display_order")?.toString().trim();

  const rawInput = {
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    price_from: rawPrice ? Number(rawPrice) : null,
    price_currency: formData.get("price_currency")?.toString().toUpperCase() || "IDR",
    display_order: rawOrder ? Number(rawOrder) : 0,
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };

  const parsed = offeringInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createServiceClient();
  const { error: dbError } = await supabase
    .from("commission_offerings")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price_from: parsed.data.price_from,
      price_currency: parsed.data.price_currency,
      display_order: parsed.data.display_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", offeringId)
    .eq("profile_id", adminContext.adminUserId);

  if (dbError) {
    console.error("Offering update error:", dbError);
    if (dbError.code === "23505") {
      return {
        error: "An offering with this slug already exists. Please choose a different slug.",
      };
    }
    return {
      error: "Failed to update offering. Please try again.",
    };
  }

  revalidatePath("/commission");
  revalidatePath("/dashboard/offerings");
  return { success: true };
}

/**
 * Toggles an offering's active/inactive status (Section 6.5.1).
 */
export async function toggleOfferingActiveAction(
  offeringId: string,
  isActive: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminContext = await requireAdmin();
    const supabase = createServiceClient();

    const { error: dbError } = await supabase
      .from("commission_offerings")
      .update({ is_active: isActive })
      .eq("id", offeringId)
      .eq("profile_id", adminContext.adminUserId);

    if (dbError) {
      throw dbError;
    }

    revalidatePath("/commission");
    revalidatePath("/dashboard/offerings");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle offering status failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to toggle offering status.",
    };
  }
}

/**
 * Hard deletes an offering ONLY if no inquiries reference it (Section 6.5.1).
 * If referenced, returns an error instructing the user to deactivate instead.
 */
export async function deleteOfferingAction(
  offeringId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminContext = await requireAdmin();
    const supabase = createServiceClient();

    // Check if offering is referenced by inquiries
    const { count, error: countError } = await supabase
      .from("commission_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("offering_id", offeringId);

    if (countError) {
      throw countError;
    }

    if (count && count > 0) {
      return {
        error: `Cannot delete offering because ${count} inquiry record(s) reference it. Deactivate this offering instead to preserve inquiry history.`,
      };
    }

    const { error: deleteError } = await supabase
      .from("commission_offerings")
      .delete()
      .eq("id", offeringId)
      .eq("profile_id", adminContext.adminUserId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/commission");
    revalidatePath("/dashboard/offerings");
    redirect("/dashboard/offerings");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    console.error("Delete offering failed:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to delete offering.",
    };
  }
}
