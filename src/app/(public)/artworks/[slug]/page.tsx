import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

interface ArtworkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Artwork — ${slug}`,
    description: "Detailed exhibition view and artwork metadata.",
  };
}

export default async function ArtworkDetailPage({
  params,
}: ArtworkDetailPageProps) {
  const { slug } = await params;

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
          <div className="text-center space-y-2 text-text-muted">
            <p className="font-serif text-2xl text-ink">Artwork Preview Frame</p>
            <p className="text-xs">Slug: {slug}</p>
            <p className="text-xs opacity-75">
              High-resolution, metadata-stripped WebP exhibition derivative
            </p>
          </div>
        </div>

        {/* Artwork Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-3 border-b border-border pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="published">Published</Badge>
              <span className="text-xs text-text-muted">Digital Painting</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal">
              Artwork Title
            </h1>
            <p className="text-xs text-text-muted">Completed in 2026</p>
          </div>

          <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              About This Work
            </h2>
            <p>
              This is a placeholder description for the selected artwork. When connected to the persistent database, this section will render the artist&apos;s description, thematic context, and notes on technique.
            </p>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Artwork Details
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-text-muted">Medium</dt>
              <dd className="text-ink font-medium">Digital Painting</dd>
              <dt className="text-text-muted">Category</dt>
              <dd className="text-ink font-medium">Original Character</dd>
              <dt className="text-text-muted">Tags</dt>
              <dd className="text-ink font-medium">portrait, fantasy</dd>
            </dl>
          </div>

          <div className="pt-4">
            <Link href="/commission" className="block">
              <Button variant="outline" fullWidth>
                Request Similar Commission
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
