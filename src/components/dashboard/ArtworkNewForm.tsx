"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { createArtworkAction, type ArtworkActionResult } from "@/app/actions/artwork";
import { ARTWORK_CATEGORIES, ARTWORK_MEDIUMS } from "@/types/domain";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArtworkNewForm() {
  const [state, formAction, isPending] = useActionState<ArtworkActionResult | null, FormData>(
    createArtworkAction,
    null
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* 1. Staged Source Image Upload */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="font-sans text-lg text-ink">Exhibition Media</h2>
          <ImageUploader disabled={isPending} />
          {state?.fieldErrors?.image && (
            <p className="text-xs text-danger font-medium">
              {state.fieldErrors.image[0]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Artwork Metadata */}
      <Card>
        <CardContent className="space-y-6">
          <h2 className="font-sans text-lg text-ink">Artwork Details</h2>

          <Input
            label="Artwork Title *"
            id="title"
            name="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Solitude in Crimson"
            error={state?.fieldErrors?.title?.[0]}
            disabled={isPending}
            required
          />

          <Input
            label="URL Slug *"
            id="slug"
            name="slug"
            value={slug}
            onChange={handleSlugChange}
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
                defaultValue="original-character"
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
                defaultValue="digital-painting"
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
            placeholder="Thematic background, context, technical notes, or creative commentary..."
            helperText="Maximum 4,000 characters."
            error={state?.fieldErrors?.description?.[0]}
            disabled={isPending}
          />

          <Input
            label="Tags (Comma-separated)"
            id="tags"
            name="tags"
            placeholder="character, portrait, lighting, fantasy"
            helperText="Up to 20 tags. Separate tags with commas."
            error={state?.fieldErrors?.tags?.[0]}
            disabled={isPending}
          />
        </CardContent>
      </Card>

      {/* 3. Publication & Visibility Settings */}
      <Card>
        <CardContent className="space-y-6">
          <h2 className="font-sans text-lg text-ink">Publication State</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50 transition-colors">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === "draft"}
                onChange={() => setStatus("draft")}
                disabled={isPending}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-semibold text-ink">Save as Draft</span>
                <span className="block text-xs text-text-muted mt-0.5">
                  Stored securely in private storage. Not visible on the public gallery.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50 transition-colors">
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === "published"}
                onChange={() => setStatus("published")}
                disabled={isPending}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-semibold text-ink">Publish Immediately</span>
                <span className="block text-xs text-text-muted mt-0.5">
                  Generates metadata-stripped WebP derivative and publishes to the gallery.
                </span>
              </div>
            </label>
          </div>

          {status === "published" && (
            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  value="true"
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
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending
            ? status === "published"
              ? "Publishing Artwork..."
              : "Saving Draft..."
            : status === "published"
            ? "Publish Artwork"
            : "Save as Draft"}
        </Button>
      </div>
    </form>
  );
}
