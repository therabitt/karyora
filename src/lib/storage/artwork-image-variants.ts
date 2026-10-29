import { getStoragePublicUrl } from "@/lib/storage/urls";

export const ARTWORK_RESPONSIVE_MAX_EDGES = [64, 128, 256, 384, 512, 768, 1024, 1280, 1600] as const;

function normalizeBucketPath(path: string): string {
  const clean = path.replace(/^\\/+/, "");
  return clean.startsWith("artworks-public/") ? clean.slice("artworks-public/".length) : clean;
}

function parseResponsivePath(path: string): { directory: string; maxEdge: number } | null {
  const normalized = normalizeBucketPath(path);
  const match = normalized.match(/^(artworks\\/[^/]+\\/[^/]+\\/responsive)\\/(\\d+)\\.webp$/);
  if (!match) return null;
  const maxEdge = Number(match[2]);
  if (!Number.isInteger(maxEdge) || maxEdge <= 0 || maxEdge > 1600) return null;
  return { directory: `artworks-public/${match[1]}`, maxEdge };
}

export function getArtworkResponsiveObjectPaths(publicImagePath: string | null | undefined): string[] {
  if (!publicImagePath) return [];
  const parsed = parseResponsivePath(publicImagePath);
  if (!parsed) return [publicImagePath];

  const edges = [
    ...ARTWORK_RESPONSIVE_MAX_EDGES.filter((edge) => edge < parsed.maxEdge),
    parsed.maxEdge,
  ];
  return [...new Set(edges)].map((edge) => `${parsed.directory}/${edge}.webp`);
}

export function getArtworkResponsiveGroupPrefix(objectPath: string): string | null {
  const normalized = normalizeBucketPath(objectPath);
  const match = normalized.match(/^(artworks\\/[^/]+\\/[^/]+\\/responsive\\/)\\d+\\.webp$/);
  return match ? `artworks-public/${match[1]}` : null;
}

export interface ArtworkImageSources {
  src: string | null;
  srcSet?: string;
}

export function getArtworkResponsiveImageSources(
  publicImagePath: string | null | undefined,
  imageWidth: number | null | undefined,
  imageHeight: number | null | undefined,
): ArtworkImageSources {
  const src = getStoragePublicUrl(publicImagePath);
  if (!src || !publicImagePath || !imageWidth || !imageHeight) return { src };

  const parsed = parseResponsivePath(publicImagePath);
  if (!parsed || Math.max(imageWidth, imageHeight) !== parsed.maxEdge) return { src };

  const candidates = getArtworkResponsiveObjectPaths(publicImagePath)
    .map((path) => {
      const edgeMatch = path.match(/\\/(\\d+)\\.webp$/);
      const edge = edgeMatch ? Number(edgeMatch[1]) : 0;
      const width = edge === parsed.maxEdge
        ? imageWidth
        : Math.max(1, Math.round(imageWidth * edge / parsed.maxEdge));
      const url = getStoragePublicUrl(path);
      return url && edge > 0 ? { url, width } : null;
    })
    .filter((item): item is { url: string; width: number } => item !== null)
    .sort((a, b) => a.width - b.width);

  // Width descriptors must be unique. If a very narrow artwork rounds multiple
  // candidates to the same pixel width, keep the largest variant for that width.
  const uniqueCandidates = new Map<number, string>();
  for (const candidate of candidates) uniqueCandidates.set(candidate.width, candidate.url);
  if (uniqueCandidates.size < 2) return { src };

  return {
    src,
    srcSet: [...uniqueCandidates.entries()]
      .sort(([widthA], [widthB]) => widthA - widthB)
      .map(([width, url]) => `${url} ${width}w`)
      .join(", "),
  };
}
