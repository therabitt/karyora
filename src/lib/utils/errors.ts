/**
 * Detects whether an error is an internal Next.js bail-out signal
 * (such as dynamic server usage or redirects) that should never be caught/swallowed.
 */
export function isNextInternalBailout(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string"
  ) {
    const digest = (err as { digest: string }).digest;
    return digest.startsWith("DYNAMIC_SERVER_USAGE") || digest.startsWith("NEXT_REDIRECT");
  }
  return false;
}
