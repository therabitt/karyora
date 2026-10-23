"use client";

import React, { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import {
  updateArtworkAction,
  publishArtworkAction,
  unpublishArtworkAction,
  deleteArtworkAction,
  type ArtworkActionResult,
} from "@/app/actions/artwork";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import { ARTWORK_CATEGORIES, ARTWORK_MEDIUMS } from "@/types/domain";
import type { AdminArtwork } from "@/lib/data/artworks";

interface ArtworkEditFormProps {
  artwork: AdminArtwork;
}

export function ArtworkEditForm({ artwork }: ArtworkEditFormProps) {
  const updateActionWithId = updateArtworkAction.bind(null, artwork.id);
  const [state, formAction, isPending] = useActionState<ArtworkActionResult | null, FormData>(
    updateActionWithId,
    null
  );

  const [isPublishing, startPublishTransition] = useTransition();
  const [isUnpublishing, startUnpublishTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [actionError, setActionError] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageReplace, setShowImageReplace] = useState(false);

  const isPublished = artwork.status === "published";
  const publicImageUrl = getStoragePublicUrl(artwork.public_image_path);

  const handlePublish = () => {
    setActionError(null);
    startPublishTransition(async () => {
      const res = await publishArtworkAction(artwork.id);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const handleUnpublish = () => {
    setActionError(null);
    startUnpublishTransition(async () => {
      const res = await unpublishArtworkAction(artwork.id);
      if (res?.error) {
        setActionError(res.error);
      } else if (res?.cleanupPending) {
        setCleanupWarning(true);
      }
    });
  };

  const handleDelete = () => {
    setActionError(null);
    startDeleteTransition(async () => {
      const res = await deleteArtworkAction(artwork.id);
      if (res?.error) {
        setActionError(res.error);
        setShowDeleteConfirm(false);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Notifications / Alerts */}
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
          <span>Artwork details updated successfully.</span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{actionError}</span>
        </div>
      )}

      {cleanupWarning && (
        <div
          role="status"
          className="p-4 rounded-xl bg-accent-soft/30 border border-accent/40 text-sm text-ink space-y-1"
        >
          <p className="font-semibold text-accent">Unpublished — Cleanup Pending</p>
          <p className="text-xs text-text-muted">
            The artwork has been unpublished from all public projections. Physical object deletion from storage is queued and will retry automatically.
          </p>
        </div>
      )}

      {/* Status & Lifecycle Banner */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={artwork.status}>{artwork.status}</Badge>
              {artwork.is_featured && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-soft text-accent border border-accent/20">
                  Featured on Home
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {isPublished
                ? `Published on ${
                    artwork.published_at
                      ? new Date(artwork.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "an unknown date"
                  }`
                : "Draft — Only visible to you in the administrator dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPublished ? (
              <>
                <Link
                  href={`/artworks/${artwork.slug}`}
                  target="_blank"
                  className="inline-block"
                >
                  <Button variant="outline" size="sm" type="button">
                    View Live ↗
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isUnpublishing || isPending}
                >
                  {isUnpublishing ? "Unpublishing..." : "Unpublish to Draft"}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isPending}
              >
                {isPublishing ? "Publishing WebP..." : "Publish to Gallery"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Metadata Form */}
      <form action={formAction} className="space-y-8">
        {/* Exhibition Preview & Replacement */}
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-serif text-lg text-ink">Artwork Image</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageReplace(!showImageReplace)}
              >
                {showImageReplace ? "Cancel Replacement" : "Replace Image Source"}
              </Button>
            </div>

            {showImageReplace ? (
              <div className="space-y-3 p-4 bg-surface-muted rounded-xl border border-border">
                <p className="text-xs text-text-muted">
                  Uploading a new image will stage a new private source and, if published, generate a new WebP derivative. The old image files will be queued for safe cleanup.
                </p>
                <ImageUploader disabled={isPending} />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-surface-muted rounded-xl border border-border">
                <div className="w-40 h-40 flex items-center justify-center rounded-lg bg-surface border border-border overflow-hidden shrink-0">
                  {publicImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicImageUrl}
                      alt={artwork.alt_text}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-xs text-text-muted">
                      <span className="block text-2xl mb-1">✦</span>
                      <span>Source Staged</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-xs text-text-muted">
                  <p className="font-mono text-ink text-sm font-medium">
                    {artwork.title}
                  </p>
                  <p>
                    <span className="font-medium text-ink">Private Path:</span>{" "}
                    <span className="font-mono">{artwork.private_image_path}</span>
                  </p>
                  {artwork.public_image_path && (
                    <p>
                      <span className="font-medium text-ink">Public WebP:</span>{" "}
                      <span className="font-mono">{artwork.public_image_path}</span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-ink">Last Updated:</span>{" "}
                    {new Date(artwork.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata Details */}
        <Card>
          <CardContent className="space-y-6">
            <h2 className="font-serif text-lg text-ink">Artwork Information</h2>

            <Input
              label="Artwork Title *"
              id="title"
              name="title"
              defaultValue={artwork.title}
              placeholder="e.g. Solitude in Crimson"
              error={state?.fieldErrors?.title?.[0]}
              disabled={isPending}
              required
            />

            <Input
              label="URL Slug *"
              id="slug"
              name="slug"
              defaultValue={artwork.slug}
              placeholder="solitude-in-crimson"
              helperText="Lowercase alphanumeric characters and hyphens only."
              error={state?.fieldErrors?.slug?.[0]}
              disabled={isPending}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-medium text-ink">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={artwork.category}
                  disabled={isPending}
                  className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink capitalize focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  {ARTWORK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="medium" className="block text-sm font-medium text-ink">
                  Medium *
                </label>
                <select
                  id="medium"
                  name="medium"
                  defaultValue={artwork.medium}
                  disabled={isPending}
                  className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink capitalize focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  {ARTWORK_MEDIUMS.map((med) => (
                    <option key={med} value={med}>
                      {med.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Accessibility Alt Text *"
              id="alt_text"
              name="alt_text"
              defaultValue={artwork.alt_text}
              placeholder="Detailed description of visible visual elements for screen readers..."
              helperText="Mandatory accessibility requirement (max 250 characters)."
              error={state?.fieldErrors?.alt_text?.[0]}
              disabled={isPending}
              required
            />

            <Textarea
              label="Artwork Narrative & Description"
              id="description"
              name="description"
              rows={4}
              defaultValue={artwork.description}
              placeholder="Thematic background, context, technical notes, or creative commentary..."
              helperText="Maximum 4,000 characters."
              error={state?.fieldErrors?.description?.[0]}
              disabled={isPending}
            />

            <Input
              label="Tags (Comma-separated)"
              id="tags"
              name="tags"
              defaultValue={artwork.tags?.join(", ") || ""}
              placeholder="character, portrait, lighting, fantasy"
              helperText="Up to 20 tags. Separate tags with commas."
              error={state?.fieldErrors?.tags?.[0]}
              disabled={isPending}
            />

            {/* Featured toggle only available for published artworks */}
            {isPublished && (
              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    value="true"
                    defaultChecked={artwork.is_featured}
                    disabled={isPending}
                    className="w-4 h-4 rounded border-border-strong text-ink focus:ring-ink"
                  />
                  <span className="text-sm font-medium text-ink">
                    Feature this artwork on the homepage exhibition
                  </span>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Link href="/dashboard/artworks">
            <Button variant="ghost" type="button" disabled={isPending}>
              Back to Artworks
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Saving Changes..." : "Save Artwork Changes"}
          </Button>
        </div>
      </form>

      {/* Danger Zone: Artwork Deletion */}
      <div className="border border-danger/30 rounded-2xl bg-danger/5 p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg text-danger">Delete Artwork</h3>
          <p className="text-xs text-text-muted mt-1">
            Permanently deletes this artwork record. Its private source and public derivative files will be queued and removed from storage.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            Delete Artwork...
          </Button>
        ) : (
          <div className="p-4 bg-surface rounded-xl border border-danger/40 space-y-3">
            <p className="text-sm font-medium text-ink">
              Are you sure you want to permanently delete &ldquo;{artwork.title}&rdquo;?
            </p>
            <p className="text-xs text-text-muted">
              This action cannot be undone. All database records and storage files for this artwork will be removed.
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
