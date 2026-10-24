import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
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
        description="Monitor artwork publishing, incoming commission inquiries, and storage health."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/offerings/new"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-colors"
            >
              + New Offering
            </Link>
            <Link
              href="/dashboard/artworks/new"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-sm bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
            >
              + New Artwork
            </Link>
          </div>
        }
      />

      {/* Overview Metric Cards with Top Border Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Artworks */}
        <div className="bg-surface border border-border border-t-2 border-t-ink/60 p-6 space-y-2 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-text-muted block">
            Total Artworks
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl text-ink">{stats.totalArtworks}</span>
            <span className="text-xs font-mono text-text-muted">
              ({stats.publishedArtworks} Pub / {stats.draftArtworks} Draft)
            </span>
          </div>
        </div>

        {/* Inquiries */}
        <div className="bg-surface border border-border border-t-2 border-t-accent p-6 space-y-2 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-accent block">
            New Inquiries
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl text-accent font-semibold">
              {stats.newInquiries}
            </span>
            {stats.newInquiries > 0 ? (
              <Badge variant="new">Action Required</Badge>
            ) : (
              <span className="text-xs font-mono text-text-muted">Inbox Clear</span>
            )}
          </div>
        </div>

        {/* Commission Status */}
        <div className="bg-surface border border-border border-t-2 border-t-sage p-6 space-y-2 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-sage block">
            Commission Intake
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
        </div>

        {/* Storage Health */}
        <div className="bg-surface border border-border border-t-2 border-t-info p-6 space-y-2 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-info block">
            Storage Engine
          </span>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-sm font-mono font-semibold ${
                stats.pendingCleanupCount === 0 ? "text-success" : "text-accent"
              }`}
            >
              {stats.pendingCleanupCount === 0 ? "Healthy / Clean" : "Cleanup Pending"}
            </span>
            <span className="text-xs font-mono text-text-muted">
              {stats.pendingCleanupCount} queued
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries List */}
        <div className="bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent font-semibold block">
                  Incoming Communications
                </span>
                <h2 className="font-serif text-xl text-ink">Recent Inquiries</h2>
              </div>
              <Link
                href="/dashboard/commissions"
                className="text-xs font-mono uppercase tracking-wider text-accent hover:underline"
              >
                View Inbox →
              </Link>
            </div>

            {recentInquiries.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-text-muted">
                No inquiries received yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentInquiries.map((inq) => {
                  const initial = inq.client_name.charAt(0).toUpperCase();

                  return (
                    <Link
                      key={inq.id}
                      href={`/dashboard/commissions/${inq.id}`}
                      className="p-4 flex items-center justify-between hover:bg-surface-muted/60 transition-colors block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-ink">{inq.client_name}</p>
                            {inq.admin_notes && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/10 text-accent font-semibold">
                                Note
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted font-mono">
                            {inq.offering_title_snapshot} •{" "}
                            {new Date(inq.submitted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {inq.admin_notes && (
                            <p className="text-[11px] text-text-muted italic line-clamp-1 mt-0.5 max-w-xs">
                              &ldquo;{inq.admin_notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={inq.status}>
                        {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Offerings Summary */}
        <div className="bg-surface border border-border p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent font-semibold block">
                  Catalog Status
                </span>
                <h2 className="font-serif text-xl text-ink">Active Offerings</h2>
              </div>
              <Link
                href="/dashboard/offerings"
                className="text-xs font-mono uppercase tracking-wider text-accent hover:underline"
              >
                Manage Offerings →
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Published Offerings:</span>
              <span className="font-semibold text-ink">
                {stats.activeOfferings} of {stats.totalOfferings} Active
              </span>
            </div>

            <div className="p-4 bg-surface-muted border border-border text-xs text-text-muted leading-relaxed space-y-1">
              <p className="font-semibold text-ink uppercase tracking-wider text-[10px]">
                Catalog Visibility Rule
              </p>
              <p>
                Active offerings appear directly on the public commission page with baseline pricing and turnaround details. Deactivated offerings remain preserved for past inquiry audits.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/offerings/new"
              className="inline-flex items-center justify-center w-full text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-colors"
            >
              + Add New Offering
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}