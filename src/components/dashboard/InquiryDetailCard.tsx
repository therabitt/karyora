"use client";

import React, { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { updateInquiryStatusAction } from "@/app/actions/inquiry";
import { getPermittedStatusTransitions } from "@/types/domain";
import type { Database, InquiryStatus } from "@/types/database.types";

export type AdminInquiry = Database["public"]["Tables"]["commission_inquiries"]["Row"];

interface InquiryDetailCardProps {
  inquiry: AdminInquiry;
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

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New (Unreviewed)",
  reviewing: "In Review",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export function InquiryDetailCard({ inquiry }: InquiryDetailCardProps) {
  const [currentStatus, setCurrentStatus] = useState<InquiryStatus>(inquiry.status);
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.admin_notes || "");
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const permittedTransitions = getPermittedStatusTransitions(currentStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, {
        status: selectedStatus,
        admin_notes: notes.trim().length > 0 ? notes.trim() : null,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setCurrentStatus(selectedStatus);
        setSuccessMessage("Inquiry status and notes saved successfully.");
      }
    });
  };

  const formattedSubmittedAt = new Date(inquiry.submitted_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-accent-soft/30 border border-accent/30 text-sm text-accent flex items-start gap-3"
        >
          <span className="font-bold">Success:</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Immutable Client Submission Details (COM-013, COM-014) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Client Brief (Immutable)
                </span>
                <Badge variant={currentStatus}>{currentStatus}</Badge>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-text-muted">Client Name</dt>
                  <dd className="font-medium text-ink mt-0.5">{inquiry.client_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Client Email</dt>
                  <dd className="font-medium text-ink mt-0.5">
                    <a
                      href={`mailto:${inquiry.client_email}?subject=Regarding your commission inquiry: ${encodeURIComponent(inquiry.offering_title_snapshot)}`}
                      className="text-accent hover:underline"
                    >
                      {inquiry.client_email} ↗
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Offering Snapshot</dt>
                  <dd className="font-medium text-ink mt-0.5">
                    {inquiry.offering_title_snapshot}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Proposed Budget</dt>
                  <dd className="font-medium text-ink mt-0.5">
                    {formatPrice(inquiry.budget_amount, inquiry.budget_currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Desired Deadline</dt>
                  <dd className="font-medium text-ink mt-0.5">
                    {inquiry.desired_deadline
                      ? new Date(inquiry.desired_deadline).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Flexible / Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Intake Availability</dt>
                  <dd className="font-medium text-ink mt-0.5 capitalize">
                    {inquiry.availability_at_submission}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-text-muted">Submission Timestamp</dt>
                  <dd className="font-mono text-xs text-ink mt-0.5">
                    {formattedSubmittedAt}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold block">
                  Project Description & Specifications
                </span>
                <div className="bg-surface-muted p-4 rounded-xl text-sm text-ink-soft leading-relaxed whitespace-pre-line border border-border">
                  {inquiry.description}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflow Actions & Private Notes */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="space-y-6">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold block border-b border-border pb-4">
                  Workflow Management
                </span>

                <div className="space-y-2">
                  <label
                    htmlFor="inquiry_status"
                    className="block text-xs font-semibold text-ink uppercase tracking-wider"
                  >
                    Workflow Status *
                  </label>
                  <select
                    id="inquiry_status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as InquiryStatus)}
                    disabled={isPending}
                    className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                  >
                    {/* Always allow keeping current status */}
                    <option value={currentStatus}>
                      Current: {STATUS_LABELS[currentStatus]}
                    </option>

                    {/* Only list valid state transitions permitted by database trigger */}
                    {permittedTransitions.map((nextStatus) => (
                      <option key={nextStatus} value={nextStatus}>
                        → Transition to: {STATUS_LABELS[nextStatus]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text-muted">
                    Transitions are enforced by server-side lifecycle rules and database constraints.
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    label="Private Administrative Notes"
                    id="admin_notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Record quote calculations, agreed deadlines, client communication summaries, or scheduling notes..."
                    helperText="Strictly confidential. Never visible to visitors or clients."
                    disabled={isPending}
                  />
                </div>

                <div className="pt-2">
                  <Button variant="primary" fullWidth type="submit" disabled={isPending}>
                    {isPending ? "Saving Changes..." : "Save Status & Notes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Quick Direct Email Card */}
          <Card>
            <CardContent className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold block">
                Direct Communication
              </span>
              <p className="text-xs text-text-muted">
                Need to respond or request reference files from {inquiry.client_name}?
              </p>
              <a
                href={`mailto:${inquiry.client_email}?subject=Regarding your commission inquiry: ${encodeURIComponent(inquiry.offering_title_snapshot)}`}
                className="block"
              >
                <Button variant="outline" size="sm" fullWidth type="button">
                  Open Email Composer ↗
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
