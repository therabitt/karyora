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

      {/* Status Filter Segmented Navigation (COM-006 MUST) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-muted/60 rounded-xl border border-border w-fit">
        <Link
          href="/dashboard/commissions"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !selectedStatus
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : "text-text-muted hover:text-ink"
          }`}
        >
          All ({counts.all})
        </Link>

        <Link
          href="/dashboard/commissions?status=new"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
            selectedStatus === "new"
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : counts.new > 0
              ? "text-accent font-bold"
              : "text-text-muted hover:text-ink"
          }`}
        >
          <span>New</span>
          {counts.new > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center font-bold ${
                selectedStatus === "new"
                  ? "bg-accent text-white"
                  : "bg-accent text-white"
              }`}
            >
              {counts.new}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/commissions?status=reviewing"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === "reviewing"
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : "text-text-muted hover:text-ink"
          }`}
        >
          Reviewing ({counts.reviewing})
        </Link>

        <Link
          href="/dashboard/commissions?status=accepted"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === "accepted"
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : "text-text-muted hover:text-ink"
          }`}
        >
          Accepted ({counts.accepted})
        </Link>

        <Link
          href="/dashboard/commissions?status=declined"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === "declined"
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : "text-text-muted hover:text-ink"
          }`}
        >
          Declined ({counts.declined})
        </Link>

        <Link
          href="/dashboard/commissions?status=completed"
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === "completed"
              ? "bg-surface text-ink font-semibold shadow-xs border border-border"
              : "text-text-muted hover:text-ink"
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
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-surface-muted/70 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="py-3.5 px-5">Client</th>
                  <th className="py-3.5 px-4">Offering</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Private Note</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
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
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent-soft/80 border border-accent/20 flex items-center justify-center text-xs font-serif font-bold text-accent shrink-0 shadow-xs">
                            {inq.client_name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{inq.client_name}</p>
                            <p className="text-xs text-text-muted truncate">{inq.client_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-ink leading-tight">
                          {inq.offering_title_snapshot}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-muted border border-border">
                          Mode: {inq.availability_at_submission}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-ink">
                        <span className="bg-surface-muted/60 px-2.5 py-1 rounded-md border border-border/60 font-medium">
                          {formatPrice(inq.budget_amount, inq.budget_currency)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={inq.status}>{inq.status}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        {inq.admin_notes ? (
                          <div
                            title={inq.admin_notes}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/8 border border-accent/20 text-accent text-xs font-medium max-w-[200px]"
                          >
                            <span className="text-[11px] shrink-0">📝</span>
                            <span className="italic truncate">&ldquo;{inq.admin_notes}&rdquo;</span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted/40 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-muted whitespace-nowrap">
                        {displayDate}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Link href={`/dashboard/commissions/${inq.id}`}>
                          <Button variant="outline" size="sm" className="hover:border-ink hover:text-ink">
                            Manage →
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
