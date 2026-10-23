import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates the privileged server-only Supabase client using SUPABASE_SECRET_KEY.
 *
 * PRIVILEGE BOUNDARY:
 * - This module MUST only be imported by server-side modules (enforced via 'server-only').
 * - This client operates with service-role semantics and bypasses Row Level Security.
 * - ALL administrative mutations and reads of private columns MUST first pass runtime
 *   `requireAdmin()` verification before invoking operations with this client.
 * - Public inquiry insertion uses this client exclusively through a dedicated,
 *   narrowly-scoped server action that validates explicit allowed fields, availability,
 *   honeypot, and rate limits.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY environment variable. Privileged server operations cannot execute without configuration."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
