import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminArtworksPage() {
  return (
    <div className="space-y-8">
      <AdminHeader
        title="Artwork Studio"
        description="Manage portfolio pieces, upload new originals, and publish WebP derivatives."
        actions={
          <Link href="/dashboard/artworks/new">
            <Button variant="primary">Add Artwork</Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-ink text-surface"
        >
          All Works (3)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Published (2)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Drafts (1)
        </button>
      </div>

      {/* Artworks Table / List Shell */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="p-4">Artwork</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  id: "art-1",
                  title: "Solitude in Crimson",
                  slug: "solitude-in-crimson",
                  category: "Original Character",
                  status: "published" as const,
                  date: "Oct 15, 2026",
                },
                {
                  id: "art-2",
                  title: "Whispering Pines",
                  slug: "whispering-pines",
                  category: "Landscape",
                  status: "published" as const,
                  date: "Oct 10, 2026",
                },
                {
                  id: "art-3",
                  title: "Study in Charcoal 04",
                  slug: "study-in-charcoal-04",
                  category: "Portrait",
                  status: "draft" as const,
                  date: "Oct 20, 2026",
                },
              ].map((art) => (
                <tr key={art.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-ink">{art.title}</p>
                    <p className="text-xs text-text-muted font-mono">/{art.slug}</p>
                  </td>
                  <td className="p-4 text-text-muted">{art.category}</td>
                  <td className="p-4">
                    <Badge variant={art.status}>
                      {art.status.charAt(0).toUpperCase() + art.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs text-text-muted">{art.date}</td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/dashboard/artworks/${art.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
