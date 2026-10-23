"use client";

import React, { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  updateOfferingAction,
  toggleOfferingActiveAction,
  deleteOfferingAction,
  type OfferingActionResult,
} from "@/app/actions/offering";
import type { AdminOffering } from "@/lib/data/offerings";

interface OfferingEditFormProps {
  offering: AdminOffering;
}

export function OfferingEditForm({ offering }: OfferingEditFormProps) {
  const updateActionWithId = updateOfferingAction.bind(null, offering.id);
  const [state, formAction, isPending] = useActionState<OfferingActionResult | null, FormData>(
    updateActionWithId,
    null
  );

  const [isDeleting, startDeleteTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleActive = () => {
    startToggleTransition(async () => {
      const res = await toggleOfferingActiveAction(offering.id, !offering.is_active);
      if (res?.error) {
        setDeleteError(res.error);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deleteOfferingAction(offering.id);
      if (res?.error) {
        setDeleteError(res.error);
        setShowDeleteConfirm(false);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Notifications / Errors */}
      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-accent-soft/30 border border-accent/30 text-sm text-accent flex items-start gap-3"
        >
          <span className="font-bold">Success:</span>
          <span>Offering updated successfully.</span>
        </div>
      )}

      {deleteError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{deleteError}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form action={formAction} className="space-y-8">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-lg text-ink">Offering Details</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  ID: <span className="font-mono">{offering.id}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={offering.is_active ? "open" : "closed"}>
                  {offering.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleActive}
                  disabled={isToggling || isPending}
                >
                  {isToggling
                    ? "Updating..."
                    : offering.is_active
                    ? "Deactivate"
                    : "Activate"}
                </Button>
              </div>
            </div>

            <Input
              label="Offering Title *"
              id="title"
              name="title"
              defaultValue={offering.title}
              placeholder="e.g. Character Portrait / Bust"
              error={state?.fieldErrors?.title?.[0]}
              disabled={isPending}
              required
            />

            <Input
              label="URL Slug *"
              id="slug"
              name="slug"
              defaultValue={offering.slug}
              placeholder="character-portrait-bust"
              helperText="Lowercase alphanumeric characters and hyphens only."
              error={state?.fieldErrors?.slug?.[0]}
              disabled={isPending}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Starting Price (Optional)"
                id="price_from"
                name="price_from"
                type="number"
                defaultValue={offering.price_from ?? ""}
                placeholder="e.g. 500000"
                helperText="Baseline price displayed to visitors."
                error={state?.fieldErrors?.price_from?.[0]}
                disabled={isPending}
              />
              <Input
                label="Currency Code"
                id="price_currency"
                name="price_currency"
                defaultValue={offering.price_currency}
                maxLength={3}
                helperText="3-letter ISO code (e.g. IDR, USD)."
                error={state?.fieldErrors?.price_currency?.[0]}
                disabled={isPending}
              />
            </div>

            <Textarea
              label="Description *"
              id="description"
              name="description"
              rows={4}
              defaultValue={offering.description}
              placeholder="Describe what is included, deliverables, canvas dimensions, resolution, and turnaround guidance..."
              helperText="Maximum 2,000 characters."
              error={state?.fieldErrors?.description?.[0]}
              disabled={isPending}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <Input
                label="Display Order"
                id="display_order"
                name="display_order"
                type="number"
                defaultValue={offering.display_order}
                helperText="Lower numbers appear first on the public commission page."
                error={state?.fieldErrors?.display_order?.[0]}
                disabled={isPending}
              />

              <div className="pt-7">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    value="true"
                    defaultChecked={offering.is_active}
                    disabled={isPending}
                    className="w-4 h-4 rounded border-border-strong text-ink focus:ring-ink"
                  />
                  <span className="text-sm font-medium text-ink">
                    Active (visible on public commission page)
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Link href="/dashboard/offerings">
            <Button variant="ghost" type="button" disabled={isPending}>
              Back to Offerings
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Danger Zone: Offering Deletion */}
      <div className="border border-danger/30 rounded-2xl bg-danger/5 p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg text-danger">Delete Offering</h3>
          <p className="text-xs text-text-muted mt-1">
            Offerings that have associated client inquiries cannot be deleted to preserve inquiry history. In that case, deactivate the offering instead.
          </p>
          {typeof offering.inquiry_count === "number" && offering.inquiry_count > 0 && (
            <p className="text-xs font-semibold text-danger mt-1">
              Notice: This offering is referenced by {offering.inquiry_count} inquiry record(s). It cannot be hard deleted.
            </p>
          )}
        </div>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            Delete Offering...
          </Button>
        ) : (
          <div className="p-4 bg-surface rounded-xl border border-danger/40 space-y-3">
            <p className="text-sm font-medium text-ink">
              Are you sure you want to permanently delete &ldquo;{offering.title}&rdquo;?
            </p>
            <p className="text-xs text-text-muted">
              This action cannot be undone. If inquiries reference this offering, the deletion will be blocked by foreign key constraints.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
