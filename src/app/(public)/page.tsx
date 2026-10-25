import { AlanMenkenShowcase } from "@/components/gallery/AlanMenkenShowcase";
import { getPublicProfile } from "@/lib/data/profile";
import { getFeaturedPublishedArtworks, getPublishedArtworks } from "@/lib/data/artworks";

interface HomePageProps {
  searchParams?: Promise<{
    item?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialIndex = params?.item ? Math.max(0, Number(params.item) - 1) : 0;
  const profile = await getPublicProfile();
  // Fetch up to 9 featured published artworks for the full Alan Menken ribbon stage
  const featuredArtworks = await getFeaturedPublishedArtworks(9);
  // Fetch exact count of published artworks in the archive
  const { total: totalArtworksCount } = await getPublishedArtworks({ pageSize: 1 });

  return (
    <AlanMenkenShowcase
      artworks={featuredArtworks}
      totalCount={totalArtworksCount}
      initialIndex={initialIndex}
      profile={profile}
    />
  );
}
