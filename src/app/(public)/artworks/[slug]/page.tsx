import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getPublishedArtworkBySlug } from "@/lib/data/artworks";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import type { Metadata } from "next";

interface ArtworkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug);

  if (!artwork) {
    return {
      title: "Artwork Not Found",
      description: "The requested artwork could not be found or is not currently published.",
    };
  }

  return {
    title: `${artwork.title} — Karyora Portfolio`,
    description: artwork.description || artwork.alt_text,
    openGraph: {
      title: artwork.title,
      description: artwork.description || artwork.alt_text,
      type: "article",
    },
  };
}

export default async function ArtworkDetailPage({
  params,
}: ArtworkDetailPageProps) {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug);

  if (!artwork) {
    notFound();
  }

  const imageUrl = getStoragePublicUrl(artwork.public_image_path);
  const formattedDate = artwork.published_at
    ? new Date(artwork.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full space-y-12">
      <nav aria-label="Breadcrumb">
        <Link
          href="/gallery"
          className="text-xs text-text-muted hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Gallery</span>
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Artwork Exhibition Display */}
        <div className="lg:col-span-8 bg-surface-muted rounded-2xl border border-border p-4 sm:p-8 flex items-center justify-center min-h-[480px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={artwork.alt_text}
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl shadow-sm"
              loading="eager"
            />
          ) : (
            <div className="text-center space-y-3 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface border border-border flex items-center justify-center text-accent font-serif text-2xl">
                ✦
              </div>
              <h2 className="font-serif text-2xl text-ink">{artwork.title}</h2>
              <p className="text-xs text-text-muted italic leading-relaxed">
                &ldquo;{artwork.alt_text}&rdquo;
              </p>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-mono">
                WebP Exhibition Derivative
              </p>
            </div>
          )}
        </div>

        {/* Artwork Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-3 border-b border-border pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="published">Published</Badge>
              <span className="text-xs text-text-muted capitalize">
                {artwork.category.replace("-", " ")}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal leading-tight">
              {artwork.title}
            </h1>
            {formattedDate && (
              <p className="text-xs text-text-muted">Published on {formattedDate}</p>
            )}
          </div>

          {artwork.description && (
            <div className="space-y-3 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                About This Work
              </h2>
              <p className="whitespace-pre-line">{artwork.description}</p>
            </div>
          )}

          <div className="space-y-3 text-sm text-ink-soft leading-relaxed border-t border-border pt-6">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Visual Context
            </h2>
            <p className="text-xs text-text-muted italic">{artwork.alt_text}</p>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Artwork Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-text-muted">Medium</dt>
              <dd className="text-ink font-medium capitalize">
                {artwork.medium.replace("-", " ")}
              </dd>
              <dt className="text-text-muted">Category</dt>
              <dd className="text-ink font-medium capitalize">
                {artwork.category.replace("-", " ")}
              </dd>
              {artwork.tags && artwork.tags.length > 0 && (
                <>
                  <dt className="text-text-muted">Tags</dt>
                  <dd className="text-ink font-medium">
                    <div className="flex flex-wrap gap-1">
                      {artwork.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px] bg-surface-muted text-ink-soft border border-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </>
              )}
            </dl>
          </div>

          <div className="pt-4 border-t border-border">
            <Link href="/commission" className="block">
              <Button variant="outline" fullWidth>
                Request Commission Inquiry
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
