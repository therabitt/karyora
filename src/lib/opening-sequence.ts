export const KARYORA_OPENING_SESSION_KEY = "karyora:opening:seen:v1";

/**
 * Temporary editorial copy for the first-session opening sequence.
 * Replace the wording after the artist's final positioning and voice are confirmed.
 */
export const KARYORA_OPENING_SCENES = [
  {
    id: "invitation",
    eyebrow: "AN ARTIST'S WORLD",
    headline: "A space for art to find its form.",
    description: "An artist's world of images, ideas, and commissions.",
    durationMs: 2200,
  },
  {
    id: "introduction",
    eyebrow: "THE BEGINNING",
    headline: "Every image begins with a feeling.",
    description: "A thought, a feeling, a fleeting idea made visible.",
    durationMs: 1370,
  },
  {
    id: "artist",
    eyebrow: "THE ARTIST",
    headline: "A personal language, told through images.",
    description: "A practice shaped by observation, imagination, and intent.",
    durationMs: 1370,
  },
  {
    id: "craft",
    eyebrow: "THE CRAFT",
    headline: "Made to be seen. Open to be imagined.",
    description: "Explore the work, the stories behind it, and the possibilities of commission.",
    durationMs: 1370,
  },
  {
    id: "release",
    eyebrow: "THE REVEAL",
    headline: "Now, let the work speak.",
    description: "The exhibition begins.",
    durationMs: 1500,
  },
] as const;

export function shouldPresentKaryoraOpening(
  hasFeaturedArtwork: boolean,
  hasSeenOpeningInSession: boolean,
): boolean {
  return hasFeaturedArtwork && !hasSeenOpeningInSession;
}
