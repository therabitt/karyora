import type { Metadata } from "next";
import { SalonCameraRoom } from "@/components/gallery/SalonCameraRoom";
import { getAllPublishedArtworks } from "@/lib/data/artworks";

export const metadata: Metadata = {
  title: "The Salon Wall — Curated Artwork Archive",
  description:
    "Step up to the salon wall: a continuous hang of original character art, fan art, portraits, and landscape studies by Karyora.",
};

interface GalleryPageProps {
  searchParams: Promise<{
    item?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const itemNumber = Number(params.item);
  const initialIndex =
    Number.isFinite(itemNumber) && itemNumber > 0
      ? Math.floor(itemNumber) - 1
      : null;

  const artworks = await getAllPublishedArtworks();

  return (
    <SalonCameraRoom artworks={artworks} initialIndex={initialIndex} />
  );
}
