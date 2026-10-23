import "server-only";

import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes = 900s
export const MAX_INQUIRY_ATTEMPTS = 5;

/**
 * Computes a keyed HMAC-SHA256 hash of the client identifier (IP / subnet).
 * Ensures client IP addresses are not stored in plaintext in the database.
 */
export function hashClientIdentifier(identifier: string): string {
  const secret =
    process.env.KARYORA_RATE_LIMIT_SECRET ||
    process.env.ARTLOOM_RATE_LIMIT_SECRET ||
    "fallback-karyora-dev-secret";
  return crypto.createHmac("sha256", secret).update(identifier).digest("hex");
}

/**
 * Calculates the current 15-minute window start timestamp in ISO format.
 */
export function getCurrentWindowStart(now: Date = new Date()): string {
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const windowStartTime = Math.floor(now.getTime() / windowMs) * windowMs;
  return new Date(windowStartTime).toISOString();
}

/**
 * Evaluates rate limit against persistent PostgreSQL inquiry_rate_limits table (COM-004 MUST).
 * Invokes the atomic check_and_increment_rate_limit stored function via privileged service client.
 */
export async function checkInquiryRateLimit(clientIdentifier: string): Promise<{
  allowed: boolean;
  attemptCount: number;
}> {
  const keyHash = hashClientIdentifier(clientIdentifier);
  const windowStart = getCurrentWindowStart();

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
    p_key_hash: keyHash,
    p_window_start: windowStart,
    p_max_attempts: MAX_INQUIRY_ATTEMPTS,
  });

  if (error || !data || data.length === 0) {
    console.error("Rate limiting evaluation error:", error);
    // Fail closed if the database rate limit cannot be evaluated
    return {
      allowed: false,
      attemptCount: MAX_INQUIRY_ATTEMPTS + 1,
    };
  }

  const result = data[0];
  return {
    allowed: result.allowed,
    attemptCount: result.current_count,
  };
}
