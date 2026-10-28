/**
 * Helper to construct public CDN / Storage URLs for public bucket derivatives.
 */
export function getStoragePublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If already absolute URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // If the path includes the bucket name already
  if (cleanPath.startsWith("artworks-public/") || cleanPath.startsWith("profiles-public/")) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
  }

  // Default to artworks-public
  return `${supabaseUrl}/storage/v1/object/public/artworks-public/${cleanPath}`;
}


/**
 * Returns true only for public Storage objects on the configured Supabase origin.
 * Legacy absolute image URLs remain displayable without requiring an allowlisted
 * Next.js Image optimizer hostname.
 */
export function isOptimizablePublicStorageUrl(url: string | null | undefined): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !supabaseUrl) return false;

  try {
    const image = new URL(url);
    const storage = new URL(supabaseUrl);
    return (
      image.origin === storage.origin &&
      image.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
