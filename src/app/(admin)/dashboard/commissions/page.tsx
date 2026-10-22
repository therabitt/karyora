import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminCommissionsPage() {
  return (
    <div className="space-y-8">
      <AdminHeader
        title="Commission Inquiries"
        description="Review prospective client briefs, manage workflow transitions, and track private notes."
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-ink text-surface"
        >
          All (4)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent-soft/50 inline-flex items-center gap-1.5"
        >
          <span>New</span>
          <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] inline-flex items-center justify-center font-bold">
            2
          </span>
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Reviewing (1)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Accepted (1)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Declined (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-muted"
        >
          Completed (0)
        </button>
      </div>

      {/* Inquiries Table Shell */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Offering</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  id: "inq-1",
                  name: "Maya Lin",
                  email: "maya@example.com",
                  offering: "Character Portrait / Bust",
                  budget: "IDR 600,000",
                  submitted: "2 hours ago",
                  status: "new" as const,
                },
                {
                  id: "inq-2",
                  name: "Julian Fox",
                  email: "julian@example.com",
                  offering: "Full Illustration & Environment",
                  budget: "IDR 1,800,000",
                  submitted: "Yesterday",
                  status: "reviewing" as const,
                },
                {
                  id: "inq-3",
                  name: "Sarah Connor",
                  email: "sarah@example.com",
                  offering: "Half-Body Illustration",
                  budget: "IDR 900,000",
                  submitted: "3 days ago",
                  status: "accepted" as const,
                },
                {
                  id: "inq-4",
                  name: "Alex Vance",
                  email: "alex@example.com",
                  offering: "Custom request",
                  budget: "IDR 1,200,000",
                  submitted: "5 days ago",
                  status: "new" as const,
                },
              ].map((inq) => (
                <tr key={inq.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-ink">{inq.name}</p>
                    <p className="text-xs text-text-muted">{inq.email}</p>
                  </td>
                  <td className="p-4 text-text-muted">{inq.offering}</td>
                  <td className="p-4 font-mono text-xs">{inq.budget}</td>
                  <td className="p-4 text-xs text-text-muted">{inq.submitted}</td>
                  <td className="p-4">
                    <Badge variant={inq.status}>
                      {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/commissions/${inq.id}`}>
                      <Button variant="outline" size="sm">
                        View Brief
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
