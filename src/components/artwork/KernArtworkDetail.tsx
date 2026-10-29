"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { getStoragePublicUrl } from "@/lib/storage/urls";
import { getArtworkResponsiveImageSources } from "@/lib/storage/artwork-image-variants";
import type { PublicArtwork } from "@/lib/data/artworks";
import { PublicNavigationMenu } from "@/components/layout/PublicNavigationMenu";
import {
  getMotionDuration,
  getMotionEasing,
} from "@/lib/motion/motion-tokens";

interface KernArtworkDetailProps {
  initialArtwork: PublicArtwork;
  allArtworks: PublicArtwork[];
}

const DETAIL_ARTWORK_IMAGE_SIZES = "(min-width: 1280px) min(660px, 42vw), (min-width: 1024px) min(560px, 38vw), (min-width: 640px) min(440px, 58vw), min(340px, 78vw)";

// ─── ARTWORK STACK THEME & ABSTRACT PATTERNS ─────────────────────────────────
// Each artwork has its own unique 3-layer identity:
// - Rear layer: solid dominant palette color.
// - Middle layer: tilted abstract card with complementary colors, textures & patterns.
// - Front layer: the actual artwork image preserving native aspect ratio.
import {
  type StackTheme,
  CATALOG_THEMES,
  getHarmoniousThemeForArtwork,
} from "@/lib/color/artwork-themes";

// Helper to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── DYNAMIC CLIENT-SIDE PALETTE EXTRACTION ──────────────────────────────────
// Samples pixels from an image element in 1ms to extract true dominant colors
function extractPaletteFromImage(img: HTMLImageElement): StackTheme | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;

    let totalOpaquePixels = 0;
    let achromaticPixelCount = 0;
    let chromaticPixelCount = 0;

    const hueBins: { count: number; rSum: number; gSum: number; bSum: number }[] = Array.from(
      { length: 12 },
      () => ({ count: 0, rSum: 0, gSum: 0, bSum: 0 })
    );

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue; // transparent pixel
      totalOpaquePixels++;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      // Check if pixel is neutral/achromatic (grayscale, black, white, gray)
      // Channels differ by <= 14 units out of 255
      if (diff <= 14) {
        achromaticPixelCount++;
        continue;
      }

      const l = (max + min) / 510;
      if (l < 0.10 || l > 0.92) {
        achromaticPixelCount++;
        continue;
      }

      const d = max - min;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;
      if (s < 0.14) {
        achromaticPixelCount++;
        continue;
      }

      // Valid chromatic pixel
      chromaticPixelCount++;
      let h = 0;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;

      const binIdx = Math.floor((h * 360) / 30) % 12;
      const bin = hueBins[binIdx];
      bin.count += 1 + s;
      bin.rSum += r;
      bin.gSum += g;
      bin.bSum += b;
    }

    if (totalOpaquePixels === 0) return null;

    // ── MONOCHROME / BLACK & WHITE / GRAYSCALE DETECTION ─────────────────────
    // If >= 80% of pixels are achromatic OR chromatic count is negligible:
    // Pure Architectural Graphite & Silver Mist palette (NO PURPLE, NO OLIVE GREEN!)
    const neutralRatio = achromaticPixelCount / totalOpaquePixels;
    if (neutralRatio >= 0.80 || chromaticPixelCount < totalOpaquePixels * 0.08) {
      return {
        dominantColor: "#2A3036", // Charcoal Slate
        abstractBg: "linear-gradient(135deg, #131618 0%, #1E2226 50%, #0E1012 100%)", // Obsidian Deep Gradient
        patternType: "minimal",
        accentColor: "#C2CCD6", // Pearl Silver
        subtleLineColor: "rgba(194, 204, 214, 0.22)",
        plateTag: "MONOCHROME ARCHIVE · GRAPHITE STUDY",
        temperature: "neutral",
      };
    }

    let bestBin = hueBins[0];
    for (const b of hueBins) {
      if (b.count > bestBin.count) bestBin = b;
    }

    let dominantHex = "#3A4A59";
    let domHue = 210;
    let domSat = 50;

    if (bestBin.count > 0) {
      const avgR = Math.round(bestBin.rSum / bestBin.count);
      const avgG = Math.round(bestBin.gSum / bestBin.count);
      const avgB = Math.round(bestBin.bSum / bestBin.count);

      const max = Math.max(avgR, avgG, avgB) / 255;
      const min = Math.min(avgR, avgG, avgB) / 255;
      const l = (max + min) / 2;
      const d = max - min;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = 0;
      if (max === avgR / 255) h = ((avgG - avgB) / 255 / d + (avgG < avgB ? 6 : 0)) / 6;
      else if (max === avgG / 255) h = ((avgB - avgR) / 255 / d + 2) / 6;
      else h = ((avgR - avgG) / 255 / d + 4) / 6;

      domHue = Math.round(h * 360);
      domSat = Math.round(Math.min(Math.max(s * 100, 36), 68));
      const targetL = Math.round(Math.min(Math.max(l * 100, 26), 42));
      dominantHex = hslToHex(domHue, domSat, targetL);
    } else {
      // Pure fallback to monochrome if no chromatic bin has points
      return {
        dominantColor: "#2A3036",
        abstractBg: "linear-gradient(135deg, #131618 0%, #1E2226 50%, #0E1012 100%)",
        patternType: "minimal",
        accentColor: "#C2CCD6",
        subtleLineColor: "rgba(194, 204, 214, 0.22)",
        plateTag: "MONOCHROME ARCHIVE · GRAPHITE STUDY",
        temperature: "neutral",
      };
    }

    const compHue = (domHue + 175) % 360;
    const abstractBg = `linear-gradient(135deg, hsl(${compHue}, 32%, 16%) 0%, hsl(${compHue}, 36%, 23%) 50%, hsl(${compHue}, 28%, 12%) 100%)`;
    const accentColor = `hsl(${domHue}, 75%, 72%)`;
    const subtleLineColor = `hsla(${compHue}, 55%, 75%, 0.24)`;

    let patternType: StackTheme["patternType"] = "topographic";
    if (domHue >= 190 && domHue <= 260) patternType = "geometric";
    else if (domHue >= 80 && domHue < 190) patternType = "botanical";
    else if (domHue >= 260 && domHue <= 330) patternType = "astrolabe";
    else if (domHue > 330 || domHue < 40) patternType = "filigree";
    else patternType = "horizon";

    return {
      dominantColor: dominantHex,
      abstractBg,
      patternType,
      accentColor,
      subtleLineColor,
      plateTag: "DYNAMIC CHROMATIC ARCHIVE",
      temperature: domHue >= 45 && domHue <= 135 ? "warm" : "cool",
    };
  } catch {
    return null;
  }
}

