"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { getPublicProfile } from "@/lib/data/profile";
import { DEFAULT_OFFERINGS } from "@/lib/data/offerings";
import { checkInquiryRateLimit } from "@/lib/rate-limit/inquiry-limiter";
import {
  inquirySubmissionSchema,
  inquiryStatusUpdateSchema,
  type InquiryStatusUpdateInput,
} from "@/types/domain";
import { revalidatePath } from "next/cache";

export interface InquiryActionResult {
  success?: boolean;
  message?: string;
  error?: string;
  isRateLimited?: boolean;
  fieldErrors?: Record<string, string[]>;
  timestamp?: number;
}

/**
 * Public Server Action for submitting a commission inquiry (COM-001 - COM-014).
 * Enforces rate limiting, honeypot suppression, availability validation,
 * offering snapshotting, and server-side Zod validation.
 */
export async function submitInquiryAction(
  prevState: InquiryActionResult | null,
  formData: FormData
): Promise<InquiryActionResult> {
  // 1. Bot suppression via hidden honeypot field (COM-003 MUST)
  const honeypotValue = formData.get("hp_website_contact")?.toString().trim();
  if (honeypotValue && honeypotValue.length > 0) {
    // Return generic success to silently discard bot submissions without revealing the trap
    return {
      success: true,
      message: "Your inquiry has been submitted for consideration.",
      timestamp: Date.now(),
    };
  }

  // 2. Persistent shared rate limiting via PostgreSQL (COM-004 MUST)
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  const userAgent = headerList.get("user-agent") || "";
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
  const clientIdentifier = `${clientIp}:${userAgent.slice(0, 80)}`;

  try {
    const rateLimit = await checkInquiryRateLimit(clientIdentifier);
    if (!rateLimit.allowed) {
      return {
        error: "Too many submission attempts. Please wait 15 minutes before submitting another inquiry.",
        isRateLimited: true,
        timestamp: Date.now(),
      };
    }
  } catch (rateLimitErr) {
    console.error("Rate limit check failed:", rateLimitErr);
    // Fail closed if the database limiter is unreachable
    return {
      error: "Unable to process inquiry at this moment. Please try again shortly.",
      timestamp: Date.now(),
    };
  }

  // 3. Global availability verification (COM-014 MUST)
  const profile = await getPublicProfile();
  if (profile.commission_availability === "closed") {
    return {
      error: "Commissions are currently closed. The artist is not accepting new inquiries at this time.",
    };
  }

  const availabilityAtSubmission =
    profile.commission_availability === "waitlist" ? "waitlist" : "open";

  // 4. Server-side Zod input validation (COM-002 MUST)
  const rawBudget = formData.get("budget_amount")?.toString().trim();
  const rawDeadline = formData.get("desired_deadline")?.toString().trim();
  const rawOfferingId = formData.get("offering_id")?.toString().trim();

  const rawInput = {
    client_name: formData.get("client_name")?.toString() || "",
    client_email: formData.get("client_email")?.toString() || "",
    offering_id: rawOfferingId && rawOfferingId.length > 0 ? rawOfferingId : null,
    description: formData.get("description")?.toString() || "",
    budget_amount: rawBudget ? Number(rawBudget) : null,
    budget_currency: formData.get("budget_currency")?.toString().toUpperCase() || "IDR",
    desired_deadline: rawDeadline && rawDeadline.length > 0 ? rawDeadline : null,
    hp_website_contact: honeypotValue || undefined,
  };

  const parsed = inquirySubmissionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      timestamp: Date.now(),
    };
  }

  const supabase = createServiceClient();

  // 5. Snapshot offering title to preserve immutable historical brief (COM-013 MUST)
  let offeringTitleSnapshot = "Custom Project";
  let validOfferingId: string | null = null;

  if (parsed.data.offering_id) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      parsed.data.offering_id
    );

    if (isUuid) {
      const { data: offering } = await supabase
        .from("commission_offerings")
        .select("id, title")
        .eq("id", parsed.data.offering_id)
        .maybeSingle();

      if (offering?.title) {
        offeringTitleSnapshot = offering.title;
        validOfferingId = offering.id;
      }
    }

    if (!validOfferingId) {
      const defaultMatch = DEFAULT_OFFERINGS.find(
        (o) => o.id === parsed.data.offering_id || o.slug === parsed.data.offering_id
      );
      if (defaultMatch) {
        offeringTitleSnapshot = defaultMatch.title;
      }
    }
  }

  // 6. Write inquiry record via privileged service client (COM-005 MUST)
  const { error: insertError } = await supabase.from("commission_inquiries").insert({
    client_name: parsed.data.client_name,
    client_email: parsed.data.client_email,
    offering_id: validOfferingId,
    offering_title_snapshot: offeringTitleSnapshot,
    description: parsed.data.description,
    budget_amount: parsed.data.budget_amount || null,
    budget_currency: parsed.data.budget_currency,
    desired_deadline: parsed.data.desired_deadline || null,
    availability_at_submission: availabilityAtSubmission,
    status: "new",
  });

  if (insertError) {
    console.error("Failed to insert commission inquiry:", insertError);
    return {
      error: "Failed to submit your inquiry. Please try again.",
    };
  }

  // 7. Revalidate dashboard inbox counts
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/commissions");

  return {
    success: true,
    message:
      availabilityAtSubmission === "waitlist"
        ? "Your inquiry has been placed on the artist's waitlist queue. You will receive an email once your project is reviewed!"
        : "Your commission inquiry has been submitted successfully! The artist will review your project brief and get in touch via email.",
    timestamp: Date.now(),
  };
}

/**
 * Administrator action to update inquiry workflow status and private notes (COM-007 - COM-012).
 * Protected by requireAdmin() and guarded by database triggers.
 */
export async function updateInquiryStatusAction(
  inquiryId: string,
  input: InquiryStatusUpdateInput
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin();

    const parsed = inquiryStatusUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message || "Invalid status update data.",
      };
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("commission_inquiries")
      .update({
        status: parsed.data.status,
        admin_notes: parsed.data.admin_notes || null,
        updated_at: now,
      })
      .eq("id", inquiryId);

    if (updateError) {
      console.error("Inquiry status update failed in database:", updateError);
      return {
        error: updateError.message || "Failed to update inquiry status.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/commissions");
    revalidatePath(`/dashboard/commissions/${inquiryId}`);

    return { success: true };
  } catch (err: unknown) {
    console.error("Inquiry update error:", err);
    return {
      error: err instanceof Error ? err.message : "Unauthorized or failed operation.",
    };
  }
}
