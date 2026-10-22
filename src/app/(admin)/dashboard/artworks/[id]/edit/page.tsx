import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface EditArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArtworkPage({
  params,
}: EditArtworkPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Edit Artwork"
        description={`Modify metadata or replace image for artwork ID: ${id}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/artworks">
              <Button variant="ghost">Back</Button>
            </Link>
            <Button variant="danger" size="md">
              Delete Artwork
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 p-4 bg-surface rounded-xl border border-border">
        <span className="text-xs text-text-muted font-medium">Current Status:</span>
        <Badge variant="published">Published</Badge>
        <span className="text-xs text-text-muted ml-auto font-mono">ID: {id}</span>
      </div>

      <form className="space-y-8">
        <Card>
          <CardContent className="space-y-6">
            <h2 className="font-serif text-lg text-ink">Metadata & Exhibition Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Artwork Title *"
                id="title"
                defaultValue="Solitude in Crimson"
                required
              />
              <Input
                label="Public Slug *"
                id="slug"
                defaultValue="solitude-in-crimson"
                required
              />
            </div>

            <Input
              label="Alt Text *"
              id="alt_text"
              defaultValue="A crimson-robed wanderer standing amidst fallen autumn leaves at twilight."
              required
            />

            <Textarea
              label="Description"
              id="description"
              rows={4}
              defaultValue="Original character illustration completed during October 2026."
            />
          </CardContent>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button variant="outline" type="button">
            Unpublish Artwork
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="primary" type="button">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
