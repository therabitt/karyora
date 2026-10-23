import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getAdminInquiries } from "@/lib/data/inquiries";
import type { InquiryStatus } from "@/types/database.types";

interface AdminCommissionsPageProps {
  searchParams?: Promise<{ status?: string }>;
}

function formatPrice(amount: number | null, currency: string = "IDR"): string {
  if (amount === null || amount === undefined) {
    return "Not Specified";
  }
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

const VALID_STATUSES: InquiryStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "declined",
  "completed",
];

export default async function AdminCommissionsPage({
  searchParams,
}: AdminCommissionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const currentStatusParam = params.status?.toLowerCase();

  const selectedStatus: InquiryStatus | undefined = VALID_STATUSES.includes(
    currentStatusParam as InquiryStatus
  )
    ? (currentStatusParam as InquiryStatus)
    : undefined;

  const { inquiries, counts } = await getAdminInquiries(selectedStatus);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Commission Inquiries"
        description="Review prospective client briefs, manage workflow transitions, and track private notes."
      />

      {/* Status Filter Tabs (COM-006 MUST) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <Link
          href="/dashboard/commissions"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !selectedStatus
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          All ({counts.all})
        </Link>

        <Link
          href="/dashboard/commissions?status=new"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
            selectedStatus === "new"
              ? "bg-ink text-surface"
              : counts.new > 0
              ? "text-accent bg-accent-soft/30 hover:bg-accent-soft/50 font-bold"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          <span>New</span>
          {counts.new > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center font-bold ${
                selectedStatus === "new"
                  ? "bg-surface text-ink"
                  : "bg-accent text-white"
              }`}
            >
              {counts.new}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/commissions?status=reviewing"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedStatus === "reviewing"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Reviewing ({counts.reviewing})
        </Link>

        <Link
          href="/dashboard/commissions?status=accepted"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedStatus === "accepted"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Accepted ({counts.accepted})
        </Link>

        <Link
          href="/dashboard/commissions?status=declined"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedStatus === "declined"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Declined ({counts.declined})
        </Link>

        <Link
          href="/dashboard/commissions?status=completed"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedStatus === "completed"
              ? "bg-ink text-surface"
              : "text-text-muted hover:bg-surface-muted"
          }`}
        >
          Completed ({counts.completed})
        </Link>
      </div>

      {/* Inquiries Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-text-muted text-lg">
                ✦
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg text-ink">No inquiries found</p>
                <p className="text-xs text-text-muted">
                  {selectedStatus
                    ? `No commission inquiries currently marked as "${selectedStatus}".`
                    : "No client inquiries received yet."}
                </p>
              </div>
              {selectedStatus && (
                <Link href="/dashboard/commissions">
                  <Button variant="outline" size="sm">
                    View All Inquiries
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[700px]">
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
                {inquiries.map((inq) => {
                  const displayDate = new Date(inq.submitted_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  );

                  return (
                    <tr
                      key={inq.id}
                      className="hover:bg-surface-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-medium text-ink">{inq.client_name}</p>
                        <p className="text-xs text-text-muted">{inq.client_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-ink">
                          {inq.offering_title_snapshot}
                        </p>
                        <span className="text-[11px] text-text-muted capitalize">
                          Mode: {inq.availability_at_submission}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-ink font-medium">
                        {formatPrice(inq.budget_amount, inq.budget_currency)}
                      </td>
                      <td className="p-4 text-xs text-text-muted">{displayDate}</td>
                      <td className="p-4">
                        <Badge variant={inq.status}>{inq.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/dashboard/commissions/${inq.id}`}>
                          <Button variant="ghost" size="sm">
                            View & Manage →
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
