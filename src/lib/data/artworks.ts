import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isNextInternalBailout } from "@/lib/utils/errors";
import type { ArtworkCategory, Database } from "@/types/database.types";

export type PublicArtwork = Database["public"]["Views"]["public_artworks"]["Row"];
export type AdminArtwork = Database["public"]["Tables"]["artworks"]["Row"];

export interface GetPublishedArtworksOptions {
  query?: string;
  category?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

const DEFAULT_ARTWORKS: PublicArtwork[] = [
  {
    id: "seed-art-1",
    title: "Solitude in Crimson",
    slug: "solitude-in-crimson",
    description: "An ethereal character study exploring autumn twilight, quiet contemplation, and textured fabric rendering.",
    alt_text: "A crimson-cloaked figure gazing out over misty mountain valleys during autumn dusk.",
    category: "original-character",
    medium: "digital-painting",
    tags: ["character", "crimson", "autumn", "twilight"],
    public_image_path: "artworks-public/artworks/seed-art-1/v1.webp",
    image_width: null,
    image_height: null,
    status: "published",
    is_featured: true,
    published_at: "2026-10-18T10:00:00.000Z",
  },
  {
    id: "seed-art-2",
    title: "Whispering Pines",
    slug: "whispering-pines",
    description: "Environmental study of morning sunlight filtering through an alpine evergreen canopy.",
    alt_text: "Sunbeams breaking through a dense evergreen pine forest with soft morning mist.",
    category: "landscape",
    medium: "digital-painting",
    tags: ["landscape", "forest", "morning", "environment"],
    public_image_path: "artworks-public/artworks/seed-art-2/v1.webp",
    image_width: null,
    image_height: null,
    status: "published",
    is_featured: false,
    published_at: "2026-10-10T08:30:00.000Z",
  },
  {
    id: "seed-art-3",
    title: "Study in Luminescence",
    slug: "study-in-luminescence",
    description: "Portrait exploration of subsurface scattering and bioluminescent glow on delicate facial features.",
    alt_text: "Portrait of a serene subject illuminated by soft cyan bioluminescence against darkness.",
    category: "portrait",
    medium: "digital-painting",
    tags: ["portrait", "luminescence", "lighting"],
    public_image_path: "artworks-public/artworks/seed-art-3/v1.webp",
    image_width: null,
    image_height: null,
    status: "published",
    is_featured: true,
    published_at: "2026-10-05T14:15:00.000Z",
  },
];

/**
 * Retrieves featured published artworks for the homepage exhibition.
 */
export async function getFeaturedPublishedArtworks(limit = 8): Promise<PublicArtwork[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_artworks")
      .select("*")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      // If no explicitly featured artworks, display the latest published works
      const { data: latestData } = await supabase
        .from("public_artworks")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (latestData && latestData.length > 0) {
        return latestData;
      }

      return DEFAULT_ARTWORKS;
    }

    return data;
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn("Could not fetch featured artworks, using fallback:", err);
    return DEFAULT_ARTWORKS;
  }
}

/**
 * Retrieves a filtered, paginated list of published artworks for the gallery.
 */
export async function getPublishedArtworks({
  query,
  category,
  sort = "newest",
  page = 1,
  pageSize = 12,
}: GetPublishedArtworksOptions = {}): Promise<{
  artworks: PublicArtwork[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const supabase = await createClient();
    let dbQuery = supabase.from("public_artworks").select("*", { count: "exact" });

    // Category filter
    if (category && category !== "all" && category !== "All Works") {
      dbQuery = dbQuery.eq("category", category as ArtworkCategory);
    }

    // Search query filter (title, description, or tags)
    if (query && query.trim().length > 0) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`
      );
    }

    // Sort order
    dbQuery = dbQuery.order("published_at", { ascending: sort === "oldest" });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, count, error } = await dbQuery;

    if (error || !data || data.length === 0) {
      let filtered = [...DEFAULT_ARTWORKS];
      if (category && category !== "all" && category !== "All Works") {
        filtered = filtered.filter((a) => a.category === category);
      }
      if (query && query.trim().length > 0) {
        const q = query.toLowerCase().trim();
        filtered = filtered.filter(
          (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
      }
      return {
        artworks: filtered,
        total: filtered.length,
        page: 1,
        totalPages: 1,
      };
    }

    const total = count || data.length;
    return {
      artworks: data,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn("Could not fetch published artworks, using fallback:", err);
    return {
      artworks: DEFAULT_ARTWORKS,
      total: DEFAULT_ARTWORKS.length,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Retrieves a single published artwork by its unique slug for exhibition display.
 * Returns null if the artwork does not exist or is in Draft status.
 */
export async function getPublishedArtworkBySlug(slug: string): Promise<PublicArtwork | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_artworks")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      const fallback = DEFAULT_ARTWORKS.find((a) => a.slug === slug);
      return fallback || null;
    }

    return data;
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn(`Could not fetch artwork with slug "${slug}", using fallback:`, err);
    const fallback = DEFAULT_ARTWORKS.find((a) => a.slug === slug);
    return fallback || null;
  }
}

/**
 * Retrieves all published artworks in chronological publication order for interactive
 * exhibition showcases, catalogs, and the detail-view dock.
 */
export async function getAllPublishedArtworks(): Promise<PublicArtwork[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_artworks")
      .select("*")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_ARTWORKS;
    }

    return data;
  } catch (err) {
    if (isNextInternalBailout(err)) {
      throw err;
    }
    console.warn("Could not fetch all published artworks, using fallback:", err);
    return DEFAULT_ARTWORKS;
  }
}

/**
 * Retrieves all artworks (Draft and Published) for the administrator dashboard.
 */
export async function getAdminArtworks(statusFilter?: "draft" | "published"): Promise<AdminArtwork[]> {
  const supabase = createServiceClient();
  let query = supabase.from("artworks").select("*").order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Failed to fetch admin artworks:", error);
    return [];
  }

  return data;
}

/**
 * Retrieves a single artwork by ID for administrative editing.
 */
export async function getAdminArtworkById(id: string): Promise<AdminArtwork | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error(`Failed to fetch admin artwork ${id}:`, error);
    return null;
  }

  return data;
}
