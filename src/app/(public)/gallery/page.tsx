import Link from "next/link";
import { getPublishedArtworks } from "@/lib/data/artworks";
import { ARTWORK_CATEGORIES } from "@/types/domain";
import { LivingIndexGallery } from "@/components/gallery/LivingIndexGallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Living Index — Curated Artwork Archive",
  description:
    "An interactive typographic catalog of original character art, digital paintings, and visual studies by Karyora.",
};

interface GalleryPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "newest" | "oldest";
    page?: string;
    item?: string;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  "original-character": "Original Character",
  "fan-art": "Fan Art",
  portrait: "Portrait",
  landscape: "Landscape",
  other: "Other Studies",
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const currentQuery = (params.q || "").trim();
  const currentCategory = params.category || "all";
  const currentSort = params.sort === "oldest" ? "oldest" : "newest";
  const currentPage = Math.max(1, Number(params.page) || 1);
  const initialIndex = params.item ? Math.max(0, Number(params.item) - 1) : 0;
  const pageSize = 12;

  const { artworks, total, totalPages } = await getPublishedArtworks({
    query: currentQuery,
    category: currentCategory,
    sort: currentSort,
    page: currentPage,
    pageSize,
  });

  const isFiltered = currentQuery !== "" || currentCategory !== "all";
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 w-full space-y-4 sm:space-y-6">
      {/* ─── Editorial Living Index Masthead (Compact, Art-Directed) ─── */}
      <section className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
            <span>Archive & Catalog</span>
            <span className="text-border-strong font-normal">/</span>
            <span className="text-text-muted">Living Index</span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight leading-[1.08]">
            The Living Index
          </h1>
        </div>

        {/* Catalog Counter */}
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-text-muted uppercase">
          <span>[ Catalog:</span>
          <span className="text-ink font-semibold">{total}</span>
          <span>{total === 1 ? "Work" : "Works"} Cataloged ]</span>
        </div>
      </section>

      {/* ─── Refined Editorial Discovery Bar (Underline Tabs, Understated Search) ─── */}
      <section className="space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-2">
          {/* Category Filter Underline Strip */}
          <nav
            aria-label="Filter works by category"
            className="flex items-center gap-5 sm:gap-6 overflow-x-auto py-1 scrollbar-none"
          >
            <Link
              href={`/gallery${
                currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ""
              }${currentSort !== "newest" ? `${currentQuery ? "&" : "?"}sort=${currentSort}` : ""}`}
              className={`shrink-0 text-xs uppercase tracking-[0.16em] py-1 transition-colors relative ${
                currentCategory === "all"
                  ? "text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-accent"
                  : "text-text-muted hover:text-ink font-medium"
              }`}
            >
              All Works
            </Link>
            {ARTWORK_CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat;
              const label = CATEGORY_LABELS[cat] || cat.replace("-", " ");

              return (
                <Link
                  key={cat}
                  href={`/gallery?category=${cat}${
                    currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""
                  }${currentSort !== "newest" ? `&sort=${currentSort}` : ""}`}
                  className={`shrink-0 text-xs uppercase tracking-[0.16em] py-1 transition-colors relative ${
                    isActive
                      ? "text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-accent"
                      : "text-text-muted hover:text-ink font-medium"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Understated Search & Sort Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            {/* Search Input Form */}
            <form
              method="GET"
              action="/gallery"
              className="relative flex items-center min-w-[200px] sm:w-52"
            >
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
                placeholder="Search archive..."
                aria-label="Search archive by title or keyword"
                className="w-full pl-8 pr-7 py-1 text-xs bg-paper border border-border/80 rounded-xs text-ink placeholder:text-text-muted focus:outline-hidden focus-visible:ring-1 focus-visible:ring-accent focus:border-accent transition-colors"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-text-muted absolute left-2.5 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              {currentQuery && (
                <Link
                  href={`/gallery${
                    currentCategory !== "all" ? `?category=${currentCategory}` : ""
                  }${
                    currentSort !== "newest"
                      ? `${currentCategory !== "all" ? "&" : "?"}sort=${currentSort}`
                      : ""
                  }`}
                  aria-label="Clear search query"
                  className="absolute right-2 text-text-muted hover:text-ink text-xs font-semibold p-0.5"
                >
                  ✕
                </Link>
              )}
            </form>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-text-muted shrink-0 pl-1">
              <span className="text-[10px] text-text-muted/70">Sort:</span>
              <Link
                href={`/gallery?sort=newest${
                  currentCategory !== "all" ? `&category=${currentCategory}` : ""
                }${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
                className={`transition-colors ${
                  currentSort === "newest"
                    ? "text-accent font-semibold"
                    : "hover:text-ink"
                }`}
              >
                Newest
              </Link>
              <span className="text-border-strong font-normal">/</span>
              <Link
                href={`/gallery?sort=oldest${
                  currentCategory !== "all" ? `&category=${currentCategory}` : ""
                }${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}`}
                className={`transition-colors ${
                  currentSort === "oldest"
                    ? "text-accent font-semibold"
                    : "hover:text-ink"
                }`}
              >
                Oldest
              </Link>
            </div>
          </div>
        </div>

        {/* Quiet Inline Filter Summary */}
        {isFiltered && (
          <div className="flex items-center justify-between gap-3 py-1 text-xs font-mono text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="text-text-muted uppercase tracking-wider text-[10px]">Filtered:</span>
              {currentCategory !== "all" && (
                <span className="text-ink font-semibold">
                  {CATEGORY_LABELS[currentCategory] || currentCategory}
                </span>
              )}
              {currentQuery && (
                <span className="text-ink font-semibold">&ldquo;{currentQuery}&rdquo;</span>
              )}
              <span className="text-text-muted text-[11px]">
                ({total} {total === 1 ? "work" : "works"})
              </span>
            </div>

            <Link
              href="/gallery"
              className="text-accent hover:text-accent-hover font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Reset Archive</span>
              <span aria-hidden="true">↺</span>
            </Link>
          </div>
        )}
      </section>

      {/* ─── Living Index Artwork Experience ─── */}
      {artworks.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-border bg-surface p-12 sm:p-16 text-center space-y-4 max-w-xl mx-auto rounded-xs shadow-2xs">
          <div className="w-12 h-12 rounded-full border border-border bg-surface-muted flex items-center justify-center mx-auto text-text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-sans text-2xl sm:text-3xl text-ink">
              {isFiltered ? "No Matching Works Found" : "Exhibition in Preparation"}
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
              {isFiltered
                ? "No published pieces match your selected category or search keyword. Try adjusting your query or resetting filters."
                : "The artist archive is currently being assembled. New original artworks and studies will appear here shortly."}
            </p>
          </div>

          <div className="pt-2">
            {isFiltered ? (
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xs border border-ink bg-ink text-surface hover:bg-accent hover:border-accent transition-all shadow-xs gap-1.5"
              >
                <span>Reset All Filters</span>
                <span aria-hidden="true">↺</span>
              </Link>
            ) : (
              <Link
                href="/commission"
                className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xs bg-accent text-white hover:bg-accent-hover transition-all shadow-xs gap-1.5"
              >
                <span>Inquire About a Commission</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <LivingIndexGallery
          artworks={artworks}
          currentPage={currentPage}
          pageSize={pageSize}
          initialIndex={initialIndex}
        />
      )}

      {/* ─── Pagination Controls ─── */}
      {totalPages > 1 && (
        <nav
          aria-label="Gallery pagination navigation"
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-xs font-mono"
        >
          {/* Previous Link */}
          <Link
            href={`/gallery?page=${currentPage - 1}${
              currentCategory !== "all" ? `&category=${currentCategory}` : ""
            }${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}${
              currentSort !== "newest" ? `&sort=${currentSort}` : ""
            }`}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-4 py-2 border rounded-xs uppercase tracking-wider font-semibold transition-all ${
              currentPage <= 1
                ? "pointer-events-none opacity-30 text-text-muted border-border bg-transparent"
                : "text-ink border-border bg-surface hover:bg-surface-muted hover:border-border-strong cursor-pointer"
            }`}
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </Link>

          {/* Current Page Status */}
          <div className="text-center space-y-0.5">
            <span className="uppercase tracking-widest text-text-muted block text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-[10px] text-text-muted/70 block">
              Showing {startItem}–{endItem} of {total} Works
            </span>
          </div>

          {/* Next Link */}
          <Link
            href={`/gallery?page=${currentPage + 1}${
              currentCategory !== "all" ? `&category=${currentCategory}` : ""
            }${currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ""}${
              currentSort !== "newest" ? `&sort=${currentSort}` : ""
            }`}
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-4 py-2 border rounded-xs uppercase tracking-wider font-semibold transition-all ${
              currentPage >= totalPages
                ? "pointer-events-none opacity-30 text-text-muted border-border bg-transparent"
                : "text-ink border-border bg-surface hover:bg-surface-muted hover:border-border-strong cursor-pointer"
            }`}
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
