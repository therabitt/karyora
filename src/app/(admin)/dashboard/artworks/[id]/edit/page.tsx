import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { ArtworkEditForm } from "@/components/dashboard/ArtworkEditForm";
import { getAdminArtworkById } from "@/lib/data/artworks";

interface EditArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArtworkPage({
  params,
}: EditArtworkPageProps) {
  const { id } = await params;
  const artwork = await getAdminArtworkById(id);

  if (!artwork) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title={`Edit Artwork: ${artwork.title}`}
        description={`Update exhibition metadata or replace source image for slug: ${artwork.slug}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/artworks">
              <Button variant="ghost">Back to Artworks</Button>
            </Link>
            {artwork.status === "published" && (
              <Link href={`/artworks/${artwork.slug}`} target="_blank">
                <Button variant="outline">View Live ↗</Button>
              </Link>
            )}
          </div>
        }
      />

      <ArtworkEditForm artwork={artwork} />
    </div>
  );
}
