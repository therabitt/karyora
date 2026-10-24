import Link from "next/link";
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 w-full space-y-12">
      {/* Editorial Header */}
      <div className="border-b border-border pb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              Archive & Catalog
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight">
              Artwork Gallery
            </h1>
          </div>
          <div className="text-xs font-mono text-text-muted tracking-wider uppercase">
            [ Total: <span className="text-ink font-semibold">{total}</span> {total === 1 ? "Work" : "Works"} ]
          </div>
        </div>
        <p className="text-base text-ink-soft leading-relaxed max-w-2xl font-normal">
          Explore finished illustrations, character art, and conceptual works. Each piece represents a deliberate exploration of form, lighting, and narrative depth.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-4">
          {/* Category Filter Underline Tabs */}
          <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.15em] font-medium">
            <Link
              href={`/gallery${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`pb-2 transition-all relative ${
                currentCategory === "all"
                  ? "text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent"
                  : "text-text-muted hover:text-ink"
              }`}
            >
              All Works
            </Link>
            {ARTWORK_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/gallery?category=${cat}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
                className={`pb-2 transition-all relative capitalize ${
                  currentCategory === cat
                    ? "text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent"
                    : "text-text-muted hover:text-ink"
                }`}
              >
                {cat.replace("-", " ")}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider font-mono text-text-muted shrink-0">
            <span>Sort:</span>
            <Link
              href={`/gallery?sort=newest${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`transition-colors ${currentSort === "newest" ? "text-accent font-semibold underline decoration-accent underline-offset-4" : "hover:text-ink"}`}
            >
              Newest
            </Link>
            <span className="text-border-strong">/</span>
            <Link
              href={`/gallery?sort=oldest${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
              className={`transition-colors ${currentSort === "oldest" ? "text-accent font-semibold underline decoration-accent underline-offset-4" : "hover:text-ink"}`}
            >
              Oldest
            </Link>
          </div>
        </div>

        {/* Search Input Form */}
        <form method="GET" action="/gallery" className="max-w-md flex items-center gap-3">
          {currentCategory !== "all" && (
            <input type="hidden" name="category" value={currentCategory} />
          )}
          {currentSort !== "newest" && (
            <input type="hidden" name="sort" value={currentSort} />
          )}
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              defaultValue={currentQuery}
              placeholder="Search works by title or keyword..."
              className="w-full px-4 py-2.5 text-xs bg-surface border border-border rounded-sm text-ink placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-sm bg-ink text-surface hover:bg-accent transition-colors cursor-pointer"
          >
            Search
          </button>
          {(currentQuery || currentCategory !== "all") && (
            <Link
              href="/gallery"
              className="px-3 py-2.5 text-xs uppercase tracking-wider text-text-muted hover:text-ink transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Artwork Grid / Empty State */}
      {artworks.length === 0 ? (
        <div className="border border-border bg-surface p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto">
          <p className="font-serif text-3xl text-ink">No Artworks Found</p>
          <p className="text-sm text-text-muted leading-relaxed">
            No published artwork matches your current filter or search criteria.
          </p>
          <div className="pt-3">
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-colors"
            >
              Reset All Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {artworks.map((artwork, idx) => {
            const cardImageUrl = getStoragePublicUrl(artwork.public_image_path);
            const globalIndex = (currentPage - 1) * 9 + idx + 1;
            const formattedIndex = String(globalIndex).padStart(2, "0");

            return (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.slug}`}
                className="group block space-y-3"
              >
                {/* Artwork Plate */}
                <div className="relative aspect-4/3 bg-surface-muted border border-border overflow-hidden">
                  {cardImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cardImageUrl}
                      alt={artwork.alt_text}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center">
                      <span className="font-serif text-lg text-ink/70 group-hover:text-accent transition-colors">
                        {artwork.title}
                      </span>
                    </div>
                  )}

                  {/* Corner Index Tag */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-paper/90 backdrop-blur-xs text-[10px] font-mono text-ink tracking-wider border border-border/80">
                    № {formattedIndex}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium">
                    <span className="capitalize">{artwork.category.replace("-", " ")}</span>
                    <span>·</span>
                    <span className="capitalize">{artwork.medium.replace("-", " ")}</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl text-ink group-hover:text-accent transition-colors flex items-center justify-between">
                    <span>{artwork.title}</span>
                    <span className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" aria-hidden="true">
                      →
                    </span>
                  </h2>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-10 border-t border-border">
          <Link
            href={`/gallery?page=${currentPage - 1}${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
            className={`text-xs uppercase tracking-wider font-mono font-semibold transition-colors flex items-center gap-2 ${
              currentPage <= 1 ? "pointer-events-none opacity-30 text-text-muted" : "text-ink hover:text-accent"
            }`}
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </Link>

          <span className="text-xs font-mono uppercase tracking-widest text-text-muted">
            Page {currentPage} of {totalPages}
          </span>

          <Link
            href={`/gallery?page=${currentPage + 1}${currentCategory !== "all" ? `&category=${currentCategory}` : ""}${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
            className={`text-xs uppercase tracking-wider font-mono font-semibold transition-colors flex items-center gap-2 ${
              currentPage >= totalPages ? "pointer-events-none opacity-30 text-text-muted" : "text-ink hover:text-accent"
            }`}
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}