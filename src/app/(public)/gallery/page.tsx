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

function EmptySalonWall() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-paper px-6 py-16 text-ink">
      <div className="w-full max-w-xl border-y border-border py-10 text-center sm:py-14">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-hover">
          The Salon Wall
        </p>
        <h1 className="mt-4 font-artwork-title text-4xl leading-tight sm:text-5xl">
          The wall is quiet.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-text-muted sm:text-base">
          There are no published artworks to exhibit yet. Check back when the
          next work has been hung.
        </p>
      </div>
    </main>
  );
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const itemNumber = Number(params.item);
  const initialIndex =
    Number.isFinite(itemNumber) && itemNumber > 0
      ? Math.floor(itemNumber) - 1
      : null;

  const artworks = await getAllPublishedArtworks();

  if (artworks.length === 0) {
    return <EmptySalonWall />;
  }

  return (
    <SalonCameraRoom artworks={artworks} initialIndex={initialIndex} />
  );
}
