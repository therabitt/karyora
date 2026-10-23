import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/auth/admin";
import { getDashboardStats, getRecentInquiries } from "@/lib/data/dashboard";

export default async function DashboardOverviewPage() {
  const adminContext = await requireAdmin();
  const [stats, recentInquiries] = await Promise.all([
    getDashboardStats(adminContext.adminUserId),
    getRecentInquiries(5),
  ]);

  const availability = stats.profile?.commission_availability || "open";

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Studio Overview"
        description="Monitor artwork publishing, new inquiries, and studio operations."
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/offerings/new">
              <Button variant="outline">New Offering</Button>
            </Link>
            <Link href="/dashboard/artworks/new">
              <Button variant="primary">New Artwork</Button>
            </Link>
          </div>
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
              <span className="font-serif text-3xl text-ink">{stats.totalArtworks}</span>
              <span className="text-xs text-text-muted">
                {stats.publishedArtworks} Published, {stats.draftArtworks} Drafts
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              New Inquiries
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl text-accent font-semibold">
                {stats.newInquiries}
              </span>
              {stats.newInquiries > 0 ? (
                <Badge variant="new">Action Required</Badge>
              ) : (
                <span className="text-xs text-text-muted">Inbox clear</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Commission Availability
            </span>
            <div className="pt-1">
              <Badge variant={availability}>
                {availability === "open"
                  ? "Commissions Open"
                  : availability === "waitlist"
                  ? "Waitlist Only"
                  : "Commissions Closed"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Storage Health
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-sm font-medium ${
                  stats.pendingCleanupCount === 0 ? "text-success" : "text-accent"
                }`}
              >
                {stats.pendingCleanupCount === 0 ? "Clean" : "Cleanup Pending"}
              </span>
              <span className="text-xs text-text-muted">
                {stats.pendingCleanupCount} queued items
              </span>
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
            {recentInquiries.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                No inquiries received yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentInquiries.map((inq) => (
                  <Link
                    key={inq.id}
                    href={`/dashboard/commissions/${inq.id}`}
                    className="p-4 flex items-center justify-between hover:bg-surface-muted/50 transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{inq.client_name}</p>
                      <p className="text-xs text-text-muted">
                        {inq.offering_title_snapshot} •{" "}
                        {new Date(inq.submitted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={inq.status}>
                      {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-serif text-xl text-ink">Active Offerings</h2>
            <Link
              href="/dashboard/offerings"
              className="text-xs text-accent hover:underline"
            >
              Manage Offerings →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Active Commission Offerings:</span>
              <span className="font-semibold text-ink">
                {stats.activeOfferings} of {stats.totalOfferings} Active
              </span>
            </div>
            <div className="p-4 bg-surface-muted rounded-xl space-y-2 border border-border">
              <p className="text-xs font-medium text-ink">Offering Visibility</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Active offerings appear on the public commission page with their baseline pricing and deliverables. Deactivated offerings remain preserved for inquiry history.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dashboard/offerings/new">
                <Button variant="outline" size="sm" fullWidth>
                  + Add New Offering
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
