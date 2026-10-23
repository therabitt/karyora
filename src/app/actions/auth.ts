"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export interface AuthActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Handles administrator authentication with identity verification.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid credentials provided.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !user) {
    return {
      error: "Invalid email or password. Please check your credentials.",
    };
  }

  // Single administrator identity enforcement (Section 4.7.1)
  const configuredAdminId = process.env.KARYORA_ADMIN_USER_ID;
  if (configuredAdminId && user.id !== configuredAdminId) {
    // Immediately terminate non-admin session
    await supabase.auth.signOut();
    return {
      error: "Access denied: This account is not authorized to access the studio dashboard.",
    };
  }

  redirect("/dashboard");
}

/**
 * Signs out the current administrator session.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
