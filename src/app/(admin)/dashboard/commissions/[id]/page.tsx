import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

interface InquiryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({
  params,
}: InquiryDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Inquiry Detail"
        description={`Review client submission and update workflow status for inquiry ID: ${id}`}
        actions={
          <Link href="/dashboard/commissions">
            <Button variant="ghost">Back to Inbox</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Immutable Client Brief */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Client Submission (Immutable)
                </span>
                <Badge variant="new">New Inquiry</Badge>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-text-muted">Client Name</dt>
                  <dd className="font-medium text-ink mt-0.5">Maya Lin</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Client Email</dt>
                  <dd className="font-medium text-ink mt-0.5">maya@example.com</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Offering Snapshot</dt>
                  <dd className="font-medium text-ink mt-0.5">Character Portrait / Bust</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Budget</dt>
                  <dd className="font-medium text-ink mt-0.5">IDR 600,000</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Desired Deadline</dt>
                  <dd className="font-medium text-ink mt-0.5">November 15, 2026</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Submitted At</dt>
                  <dd className="font-medium text-ink mt-0.5">October 22, 2026 10:30 UTC</dd>
                </div>
              </dl>

              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Project Brief
                </span>
                <p className="text-sm text-ink-soft bg-surface-muted p-4 rounded-xl leading-relaxed">
                  I would like a digital portrait of an original elven sorceress character with silver hair, dark robes with gold embroidery, and subtle magical particle effects around her hands. Composition should be bust/shoulder level. References can be provided via email.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Administrative Actions & Private Notes */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold block border-b border-border pb-4">
                Workflow Actions
              </span>

              <div className="space-y-2">
                <label
                  htmlFor="inquiry_status"
                  className="block text-xs font-semibold text-ink uppercase tracking-wider"
                >
                  Change Status
                </label>
                <select
                  id="inquiry_status"
                  defaultValue="new"
                  className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  <option value="new">New (Unreviewed)</option>
                  <option value="reviewing">Move to Reviewing</option>
                  <option value="accepted">Accept Inquiry</option>
                  <option value="declined">Decline Inquiry</option>
                  <option value="completed">Mark Completed</option>
                </select>
                <p className="text-[11px] text-text-muted">
                  Transitions are verified against valid state invariants on the server.
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <Textarea
                  label="Private Administrative Notes"
                  id="admin_notes"
                  rows={4}
                  placeholder="Record private considerations, agreed terms, email exchange summaries..."
                  helperText="Never visible to public visitors or clients."
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" fullWidth type="button">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
