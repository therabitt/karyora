import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { ArtworkNewForm } from "@/components/dashboard/ArtworkNewForm";

export default function NewArtworkPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Add New Artwork"
        description="Upload a source image directly to private storage and specify exhibition metadata."
        actions={
          <Link href="/dashboard/artworks">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <ArtworkNewForm />
    </div>
  );
}
