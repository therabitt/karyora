import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface AdminContext {
  user: User;
  adminUserId: string;
}

export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized: Administrator access required.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Server-side authorization guard for administrator operations.
 *
 * MANDATORY SECURITY RULES:
 * 1. Checks live session using `auth.getUser()` on cookie-aware server client.
 * 2. Compares confirmed user.id strictly against KARYORA_ADMIN_USER_ID.
 * 3. Enforces server-controlled app_metadata.role = 'admin' if configured.
 * 4. NEVER trusts user_metadata or client-supplied credentials.
 * 5. FAILS CLOSED on any error, mismatch, or missing configuration.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const configuredAdminId = process.env.KARYORA_ADMIN_USER_ID;

  if (!configuredAdminId) {
    throw new AuthorizationError(
      "Server configuration error: KARYORA_ADMIN_USER_ID is not configured."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError(
      error?.message || "Authentication required: No valid session found."
    );
  }

  // Verify identity matches single configured artist-administrator
  if (user.id !== configuredAdminId) {
    throw new AuthorizationError(
      "Access denied: User is not the designated Karyora administrator."
    );
  }

  // Check server-controlled app_metadata role if present
  const role = user.app_metadata?.role;
  if (role && role !== "admin") {
    throw new AuthorizationError(
      "Access denied: Invalid administrator role assignment."
    );
  }

  return {
    user,
    adminUserId: configuredAdminId,
  };
}

/**
 * Non-throwing check for optimistic UI rendering in Server Components.
 * Note: Mutations MUST always use requireAdmin() rather than getOptionalAdmin().
 */
export async function getOptionalAdmin(): Promise<AdminContext | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
