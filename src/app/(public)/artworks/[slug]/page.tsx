import { notFound } from "next/navigation";
import { getPublishedArtworkBySlug, getAllPublishedArtworks } from "@/lib/data/artworks";
import { KernArtworkDetail } from "@/components/artwork/KernArtworkDetail";
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
    title: `${artwork.title} — Karyora Exhibition Monograph`,
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
  const [artwork, allArtworks] = await Promise.all([
    getPublishedArtworkBySlug(slug),
    getAllPublishedArtworks(),
  ]);

  if (!artwork) {
    notFound();
  }

  return (
    <KernArtworkDetail
      initialArtwork={artwork}
      allArtworks={allArtworks}
    />
  );
}
