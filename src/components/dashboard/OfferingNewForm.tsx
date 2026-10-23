"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createOfferingAction, type OfferingActionResult } from "@/app/actions/offering";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OfferingNewForm() {
  const [state, formAction, isPending] = useActionState<OfferingActionResult | null, FormData>(
    createOfferingAction,
    null
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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

      <Card>
        <CardContent className="space-y-6">
          <Input
            label="Offering Title *"
            id="title"
            name="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Character Portrait / Bust"
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
              placeholder="e.g. 500000"
              helperText="Baseline price displayed to visitors."
              error={state?.fieldErrors?.price_from?.[0]}
              disabled={isPending}
            />
            <Input
              label="Currency Code"
              id="price_currency"
              name="price_currency"
              defaultValue="IDR"
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
              defaultValue={0}
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
                  defaultChecked
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
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? "Creating Offering..." : "Create Offering"}
        </Button>
      </div>
    </form>
  );
}
