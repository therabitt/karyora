import { Card, CardContent } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse the curated portfolio of digital paintings, character illustrations, and traditional studies.",
};

const categories = ["All Works", "Original Character", "Fan Art", "Portrait", "Landscape", "Other"];

export default function GalleryPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full space-y-10">
      {/* Header */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">Artwork Gallery</h1>
        <p className="text-base text-text-muted leading-relaxed">
          Explore finished illustrations, character art, and conceptual works. Each piece represents a deliberate exploration of form, lighting, and narrative.
        </p>
      </div>

      {/* Filter Bar (Visual Placeholder for Phase 1) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-6">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              idx === 0
                ? "bg-ink text-surface"
                : "bg-surface text-ink-soft hover:bg-surface-muted border border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Artwork Grid Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item} className="overflow-hidden group hover:border-border-strong transition-all">
            <div className="aspect-4/3 bg-surface-muted flex items-center justify-center text-text-muted text-sm">
              Artwork Preview #{item}
            </div>
            <CardContent className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Original Character</span>
                <span>WebP</span>
              </div>
              <h2 className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                Portfolio Piece #{item}
              </h2>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
