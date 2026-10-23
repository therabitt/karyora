import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPublishedArtworks } from "@/lib/data/artworks";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import { ARTWORK_CATEGORIES } from "@/types/domain";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse the curated portfolio of digital paintings, character illustrations, and traditional studies.",
};

interface GalleryPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "newest" | "oldest";
    page?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const currentQuery = params.q || "";
  const currentCategory = params.category || "all";
  const currentSort = params.sort === "oldest" ? "oldest" : "newest";
  const currentPage = Math.max(1, Number(params.page) || 1);

  const { artworks, total, totalPages } = await getPublishedArtworks({
    query: currentQuery,
    category: currentCategory,
    sort: currentSort,
    page: currentPage,
    pageSize: 9,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full space-y-10">
      {/* Header */}
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-4xl sm:text-5xl text-ink">Artwork Gallery</h1>
          <span className="text-xs text-text-muted font-mono">({total} works)</span>
        </div>
        <p className="text-base text-text-muted leading-relaxed">
          Explore finished illustrations, character art, and conceptual works. Each piece represents a deliberate exploration of form, lighting, and narrative.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/gallery${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentCategory === "all"
                  ? "bg-ink text-surface"
                  : "bg-surface text-ink-soft hover:bg-surface-muted border border-border"
              }`}
            >
              All Works
            </Link>
            {ARTWORK_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/gallery?category=${cat}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  currentCategory === cat
                    ? "bg-ink text-surface"
                    : "bg-surface text-ink-soft hover:bg-surface-muted border border-border"
                }`}
              >
                {cat.replace("-", " ")}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Sort:</span>
            <Link
              href={`/gallery?sort=newest${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`hover:text-ink font-medium ${currentSort === "newest" ? "text-ink underline" : ""}`}
            >
              Newest
            </Link>
            <span>•</span>
            <Link
              href={`/gallery?sort=oldest${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`hover:text-ink font-medium ${currentSort === "oldest" ? "text-ink underline" : ""}`}
            >
              Oldest
            </Link>
          </div>
        </div>

        {/* Search Input Form */}
        <form method="GET" action="/gallery" className="max-w-md flex items-center gap-2">
          {currentCategory !== "all" && (
            <input type="hidden" name="category" value={currentCategory} />
          )}
          {currentSort !== "newest" && (
            <input type="hidden" name="sort" value={currentSort} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search artworks by title or keyword..."
            className="flex-1 px-3.5 py-2 text-xs bg-surface border border-border-strong rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink"
          />
          <Button variant="outline" size="sm" type="submit">
            Search
          </Button>
          {(currentQuery || currentCategory !== "all") && (
            <Link href="/gallery">
              <Button variant="ghost" size="sm" type="button">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </div>

      {/* Artwork Grid / Empty State */}
      {artworks.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center space-y-4 max-w-lg mx-auto">
          <p className="font-serif text-2xl text-ink">No Artworks Found</p>
          <p className="text-sm text-text-muted">
            No published artwork matches your current filter or search criteria.
          </p>
          <div className="pt-2">
            <Link href="/gallery">
              <Button variant="outline">Reset All Filters</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {artworks.map((artwork) => {
            const cardImageUrl = getStoragePublicUrl(artwork.public_image_path);
            return (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.slug}`}
                className="group block"
              >
                <Card className="overflow-hidden group-hover:border-border-strong transition-all h-full flex flex-col justify-between">
                  <div className="relative aspect-4/3 bg-surface-muted flex items-center justify-center overflow-hidden">
                    {cardImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cardImageUrl}
                        alt={artwork.alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-4 text-center">
                        <span className="font-serif text-lg text-ink/70 group-hover:text-accent transition-colors">
                          {artwork.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="capitalize">{artwork.category.replace("-", " ")}</span>
                      <span className="capitalize">{artwork.medium.replace("-", " ")}</span>
                    </div>
                    <h2 className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                      {artwork.title}
                    </h2>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8 border-t border-border">
          <Link
            href={`/gallery?page=${currentPage - 1}${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
            className={currentPage <= 1 ? "pointer-events-none opacity-40" : ""}
          >
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              Previous
            </Button>
          </Link>
          <span className="text-xs text-text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={`/gallery?page=${currentPage + 1}${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
            className={currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}
          >
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
