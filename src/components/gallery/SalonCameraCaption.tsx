"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import {
  formatArtworkCategory,
  formatArtworkMedium,
} from "@/lib/utils/artwork-labels";
import type { PublicArtwork } from "@/lib/data/artworks";

interface SalonCameraCaptionProps {
  artwork: PublicArtwork;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (delta: number) => void;
  backButtonRef: RefObject<HTMLButtonElement | null>;
}

export function SalonCameraCaption({
  artwork,
  index,
  total,
  onClose,
  onStep,
  backButtonRef,
}: SalonCameraCaptionProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [artwork.id]);

  const year = artwork.published_at
    ? new Date(artwork.published_at).getFullYear()
    : null;
  const canGoPrevious = index > 0;
  const canGoNext = index < total - 1;

  const stopInteraction = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={panelRef}
      className="camera-caption"
      data-camera-caption
      role="region"
      aria-labelledby="camera-caption-title"
      onPointerDown={stopInteraction}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="camera-caption-header flex items-start justify-between gap-4">
        <p className="camera-caption-meta">
          № {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")} ·{" "}
          {formatArtworkCategory(artwork.category)}
        </p>
        <button
          ref={backButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Back to the wall"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong/50 text-ink transition-colors hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div key={artwork.id} className="camera-caption-enter">
        <h2 id="camera-caption-title" className="camera-caption-title mt-3">
          {artwork.title}
        </h2>

        {artwork.description && (
          <p className="camera-caption-description mt-3">
            {artwork.description}
          </p>
        )}

        <p className="camera-caption-meta mt-4">
          {formatArtworkMedium(artwork.medium)}
          {year ? ` · ${year}` : ""}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
        <Link
          href={`/artworks/${artwork.slug}`}
          className="inline-flex min-h-11 items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-hover transition-colors hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          Open artwork page
          <span aria-hidden="true">→</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStep(-1)}
            disabled={!canGoPrevious}
            aria-label="Previous artwork"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            disabled={!canGoNext}
            aria-label="Next artwork"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
