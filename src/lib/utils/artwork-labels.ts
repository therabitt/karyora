import type { ArtworkCategory, ArtworkMedium } from "@/types/database.types";

const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  "original-character": "Original Character",
  "fan-art": "Fan Art",
  portrait: "Portrait",
  landscape: "Landscape",
  other: "Other Studies",
};

const MEDIUM_LABELS: Record<ArtworkMedium, string> = {
  "digital-painting": "Digital Painting",
  "pixel-art": "Pixel Art",
  vector: "Vector",
  traditional: "Traditional",
  "mixed-media": "Mixed Media",
  other: "Other",
};

export function formatArtworkCategory(category: string): string {
  return CATEGORY_LABELS[category as ArtworkCategory] ?? titleCase(category);
}

export function formatArtworkMedium(medium: string): string {
  return MEDIUM_LABELS[medium as ArtworkMedium] ?? titleCase(medium);
}

function titleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