// ─── ABSTRACT CARD VECTOR PATTERN COMPONENT ──────────────────────────────────
// Renders vector linework specific to the artwork's conceptual theme.
function AbstractPlatePattern({ theme, itemNumber }: { theme: StackTheme; itemNumber: string }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      {/* Background Complementary Gradient */}
      <div className="absolute inset-0" style={{ background: theme.abstractBg }} />

      {/* Vector Linework tailored to pattern type */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="cardGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={theme.accentColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={theme.accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="500" fill="url(#cardGlow)" />

        {theme.patternType === "topographic" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <path d="M-50,80 Q100,140 200,90 T450,110" />
            <path d="M-50,140 Q120,200 240,150 T450,170" />
            <path d="M-50,200 Q140,260 260,210 T450,230" />
            <path d="M-50,260 Q160,320 280,270 T450,290" />
            <path d="M-50,320 Q180,380 300,330 T450,350" />
            <path d="M-50,380 Q200,440 320,390 T450,410" />
            <circle cx="200" cy="180" r="90" stroke={theme.accentColor} strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" />
            <circle cx="200" cy="180" r="50" stroke={theme.accentColor} strokeWidth="1" opacity="0.8" />
          </g>
        )}

        {theme.patternType === "geometric" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <line x1="0" y1="0" x2="400" y2="500" />
            <line x1="400" y1="0" x2="0" y2="500" />
            <polygon points="200,60 340,250 200,440 60,250" stroke={theme.accentColor} strokeWidth="1" opacity="0.6" />
            <polygon points="200,120 300,250 200,380 100,250" stroke={theme.accentColor} strokeWidth="0.8" strokeDasharray="4 4" opacity="0.8" />
            <line x1="200" y1="0" x2="200" y2="500" strokeDasharray="2 3" opacity="0.4" />
            <line x1="0" y1="250" x2="400" y2="250" strokeDasharray="2 3" opacity="0.4" />
          </g>
        )}

        {theme.patternType === "botanical" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <path d="M200,480 C200,340 120,260 80,180 C50,120 70,60 120,40 C170,20 200,80 200,160 C200,80 230,20 280,40 C330,60 350,120 320,180 C280,260 200,340 200,480 Z" stroke={theme.accentColor} strokeWidth="1" opacity="0.75" />
            <path d="M200,450 C200,300 280,200 340,150" />
            <path d="M200,380 C200,250 120,160 60,120" />
            <path d="M200,300 C200,200 270,130 320,90" />
            <circle cx="200" cy="180" r="120" strokeDasharray="2 4" opacity="0.35" />
          </g>
        )}

        {theme.patternType === "astrolabe" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <circle cx="200" cy="220" r="140" stroke={theme.accentColor} strokeWidth="1" opacity="0.6" />
            <circle cx="200" cy="220" r="100" strokeDasharray="3 4" opacity="0.5" />
            <circle cx="200" cy="220" r="60" stroke={theme.accentColor} strokeWidth="1.2" opacity="0.8" />
            <line x1="200" y1="40" x2="200" y2="400" opacity="0.5" />
            <line x1="20" y1="220" x2="380" y2="220" opacity="0.5" />
            <line x1="60" y1="80" x2="340" y2="360" strokeDasharray="2 4" opacity="0.35" />
            <line x1="60" y1="360" x2="340" y2="80" strokeDasharray="2 4" opacity="0.35" />
          </g>
        )}

        {theme.patternType === "filigree" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <rect x="50" y="60" width="300" height="380" rx="150" stroke={theme.accentColor} strokeWidth="1" opacity="0.6" />
            <rect x="75" y="85" width="250" height="330" rx="125" strokeDasharray="4 4" opacity="0.4" />
            <circle cx="200" cy="250" r="70" stroke={theme.accentColor} strokeWidth="1" opacity="0.75" />
            <line x1="50" y1="250" x2="350" y2="250" strokeDasharray="2 3" opacity="0.4" />
          </g>
        )}

        {theme.patternType === "horizon" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1.2">
            <line x1="0" y1="250" x2="400" y2="250" stroke={theme.accentColor} strokeWidth="1.5" opacity="0.8" />
            <path d="M0,210 Q200,160 400,210" opacity="0.6" />
            <path d="M0,170 Q200,100 400,170" opacity="0.4" />
            <path d="M0,290 Q200,340 400,290" opacity="0.6" />
            <path d="M0,330 Q200,400 400,330" opacity="0.4" />
            <circle cx="200" cy="210" r="45" stroke={theme.accentColor} strokeWidth="1" opacity="0.7" />
          </g>
        )}

        {theme.patternType === "minimal" && (
          <g stroke={theme.subtleLineColor} strokeWidth="1">
            <line x1="60" y1="0" x2="60" y2="500" strokeDasharray="3 4" opacity="0.4" />
            <line x1="340" y1="0" x2="340" y2="500" strokeDasharray="3 4" opacity="0.4" />
            <line x1="0" y1="120" x2="400" y2="120" strokeDasharray="3 4" opacity="0.4" />
            <line x1="0" y1="380" x2="400" y2="380" strokeDasharray="3 4" opacity="0.4" />
            <rect x="100" y="160" width="200" height="180" stroke={theme.accentColor} strokeWidth="1" opacity="0.7" />
            <circle cx="200" cy="250" r="50" strokeDasharray="2 3" opacity="0.5" />
          </g>
        )}
      </svg>

      {/* Archival Museum Monograph Framing */}
      <div className="absolute inset-[10px] border border-white/10 rounded-2xs pointer-events-none flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase text-white/50">
          <span>PLATE № {itemNumber}</span>
          <span>SERIES MONOGRAPH</span>
        </div>
        <div className="flex items-center justify-between text-[8px] font-mono tracking-[0.18em] uppercase text-white/40">
          <span>{theme.plateTag}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}

