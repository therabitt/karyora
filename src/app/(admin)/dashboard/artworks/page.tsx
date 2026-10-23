import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getAdminArtworks } from "@/lib/data/artworks";
import { getStoragePublicUrl } from "@/lib/storage/urls";

interface AdminArtworksPageProps {
  searchParams?: Promise<{ filter?: string }>;
}

export default async function AdminArtworksPage({
  searchParams,
}: AdminArtworksPageProps) {
  const params = searchParams ? await searchParams : {};
  const currentFilter =
    params.filter === "published" || params.filter === "draft"
      ? params.filter
      : "all";

  const statusFilter =
    currentFilter === "all" ? undefined : (currentFilter as "draft" | "published");

  const artworks = await getAdminArtworks(statusFilter);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Artwork Studio"
        description="Catalog portfolio pieces, upload staged originals, and publish exhibition WebP derivatives."
        actions={
          <Link href="/dashboard/artworks/new">
            <Button variant="primary">Add Artwork</Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Link
          href="/dashboard/artworks"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentFilter === "all"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          All Works
        </Link>
        <Link
          href="/dashboard/artworks?filter=published"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentFilter === "published"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Published
        </Link>
        <Link
          href="/dashboard/artworks?filter=draft"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            currentFilter === "draft"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Drafts
        </Link>
      </div>

      {/* Artworks Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {artworks.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-text-muted">
                ✦
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg text-ink">No artworks found</p>
                <p className="text-xs text-text-muted">
                  {currentFilter === "all"
                    ? "Upload and catalog your first artwork to exhibit on the portfolio."
                    : `No artworks currently in ${currentFilter} status.`}
                </p>
              </div>
              <Link href="/dashboard/artworks/new">
                <Button variant="primary" size="sm">
                  Add New Artwork
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-4">Artwork</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Medium</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {artworks.map((art) => {
                  const imageUrl = getStoragePublicUrl(art.public_image_path);
                  const displayDate = art.published_at
                    ? new Date(art.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : new Date(art.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                  return (
                    <tr key={art.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imageUrl}
                                alt={art.alt_text}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-text-muted">✦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-ink">{art.title}</p>
                            <p className="text-xs text-text-muted font-mono">/{art.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-text-muted capitalize">
                        {art.category.replace("-", " ")}
                      </td>
                      <td className="p-4 text-text-muted capitalize">
                        {art.medium.replace("-", " ")}
                      </td>
                      <td className="p-4">
                        <Badge variant={art.status}>{art.status}</Badge>
                      </td>
                      <td className="p-4 text-xs">
                        {art.is_featured ? (
                          <span className="text-accent font-semibold">★ Featured</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-text-muted">{displayDate}</td>
                      <td className="p-4 text-right space-x-2">
                        {art.status === "published" && (
                          <Link href={`/artworks/${art.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/artworks/${art.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
