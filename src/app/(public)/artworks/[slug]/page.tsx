import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 w-full space-y-10">
      {/* Editorial Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4 text-xs font-mono uppercase tracking-wider">
        <Link
          href="/gallery"
          className="text-text-muted hover:text-accent transition-colors inline-flex items-center gap-2"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Gallery</span>
        </Link>
        <span className="text-text-muted hidden sm:inline-block">
          Catalog Entry · {artwork.slug}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Main Artwork Exhibition Display */}
        <div className="lg:col-span-8 bg-surface border border-border p-4 sm:p-10 flex items-center justify-center min-h-[480px] shadow-xs">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={artwork.alt_text}
              className="w-full h-auto max-h-[80vh] object-contain shadow-sm"
              loading="eager"
            />
          ) : (
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft text-accent flex items-center justify-center font-serif text-2xl">
                ✦
              </div>
              <h2 className="font-serif text-2xl text-ink">{artwork.title}</h2>
              <p className="text-xs text-text-muted italic leading-relaxed">
                &ldquo;{artwork.alt_text}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Artwork Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <Badge variant="published">Published</Badge>
              <span className="text-[10px] uppercase font-mono tracking-widest text-text-muted">
                {artwork.category.replace("-", " ")}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink font-normal leading-tight">
              {artwork.title}
            </h1>
            {formattedDate && (
              <p className="text-xs font-mono text-text-muted">Cataloged on {formattedDate}</p>
            )}
          </div>

          {artwork.description && (
            <div className="space-y-2 text-sm text-ink-soft leading-relaxed">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
                Curatorial Note
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed">{artwork.description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm text-ink-soft leading-relaxed border-t border-border pt-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
              Visual Narrative
            </h2>
            <p className="text-xs text-text-muted italic leading-relaxed">{artwork.alt_text}</p>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
              Specifications Sheet
            </h2>
            <dl className="divide-y divide-border/60 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-text-muted">Medium</dt>
                <dd className="text-ink font-medium capitalize">
                  {artwork.medium.replace("-", " ")}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-text-muted">Category</dt>
                <dd className="text-ink font-medium capitalize">
                  {artwork.category.replace("-", " ")}
                </dd>
              </div>
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="py-2 space-y-1.5">
                  <dt className="text-text-muted">Tags</dt>
                  <dd className="text-ink font-medium">
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {artwork.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-mono bg-surface-muted text-ink-soft border border-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="pt-2 border-t border-border">
            <Link
              href="/commission"
              className="inline-flex items-center justify-center w-full text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-sm bg-accent text-white hover:bg-accent-hover transition-all shadow-xs gap-2"
            >
              <span>Inquire for Similar Commission</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}