// ─── CARD THROW ANIMATION STATE MACHINE ──────────────────────────────────────
// "idle"         → cards resting at nominal angles: Rear (+6°), Mid (-10°), Front (0°)
// "throwing-out" → all 3 cards fly offscreen in staggered trajectory (Layer 3 finishes last)
// "throwing-in"  → new cards fly in from opposite side with spring overshoot settling into place
type AnimPhase = "idle" | "throwing-out" | "throwing-in";

export function KernArtworkDetail({
  initialArtwork,
  allArtworks,
}: KernArtworkDetailProps) {
  const [currentArtwork, setCurrentArtwork] = useState<PublicArtwork>(initialArtwork);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [dynamicThemes, setDynamicThemes] = useState<Record<string, StackTheme>>({});

  // Detect prefers-reduced-motion safely without triggering cascading render lint rules
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const pendingArtworkRef = useRef<PublicArtwork | null>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const dockContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wheelCooldownRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const currentIndex = allArtworks.findIndex((a) => a.id === currentArtwork.id);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const totalCount = allArtworks.length;
  const itemNumber = String(activeIndex + 1).padStart(2, "0");
  const totalFormatted = String(totalCount).padStart(2, "0");

  const imageUrl = getStoragePublicUrl(currentArtwork.public_image_path);
  const isImageFailed = failedImages[currentArtwork.id];
  const currentResponsiveSources = getArtworkResponsiveImageSources(
    currentArtwork.public_image_path,
    currentArtwork.image_width ?? 1600,
    currentArtwork.image_height ?? 1200,
  );

  // Artwork-specific stack theme for the currently active artwork
  const currentTheme = useMemo(
    () => getHarmoniousThemeForArtwork(currentArtwork, dynamicThemes),
    [currentArtwork, dynamicThemes]
  );

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  // Preload only the browser-selected responsive variant for adjacent artworks.
  // This preserves card-throw continuity without forcing full-resolution files on small screens.
  useEffect(() => {
    if (totalCount <= 1) return;
    const adjacent = [
      allArtworks[(activeIndex + 1) % totalCount],
      allArtworks[(activeIndex - 1 + totalCount) % totalCount],
    ];

    adjacent.forEach((artwork) => {
      if (!artwork?.public_image_path) return;
      const sources = getArtworkResponsiveImageSources(
        artwork.public_image_path,
        artwork.image_width ?? 1600,
        artwork.image_height ?? 1200,
      );
      if (!sources.src) return;

      const image = new window.Image();
      if (sources.srcSet) image.srcset = sources.srcSet;
      image.sizes = DETAIL_ARTWORK_IMAGE_SIZES;
      image.fetchPriority = "low";
      image.decoding = "async";
      image.src = sources.src;
    });
  }, [activeIndex, allArtworks, totalCount]);

  const scrollToActiveThumb = useCallback((index: number, smooth = true) => {
    const container = dockContainerRef.current;
    const target = itemRefs.current[index];
    if (container && target) {
      const containerCenter = container.clientWidth / 2;
      const targetCenter = target.offsetLeft + target.clientWidth / 2;
      const targetScroll = Math.max(0, targetCenter - containerCenter);
      container.scrollTo({ left: targetScroll, behavior: smooth ? "smooth" : "instant" });
    }
  }, []);

  // ─── CARD THROW NAVIGATION CONTROLLER ──────────────────────────────────────
  // Navigation is disabled during active transitions to prevent inconsistent artwork states.
  const isNavDisabled = animPhase !== "idle";

  const triggerCardThrow = useCallback(
    (targetArtwork: PublicArtwork, newIndex: number, dir: "forward" | "backward") => {
      if (isNavDisabled || targetArtwork.id === currentArtwork.id) return;

      pendingArtworkRef.current = targetArtwork;
      setDirection(dir);
      setAnimPhase("throwing-out");
      scrollToActiveThumb(newIndex, true);
    },
    [isNavDisabled, currentArtwork.id, scrollToActiveThumb]
  );

  const handleNext = useCallback(() => {
    if (totalCount <= 1 || isNavDisabled) return;
    const nextIdx = (activeIndex + 1) % totalCount;
    triggerCardThrow(allArtworks[nextIdx], nextIdx, "forward");
  }, [activeIndex, allArtworks, totalCount, isNavDisabled, triggerCardThrow]);

  const handlePrev = useCallback(() => {
    if (totalCount <= 1 || isNavDisabled) return;
    const prevIdx = (activeIndex - 1 + totalCount) % totalCount;
    triggerCardThrow(allArtworks[prevIdx], prevIdx, "backward");
  }, [activeIndex, allArtworks, totalCount, isNavDisabled, triggerCardThrow]);

  // ─── ANIMATION SYNCHRONIZATION WITH onAnimationEnd ─────────────────────────
  // Front card (Layer 3) finishes last in both exit and enter phases.
  // Transitions are strictly triggered upon animation completion, NOT hardcoded timeouts.
  const handleFrontCardAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      // Ensure the event originated on the front card itself
      if (e.target !== frontCardRef.current) return;

      if (animPhase === "throwing-out") {
        // Outgoing phase complete: swap data and immediately start throwing-in
        if (pendingArtworkRef.current) {
          setCurrentArtwork(pendingArtworkRef.current);
          window.history.pushState(null, "", `/artworks/${pendingArtworkRef.current.slug}`);
          pendingArtworkRef.current = null;
        }
        setAnimPhase("throwing-in");
      } else if (animPhase === "throwing-in") {
        // Incoming phase complete: cards have settled into resting formation
        setAnimPhase("idle");
      }
    },
    [animPhase]
  );

  // Safety fallback in case browser tab is backgrounded and animation events are throttled
  useEffect(() => {
    if (animPhase === "idle") return;
    const maxSafetyDuration = reducedMotion
      ? getMotionDuration("--motion-duration-reduced", 120) +
        getMotionDuration("--motion-duration-micro", 225)
      : animPhase === "throwing-out"
      ? getMotionDuration("--motion-duration-detail-exit-total", 850)
      : getMotionDuration("--motion-duration-detail-enter-total", 1000);
    const timer = setTimeout(() => {
      if (animPhase === "throwing-out") {
        if (pendingArtworkRef.current) {
          setCurrentArtwork(pendingArtworkRef.current);
          window.history.pushState(null, "", `/artworks/${pendingArtworkRef.current.slug}`);
          pendingArtworkRef.current = null;
        }
        setAnimPhase("throwing-in");
      } else if (animPhase === "throwing-in") {
        setAnimPhase("idle");
      }
    }, maxSafetyDuration);

    return () => clearTimeout(timer);
  }, [animPhase, reducedMotion]);

  // Initial thumb scroll
  useEffect(() => {
    scrollToActiveThumb(activeIndex, false);
    const t = setTimeout(() => scrollToActiveThumb(activeIndex, false), 80);
    return () => clearTimeout(t);
  }, [activeIndex, scrollToActiveThumb]);

  // Wheel → next/prev (locked during transition)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isLightboxOpen || isNavDisabled || wheelCooldownRef.current) return;
      if (Math.abs(e.deltaY) > 25 || Math.abs(e.deltaX) > 25) {
        if (e.deltaY > 0 || e.deltaX > 0) handleNext();
        else handlePrev();
        wheelCooldownRef.current = true;
        setTimeout(() => { wheelCooldownRef.current = false; }, 550);
      }
    },
    [handleNext, handlePrev, isLightboxOpen, isNavDisabled]
  );

  // Keyboard navigation (Arrow keys locked during transition)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || isNavDisabled) return;
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "Escape" && isLightboxOpen) setIsLightboxOpen(false);
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, isLightboxOpen, isNavDisabled]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = isLightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isLightboxOpen]);

  const publishedYear = currentArtwork.published_at
    ? new Date(currentArtwork.published_at).getFullYear()
    : "2026";

  // ─── DYNAMIC ANIMATION CLASSNAMES & STYLES PER LAYER ──────────────────────
  // Forward: Throws left, enters from right.
  // Backward: Throws right, enters from left.
  const isFwd = direction === "forward";

  const detailEaseIn = getMotionEasing(
    "--motion-ease-in",
    "cubic-bezier(0.7, 0, 0.84, 0)",
  );
  const detailEaseSpring = getMotionEasing(
    "--motion-ease-spring",
    "cubic-bezier(0.22, 1.12, 0.36, 1)",
  );
  const detailStaggerMs = getMotionDuration("--motion-stagger-detail-step", 50);
  const reducedFadeMs = getMotionDuration("--motion-duration-reduced", 120);

  const getLayer1Animation = () => {
    if (reducedMotion) {
      if (animPhase === "throwing-out") return `throw-fade-out ${reducedFadeMs}ms linear forwards`;
      if (animPhase === "throwing-in") return `throw-fade-in ${reducedFadeMs}ms linear forwards`;
      return "none";
    }
    if (animPhase === "throwing-out") {
      const duration = getMotionDuration("--motion-duration-detail-exit-rear", 540);
      return isFwd
        ? `throw-out-rear-fwd ${duration}ms ${detailEaseIn} 0ms forwards`
        : `throw-out-rear-bwd ${duration}ms ${detailEaseIn} 0ms forwards`;
    }
    if (animPhase === "throwing-in") {
      const duration = getMotionDuration("--motion-duration-detail-enter-rear", 675);
      return isFwd
        ? `throw-in-rear-fwd ${duration}ms ${detailEaseSpring} 0ms forwards`
        : `throw-in-rear-bwd ${duration}ms ${detailEaseSpring} 0ms forwards`;
    }
    return "none";
  };

  const getLayer2Animation = () => {
    if (reducedMotion) {
      if (animPhase === "throwing-out") return `throw-fade-out ${reducedFadeMs}ms linear forwards`;
      if (animPhase === "throwing-in") return `throw-fade-in ${reducedFadeMs}ms linear forwards`;
      return "none";
    }
    if (animPhase === "throwing-out") {
      const duration = getMotionDuration("--motion-duration-detail-exit-middle", 590);
      return isFwd
        ? `throw-out-mid-fwd ${duration}ms ${detailEaseIn} ${detailStaggerMs}ms forwards`
        : `throw-out-mid-bwd ${duration}ms ${detailEaseIn} ${detailStaggerMs}ms forwards`;
    }
    if (animPhase === "throwing-in") {
      const duration = getMotionDuration("--motion-duration-detail-enter-middle", 750);
      return isFwd
        ? `throw-in-mid-fwd ${duration}ms ${detailEaseSpring} ${detailStaggerMs}ms forwards`
        : `throw-in-mid-bwd ${duration}ms ${detailEaseSpring} ${detailStaggerMs}ms forwards`;
    }
    return "none";
  };

  const getLayer3Animation = () => {
    if (reducedMotion) {
      if (animPhase === "throwing-out") return `throw-fade-out ${reducedFadeMs}ms linear forwards`;
      if (animPhase === "throwing-in") return `throw-fade-in ${reducedFadeMs}ms linear forwards`;
      return "none";
    }
    if (animPhase === "throwing-out") {
      const duration = getMotionDuration("--motion-duration-detail-exit-front", 640);
      const delay = detailStaggerMs * 2;
      return isFwd
        ? `throw-out-front-fwd ${duration}ms ${detailEaseIn} ${delay}ms forwards`
        : `throw-out-front-bwd ${duration}ms ${detailEaseIn} ${delay}ms forwards`;
    }
    if (animPhase === "throwing-in") {
      const duration = getMotionDuration("--motion-duration-detail-enter-front", 825);
      const delay = detailStaggerMs * 2;
      return isFwd
        ? `throw-in-front-fwd ${duration}ms ${detailEaseSpring} ${delay}ms forwards`
        : `throw-in-front-bwd ${duration}ms ${detailEaseSpring} ${delay}ms forwards`;
    }
    return "none";
  };

  // Synchronized metadata reveal style
  const metaStyle: React.CSSProperties = (() => {
    const microDuration = getMotionDuration("--motion-duration-micro", 225);
    const standardEase = getMotionEasing(
      "--motion-ease-standard",
      "cubic-bezier(0.22, 1, 0.36, 1)",
    );
    if (reducedMotion) {
      return {
        opacity: animPhase === "throwing-out" ? 0 : 1,
        transition: `opacity ${getMotionDuration("--motion-duration-reduced", 120)}ms linear`,
      };
    }
    if (animPhase === "throwing-out") {
      return {
        opacity: 0,
        transform: "translateY(4px)",
        transition: `opacity ${microDuration}ms ${standardEase}, transform ${microDuration}ms ${standardEase}`,
      };
    }
    if (animPhase === "throwing-in") {
      const duration = getMotionDuration("--motion-duration-detail-meta", 475);
      const delay = getMotionDuration("--motion-delay-detail-meta", 120);
      return {
        animation: `kern-meta-reveal ${duration}ms ${detailEaseSpring} ${delay}ms forwards`,
      };
    }
    return {
      opacity: 1,
      transform: "translateY(0)",
    };
  })();

  return (
    <>
      {/* ── CARD THROW KEYFRAMES INLINE DECLARATIONS ── */}
      <style>{`
        /* Reduced Motion Fallback */
        @keyframes throw-fade-out {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes throw-fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        /* ── FORWARD: Outgoing cards thrown LEFT ── */
        @keyframes throw-out-rear-fwd {
          0%   { transform: rotate(6deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(-105vw, -12px, 0) rotate(-18deg) scale(0.92); opacity: 0; }
        }
        @keyframes throw-out-mid-fwd {
          0%   { transform: rotate(-10deg) scale(1.02); opacity: 1; }
          100% { transform: translate3d(-112vw, 20px, 0) rotate(-26deg) scale(0.92); opacity: 0; }
        }
        @keyframes throw-out-front-fwd {
          0%   { transform: rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate3d(-120vw, 8px, 0) rotate(-14deg) scale(0.92); opacity: 0; }
        }

        /* ── FORWARD: Incoming cards entered from RIGHT with overshoot ── */
        @keyframes throw-in-rear-fwd {
          0%   { transform: translate3d(105vw, 18px, 0) rotate(22deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(6deg) scale(1.01); opacity: 1; }
        }
        @keyframes throw-in-mid-fwd {
          0%   { transform: translate3d(112vw, -14px, 0) rotate(16deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(-10deg) scale(1.02); opacity: 1; }
        }
        @keyframes throw-in-front-fwd {
          0%   { transform: translate3d(120vw, -10px, 0) rotate(8deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }

        /* ── BACKWARD: Outgoing cards thrown RIGHT ── */
        @keyframes throw-out-rear-bwd {
          0%   { transform: rotate(6deg) scale(1.01); opacity: 1; }
          100% { transform: translate3d(105vw, -12px, 0) rotate(22deg) scale(0.92); opacity: 0; }
        }
        @keyframes throw-out-mid-bwd {
          0%   { transform: rotate(-10deg) scale(1.02); opacity: 1; }
          100% { transform: translate3d(112vw, 20px, 0) rotate(18deg) scale(0.92); opacity: 0; }
        }
        @keyframes throw-out-front-bwd {
          0%   { transform: rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate3d(120vw, 8px, 0) rotate(14deg) scale(0.92); opacity: 0; }
        }

        /* ── BACKWARD: Incoming cards entered from LEFT with overshoot ── */
        @keyframes throw-in-rear-bwd {
          0%   { transform: translate3d(-105vw, 18px, 0) rotate(-18deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(6deg) scale(1.01); opacity: 1; }
        }
        @keyframes throw-in-mid-bwd {
          0%   { transform: translate3d(-112vw, -14px, 0) rotate(-24deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(-10deg) scale(1.02); opacity: 1; }
        }
        @keyframes throw-in-front-bwd {
          0%   { transform: translate3d(-120vw, -10px, 0) rotate(-8deg) scale(0.88); opacity: 0; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }

        /* ── Metadata reveal ── */
        @keyframes kern-meta-reveal {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Main Exhibition Shell with horizontal overflow clipped to protect mobile/desktop */}
      <div
        onWheel={handleWheel}
        className="relative w-full min-h-screen lg:h-screen lg:max-h-screen flex flex-col bg-paper text-ink select-none overflow-x-hidden overflow-y-auto lg:overflow-hidden"
      >
        {/* ─── 1. Shared hamburger navigation ─── */}
        <header className="relative z-[101] w-full shrink-0 px-6 sm:px-10 lg:px-14 pt-5 sm:pt-7 pb-2 flex items-center justify-end">
          <PublicNavigationMenu
            commissionHref={"/commission?ref=" + encodeURIComponent(currentArtwork.slug)}
            buttonClassName="text-ink hover:text-accent"
          />
        </header>

        {/* ─── 2. Main Three-Column Exhibition Stage ─── */}
        <main className="flex-1 min-h-0 w-full flex flex-col justify-center lg:grid lg:grid-cols-[1fr_auto_1fr] px-6 sm:px-10 lg:px-14 py-6 lg:py-0 gap-5 lg:gap-0 items-center lg:items-stretch overflow-x-clip">

          {/* ── MOBILE: Title shown at top ── */}
          <div className="lg:hidden w-full text-center">
            <h1
              className="font-artwork-title text-2xl sm:text-4xl text-ink font-normal tracking-tight leading-tight"
              style={metaStyle}
            >
              {currentArtwork.title}
            </h1>
          </div>

          {/* ══ LEFT COLUMN: Karyora Editorial Wordmark ══ */}
          <div className="hidden lg:flex flex-col items-start justify-center pl-0">
            <span
              className="font-brand text-5xl xl:text-7xl text-ink font-normal tracking-tight leading-none select-none pointer-events-none"
              aria-hidden="true"
            >
              Karyora
            </span>
          </div>

          {/* ══ CENTER COLUMN: Triple-Card Stack with Physical Throw Motion ══ */}
          <div className="flex items-center justify-center lg:py-6 relative z-10 overflow-visible">
            <div className="relative group inline-flex items-center justify-center">

              {/* ── LAYER 1 (Rear): Solid dominant palette card ── */}
              <div
                aria-hidden="true"
                className="absolute pointer-events-none select-none rounded-xs will-change-transform"
                style={{
                  top: "6px",
                  bottom: "-24px",
                  left: "-22px",
                  right: "-10px",
                  zIndex: 0,
                  transform: "rotate(6deg) scale(1.01)",
                  backgroundColor: currentTheme.dominantColor,
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  animation: getLayer1Animation(),
                  transition: animPhase === "idle"
                    ? `background-color ${getMotionDuration("--motion-duration-image", 900)}ms ${getMotionEasing("--motion-ease-standard", "cubic-bezier(0.22, 1, 0.36, 1)")}`
                    : "none",
                }}
              />

              {/* ── LAYER 2 (Middle): Tilted abstract card with complementary graphics ── */}
              <div
                aria-hidden="true"
                className="absolute pointer-events-none select-none rounded-xs overflow-hidden will-change-transform"
                style={{
                  top: "0px",
                  bottom: "-16px",
                  left: "-12px",
                  right: "-12px",
                  zIndex: 1,
                  transform: "rotate(-10deg) scale(1.02)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(0,0,0,0.10)",
                  animation: getLayer2Animation(),
                }}
              >
                <AbstractPlatePattern theme={currentTheme} itemNumber={itemNumber} />
              </div>

              {/* ── LAYER 3 (Front): Hero artwork card ── */}
              <div
                ref={frontCardRef}
                onAnimationEnd={handleFrontCardAnimationEnd}
                onClick={() => {
                  if (!isNavDisabled) setIsLightboxOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (isNavDisabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsLightboxOpen(true);
                  }
                }}
                aria-label={`View full resolution: ${currentArtwork.title}`}
                className={`
                  relative bg-white border border-[#E0D9D0] rounded-xs
                  p-3 sm:p-4 cursor-zoom-in will-change-transform
                  shadow-[0_24px_50px_rgba(0,0,0,0.18),0_8px_20px_rgba(0,0,0,0.09)]
                  group-hover:shadow-[0_32px_60px_rgba(0,0,0,0.24),0_10px_24px_rgba(0,0,0,0.11)]
                  group-hover:scale-[1.012]
                  transition-shadow,transform motion-transition-image
                `}
                style={{
                  zIndex: 2,
                  animation: getLayer3Animation(),
                }}
              >
                <div className="relative flex items-center justify-center">
                  {imageUrl && !isImageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={currentArtwork.id}
                      src={currentResponsiveSources.src ?? imageUrl}
                      srcSet={currentResponsiveSources.srcSet}
                      sizes={DETAIL_ARTWORK_IMAGE_SIZES}
                      width={currentArtwork.image_width ?? 1600}
                      height={currentArtwork.image_height ?? 1200}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      alt={currentArtwork.alt_text || currentArtwork.title}
                      crossOrigin="anonymous"
                      onLoad={(e) => {
                        const slugKey = currentArtwork.slug?.toLowerCase().trim();
                        const hasPersistedOrCurated = currentArtwork.palette_metadata || (slugKey && CATALOG_THEMES[slugKey]);
                        if (!hasPersistedOrCurated && !dynamicThemes[currentArtwork.id]) {
                          const extracted = extractPaletteFromImage(e.currentTarget);
                          if (extracted) {
                            setDynamicThemes((prev) => ({ ...prev, [currentArtwork.id]: extracted }));
                          }
                        }
                      }}
                      onError={() => handleImageError(currentArtwork.id)}
                      className="block max-h-[48vh] sm:max-h-[52vh] lg:max-h-[54vh] xl:max-h-[60vh] max-w-[min(340px,78vw)] sm:max-w-[min(440px,58vw)] lg:max-w-[min(560px,38vw)] xl:max-w-[min(660px,42vw)] w-auto h-auto object-contain select-none"
                    />
                  ) : (
                    <div className="w-[260px] h-[360px] bg-gradient-to-b from-surface-muted via-paper to-sand/30 flex flex-col items-center justify-center p-6 text-center select-none">
                      <div className="w-12 h-12 rounded-full border border-accent/40 bg-accent-soft/30 flex items-center justify-center mb-3 text-accent font-sans text-lg font-semibold">
                        {itemNumber}
                      </div>
                      <span className="font-artwork-title text-lg text-ink font-normal max-w-[200px]">
                        {currentArtwork.title}
                      </span>
                    </div>
                  )}

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-paper/95 backdrop-blur-xs text-[10px] font-mono text-ink tracking-wider border border-border/80 rounded-2xs font-semibold shadow-2xs pointer-events-none">
                    № {itemNumber}
                  </div>

                  {/* Zoom hint (hover only) */}
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-ink/80 text-white backdrop-blur-xs text-[10px] font-mono tracking-wider rounded-2xs opacity-0 group-hover:opacity-100 transition-opacity motion-transition-micro pointer-events-none flex items-center gap-1.5 shadow-sm">
                    <span>Zoom</span>
                    <span aria-hidden="true">⤢</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ══ RIGHT COLUMN: Artwork Metadata & Actions ══ */}
          <div className="hidden lg:flex flex-col items-end justify-center pr-0 gap-4">
            <div
              className="flex flex-col items-end gap-3 text-right"
              style={metaStyle}
            >
              {/* Artwork title */}
              <h1 className="font-artwork-title text-3xl xl:text-4xl text-ink font-normal leading-tight tracking-tight">
                {currentArtwork.title}
              </h1>

              {/* Index counter */}
              <p className="text-[11px] font-mono text-text-muted tracking-[0.18em] uppercase">
                <span className="text-accent font-semibold">No. {itemNumber}</span>
                <span className="text-border-strong mx-1.5">·</span>
                <span>{totalFormatted}</span>
              </p>

              {/* Year · Category · Medium */}
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted leading-relaxed">
                {publishedYear}
                {" · "}
                <span className="text-ink-soft">
                  {currentArtwork.category.replace(/-/g, " ")}
                </span>
                {" · "}
                {currentArtwork.medium.replace(/-/g, " ")}
              </p>

              {/* Description */}
              {currentArtwork.description ? (
                <p className="font-handwritten text-lg xl:text-xl font-medium text-ink-soft leading-snug line-clamp-4 max-w-[260px] xl:max-w-[300px]">
                  {currentArtwork.description}
                </p>
              ) : null}

              {/* Commission CTA */}
              <Link
                href={`/commission?ref=${encodeURIComponent(currentArtwork.slug)}`}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-semibold text-accent hover:text-accent-hover transition-colors motion-transition-micro group/link"
              >
                <span>Commission Similar</span>
                <span aria-hidden="true" className="transition-transform motion-transition-micro group-hover/link:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* ── MOBILE: Metadata shown below the card ── */}
          <div className="lg:hidden w-full text-center relative z-10">
            <div
              className="flex flex-col items-center gap-2.5"
              style={metaStyle}
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                <span className="text-accent font-semibold">No. {itemNumber} of {totalFormatted}</span>
                {" · "}
                <span>{currentArtwork.category.replace(/-/g, " ")}</span>
              </p>
              {currentArtwork.description && (
                <p className="font-handwritten text-base sm:text-lg font-medium text-ink-soft leading-snug line-clamp-2 max-w-xs px-2">
                  {currentArtwork.description}
                </p>
              )}
              <div className="flex items-center gap-5 pt-1">
                <Link
                  href={`/commission?ref=${encodeURIComponent(currentArtwork.slug)}`}
                  className="text-xs uppercase tracking-wider font-semibold text-accent border-b border-accent/40 pb-0.5"
                >
                  Inquire →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (!isNavDisabled) setIsLightboxOpen(true);
                  }}
                  className="text-xs font-mono uppercase text-text-muted"
                >
                  Zoom ⤢
                </button>
              </div>
            </div>
          </div>

        </main>

        {/* ─── 3. Bottom Interactive Carousel Dock ─── */}
        <footer className="w-full shrink-0 sticky bottom-0 z-30 border-t border-border/80 bg-paper/95 backdrop-blur-md pt-2.5 pb-3.5 select-none">
          <div className="w-full">
            {/* Prev / label / Next row */}
            <div className="max-w-[1600px] mx-auto px-6 sm:px-10 flex items-center justify-between pb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-text-muted">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isNavDisabled || totalCount <= 1}
                aria-label="Previous artwork"
                className={`transition-colors motion-transition-micro flex items-center gap-1.5 py-1 px-2 ${
                  isNavDisabled
                    ? "opacity-35 cursor-not-allowed text-text-muted"
                    : "hover:text-accent cursor-pointer"
                }`}
              >
                <span>←</span>
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-2.5 text-border-strong font-medium tracking-[0.22em]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Select artwork to explore</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={isNavDisabled || totalCount <= 1}
                aria-label="Next artwork"
                className={`transition-colors motion-transition-micro flex items-center gap-1.5 py-1 px-2 ${
                  isNavDisabled
                    ? "opacity-35 cursor-not-allowed text-text-muted"
                    : "hover:text-accent cursor-pointer"
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span>→</span>
              </button>
            </div>

            {/* Horizontally scrollable artwork strip */}
            <div
              ref={dockContainerRef}
              role="tablist"
              aria-label="Exhibition artwork carousel"
              className="relative flex items-center gap-3 sm:gap-4 overflow-x-auto py-1.5 scrollbar-none"
            >
              <div className="shrink-0 w-[calc(50vw-110px)]" aria-hidden="true" />

              {allArtworks.map((artwork, idx) => {
                const isSelected = artwork.id === currentArtwork.id;
                const num = String(idx + 1).padStart(2, "0");
                const thumbUrl = getStoragePublicUrl(artwork.public_image_path);
                const thumbSources = getArtworkResponsiveImageSources(
                  artwork.public_image_path,
                  artwork.image_width ?? 1600,
                  artwork.image_height ?? 1200,
                );
                const thumbFailed = failedImages[artwork.id];
                return (
                  <button
                    key={artwork.id}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    disabled={isNavDisabled}
                    onClick={() => {
                      if (isNavDisabled || artwork.id === currentArtwork.id) return;
                      const dir = idx > activeIndex ? "forward" : "backward";
                      triggerCardThrow(artwork, idx, dir);
                    }}
                    aria-label={`Select № ${num}: ${artwork.title}`}
                    className={`group shrink-0 relative flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xs transition-all motion-transition-micro border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                      isNavDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      isSelected
                        ? "bg-ink text-surface border-ink shadow-lg scale-105 z-10"
                        : "bg-surface text-ink-soft border-border hover:border-border-strong hover:bg-surface-muted/60"
                    }`}
                  >
                    {/* Thumbnail with subtle hover-zoom on the image only */}
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xs overflow-hidden shrink-0 border border-black/10 bg-surface-muted inline-flex items-center justify-center">
                      {thumbUrl && !thumbFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbSources.src ?? thumbUrl}
                          srcSet={thumbSources.srcSet}
                          sizes="32px"
                          width={64}
                          height={64}
                          loading="lazy"
                          fetchPriority="low"
                          decoding="async"
                          alt=""
                          onError={() => handleImageError(artwork.id)}
                          className="w-full h-full object-cover transition-transform motion-transition-ui group-hover:scale-[1.08]"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-accent/60" />
                      )}
                    </span>
                    <span className="font-mono text-xs sm:text-sm tracking-wider font-semibold">{num}</span>
                    <span className={`text-xs sm:text-sm font-artwork-title max-w-[140px] truncate hidden md:inline-block ${isSelected ? "text-surface" : "text-ink group-hover:text-accent"}`}>
                      {artwork.title}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5 shrink-0" />}
                  </button>
                );
              })}

              <div className="shrink-0 w-[calc(50vw-110px)]" aria-hidden="true" />
            </div>
          </div>
        </footer>

        {/* ─── 4. Fullscreen Lightbox ─── */}
        {isLightboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Full resolution view: ${currentArtwork.title}`}
            className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in motion-fade-in"
          >
            <div className="flex items-center justify-between text-white/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
                  № {itemNumber} of {totalFormatted}
                </span>
                <span className="text-white/40">/</span>
                <span className="font-artwork-title text-xl text-white">{currentArtwork.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close fullscreen view"
                className="p-2 text-white/70 hover:text-white transition-colors motion-transition-micro cursor-pointer text-sm font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Close</span>
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
              {imageUrl && !isImageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentResponsiveSources.src ?? imageUrl}
                  srcSet={currentResponsiveSources.srcSet}
                  sizes="100vw"
                  width={currentArtwork.image_width ?? 1600}
                  height={currentArtwork.image_height ?? 1200}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  alt={currentArtwork.alt_text || currentArtwork.title}
                  className="max-w-full max-h-[82vh] object-contain rounded-xs shadow-2xl select-none"
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/70">
              <button
                type="button"
                onClick={handlePrev}
                disabled={totalCount <= 1}
                className="hover:text-white transition-colors motion-transition-micro flex items-center gap-2 cursor-pointer py-1 px-3 border border-white/20 rounded-xs disabled:opacity-40"
              >
                <span>← Previous</span>
              </button>
              <span className="text-[11px] text-white/50 tracking-wider">
                Press [ESC] to exit · [← / →] to navigate
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={totalCount <= 1}
                className="hover:text-white transition-colors motion-transition-micro flex items-center gap-2 cursor-pointer py-1 px-3 border border-white/20 rounded-xs disabled:opacity-40"
              >
                <span>Next →</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
