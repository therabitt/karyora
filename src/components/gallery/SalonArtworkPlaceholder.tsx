import type { PublicArtwork } from "@/lib/data/artworks";

export function SalonArtworkPlaceholder({
  artwork,
  numberLabel,
  large = false,
}: {
  artwork: PublicArtwork;
  numberLabel: string;
  large?: boolean;
}) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-muted p-4 text-center">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-hover">
        № {numberLabel}
      </span>
      <span
        className={
          large
            ? "font-artwork-title text-3xl leading-tight text-ink"
            : "font-artwork-title text-lg leading-tight text-ink"
        }
      >
        {artwork.title}
      </span>
      <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-text-muted">
        Image unavailable
      </span>
    </span>
  );
}
