import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <AdminHeader
        title="Studio Overview"
        description="Monitor artwork publishing, new inquiries, and studio operations."
        actions={
          <Link href="/dashboard/artworks/new">
            <Button variant="primary">New Artwork</Button>
          </Link>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Artworks
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl text-ink">12</span>
              <span className="text-xs text-text-muted">10 Published, 2 Drafts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              New Inquiries
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl text-accent font-semibold">3</span>
              <Badge variant="new">Action Required</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Commission Availability
            </span>
            <div className="pt-1">
              <Badge variant="open">Commissions Open</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Storage Health
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-success">Clean</span>
              <span className="text-xs text-text-muted">0 pending cleanup</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-serif text-xl text-ink">Recent Inquiries</h2>
            <Link
              href="/dashboard/commissions"
              className="text-xs text-accent hover:underline"
            >
              View Inbox →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { name: "Maya Lin", offering: "Character Portrait", status: "new" as const, time: "2 hours ago" },
                { name: "Julian Fox", offering: "Custom Illustration", status: "reviewing" as const, time: "Yesterday" },
                { name: "Sarah Connor", offering: "Half-Body Illustration", status: "accepted" as const, time: "3 days ago" },
              ].map((inq, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ink">{inq.name}</p>
                    <p className="text-xs text-text-muted">{inq.offering} • {inq.time}</p>
                  </div>
                  <Badge variant={inq.status}>
                    {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-serif text-xl text-ink">Recent Artworks</h2>
            <Link
              href="/dashboard/artworks"
              className="text-xs text-accent hover:underline"
            >
              Manage Artworks →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { title: "Solitude in Crimson", category: "Original Character", status: "published" as const },
                { title: "Whispering Pines", category: "Landscape", status: "published" as const },
                { title: "Study in Charcoal 04", category: "Portrait", status: "draft" as const },
              ].map((art, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ink">{art.title}</p>
                    <p className="text-xs text-text-muted">{art.category}</p>
                  </div>
                  <Badge variant={art.status}>
                    {art.status.charAt(0).toUpperCase() + art.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
