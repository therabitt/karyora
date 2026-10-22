import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function NewArtworkPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Add New Artwork"
        description="Upload a source image and specify exhibition metadata."
        actions={
          <Link href="/dashboard/artworks">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <form className="space-y-8">
        {/* Upload Box Shell */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-serif text-lg text-ink">Source Image</h2>
            <div className="border-2 border-dashed border-border-strong rounded-xl p-8 text-center space-y-3 bg-surface-muted/30">
              <div className="w-12 h-12 rounded-full bg-accent-soft mx-auto flex items-center justify-center text-accent text-xl">
                ↑
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Click to select or drag and drop an artwork file
                </p>
                <p className="text-xs text-text-muted mt-1">
                  JPEG, PNG, or WebP. Max 5 MiB (5,242,880 bytes). Orientation & dimensions verified server-side.
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
              />
              <Button variant="outline" size="sm" type="button">
                Select File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Shell */}
        <Card>
          <CardContent className="space-y-6">
            <h2 className="font-serif text-lg text-ink">Artwork Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Artwork Title *"
                id="title"
                placeholder="e.g. Whispering Pines"
                required
              />
              <Input
                label="Public URL Slug *"
                id="slug"
                placeholder="e.g. whispering-pines"
                helperText="Auto-generated from title or custom normalized slug"
                required
              />
            </div>

            <Input
              label="Accessibility Alt Text *"
              id="alt_text"
              placeholder="Detailed description of visual content for screen-reader users..."
              helperText="Required. Must describe image accurately (1–250 chars)."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-medium text-ink">
                  Category *
                </label>
                <select
                  id="category"
                  className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  <option value="original-character">Original Character</option>
                  <option value="fan-art">Fan Art</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="medium" className="block text-sm font-medium text-ink">
                  Medium *
                </label>
                <select
                  id="medium"
                  className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  <option value="digital-painting">Digital Painting</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="vector">Vector</option>
                  <option value="traditional">Traditional</option>
                  <option value="mixed-media">Mixed Media</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <Input
              label="Tags (Comma separated, max 20)"
              id="tags"
              placeholder="portrait, atmospheric, fantasy"
            />

            <Textarea
              label="Artwork Description (Optional)"
              id="description"
              rows={4}
              placeholder="Background story, creative process, or artist notes..."
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Link href="/dashboard/artworks">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button">
              Save as Draft
            </Button>
            <Button variant="primary" type="button">
              Publish Artwork
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
