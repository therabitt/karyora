"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import {
  KARYORA_OPENING_SCENES,
  KARYORA_OPENING_SESSION_KEY,
} from "@/lib/opening-sequence";

interface KaryoraOpeningSequenceContextValue {
  isOpeningSequenceActive: boolean;
  shouldStartInitialRibbonEntrance: boolean;
}

const KaryoraOpeningSequenceContext =
  createContext<KaryoraOpeningSequenceContextValue>({
    isOpeningSequenceActive: false,
    // Preserve the existing initial Ribbon entrance for any future consumer
    // that renders the showcase without the homepage's opening controller.
    shouldStartInitialRibbonEntrance: true,
  });

export function useKaryoraOpeningSequence() {
  return useContext(KaryoraOpeningSequenceContext);
}

interface KaryoraOpeningSequenceProps {
  enabled: boolean;
  children: ReactNode;
}

type OpeningPhase = "intro" | "complete";
type ExitAction = "reveal" | "skip";

export function KaryoraOpeningSequence({
  enabled,
  children,
}: KaryoraOpeningSequenceProps) {
  const [phase, setPhase] = useState<OpeningPhase>(enabled ? "intro" : "complete");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [exitAction, setExitAction] = useState<ExitAction>("skip");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shouldStartInitialRibbonEntrance, setShouldStartInitialRibbonEntrance] =
    useState(false);
  const sessionCheckRef = useRef(false);
  const hasPresentedIntroRef = useRef(false);
  const focusHeadlineOnNextSceneRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const isOpeningSequenceActive = enabled && phase !== "complete";
  const scene = KARYORA_OPENING_SCENES[sceneIndex];

  useLayoutEffect(() => {
    if (!enabled || sessionCheckRef.current) return;
    sessionCheckRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReducedMotion(prefersReducedMotion);

    let hasSeenOpening = false;
    try {
      hasSeenOpening =
        window.sessionStorage.getItem(KARYORA_OPENING_SESSION_KEY) === "1";
      if (!hasSeenOpening) {
        // Mark the intro at the moment it is presented, so navigating away
        // midway through cannot unexpectedly replay it in the same tab session.
        window.sessionStorage.setItem(KARYORA_OPENING_SESSION_KEY, "1");
      }
    } catch {
      // Storage can be unavailable in restricted browsing contexts. The intro
      // still works for this mount and degrades without breaking navigation.
    }

    if (hasSeenOpening) {
      setPhase("complete");
      return;
    }

    hasPresentedIntroRef.current = true;
    dialogRef.current?.focus({ preventScroll: true });
  }, [enabled]);

  useLayoutEffect(() => {
    if (focusHeadlineOnNextSceneRef.current) {
      focusHeadlineOnNextSceneRef.current = false;
      headlineRef.current?.focus({ preventScroll: true });
      return;
    }

    // Keep keyboard and screen-reader context on the new scene when narration
    // advances automatically and the previous scene's control disappears.
    if (sceneIndex > 0 && phase === "intro") {
      headlineRef.current?.focus({ preventScroll: true });
    }
  }, [phase, sceneIndex]);

  useLayoutEffect(() => {
    if (phase !== "complete" || !hasPresentedIntroRef.current) return;
    document.querySelector<HTMLElement>("[data-karyora-gallery-stage]")?.focus({
      preventScroll: true,
    });
  }, [phase]);

  useEffect(() => {
    if (!isOpeningSequenceActive || isExiting || reducedMotion) return;

    const timeoutId = window.setTimeout(() => {
      if (sceneIndex < KARYORA_OPENING_SCENES.length - 1) {
        setSceneIndex((current) => Math.min(current + 1, KARYORA_OPENING_SCENES.length - 1));
      } else {
        setExitAction("reveal");
        setIsExiting(true);
      }
    }, scene.durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [isOpeningSequenceActive, isExiting, reducedMotion, scene.durationMs, sceneIndex]);

  useEffect(() => {
    if (!isExiting) return;

    const timeoutMs = reducedMotion ? 0 : exitAction === "reveal" ? 680 : 150;
    const timeoutId = window.setTimeout(() => {
      setPhase("complete");
      setIsExiting(false);
      setShouldStartInitialRibbonEntrance(
        exitAction === "reveal" && !reducedMotion,
      );
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [exitAction, isExiting, reducedMotion]);

  useEffect(() => {
    if (!isOpeningSequenceActive) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [isOpeningSequenceActive]);

  const finishOpening = useCallback((action: ExitAction) => {
    if (reducedMotion) {
      setPhase("complete");
      setIsExiting(false);
      setShouldStartInitialRibbonEntrance(false);
      return;
    }

    setExitAction(action);
    setIsExiting(true);
  }, [reducedMotion]);

  const handleEnter = useCallback(() => {
    if (reducedMotion) {
      finishOpening("skip");
      return;
    }

    focusHeadlineOnNextSceneRef.current = true;
    setSceneIndex(1);
  }, [finishOpening, reducedMotion]);

  const handleDialogKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!isExiting) finishOpening("skip");
      return;
    }

    if (event.key !== "Tab" || isExiting) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hidden);

    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (focusable.length === 1) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (activeElement === first || activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }, [finishOpening, isExiting]);

  const contextValue = useMemo(
    () => ({
      isOpeningSequenceActive,
      shouldStartInitialRibbonEntrance,
    }),
    [isOpeningSequenceActive, shouldStartInitialRibbonEntrance],
  );

  return (
    <KaryoraOpeningSequenceContext.Provider value={contextValue}>
      <div
        inert={isOpeningSequenceActive ? true : undefined}
        aria-hidden={isOpeningSequenceActive ? true : undefined}
      >
        {children}
      </div>

      {isOpeningSequenceActive && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="karyora-opening-title"
          aria-describedby="karyora-opening-description"
          aria-hidden={undefined}
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
          onWheel={(event) => event.preventDefault()}
          className="karyora-opening fixed inset-0 z-[200] grid min-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-paper px-6 py-6 text-ink sm:px-10 sm:py-8 lg:px-14"
          data-exiting={isExiting ? "true" : "false"}
          data-exit-action={exitAction}
          data-reduced-motion={reducedMotion ? "true" : "false"}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted sm:text-xs">
                Karyora Studio
              </span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-text-muted/80 sm:text-[11px]">
                A space for art to find its form
              </span>
            </div>
            <button
              type="button"
              onClick={() => finishOpening("skip")}
              disabled={isExiting}
              className="karyora-opening-skip group inline-flex min-h-11 items-center gap-2 border-b border-border-strong/70 pb-1 font-sans text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50 sm:text-sm"
            >
              <span>Skip intro</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none">↗</span>
            </button>
          </div>

          <main className="flex min-h-0 flex-col items-center justify-center py-10 text-center">
            <div
              className="karyora-opening-copy w-full max-w-5xl"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="font-brand text-4xl leading-none text-accent sm:text-5xl lg:text-6xl">
                Karyora
              </p>
              <p className="mb-5 mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted sm:mb-7 sm:mt-10 sm:text-xs">
                {scene.eyebrow}
              </p>
              <h1
                ref={headlineRef}
                id="karyora-opening-title"
                tabIndex={-1}
                className={
                  "karyora-opening-headline mx-auto max-w-5xl text-balance text-4xl font-normal leading-[1.03] tracking-[-0.045em] focus:outline-hidden sm:text-6xl lg:text-8xl " +
                  (sceneIndex === 0 ? "karyora-opening-headline-invitation" : "")
                }
                key={scene.id}
              >
                {scene.headline}
              </h1>
              <p
                id="karyora-opening-description"
                className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-soft sm:mt-8 sm:text-base lg:text-lg"
                key={scene.id + "-description"}
              >
                {scene.description}
              </p>
            </div>

            {reducedMotion ? (
              <div className="mt-8 w-full max-w-2xl text-left">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  In this exhibition
                </p>
                <ul className="space-y-2 border-l border-border-strong/70 pl-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                  {KARYORA_OPENING_SCENES.slice(1).map((openingScene) => (
                    <li key={openingScene.id}>{openingScene.headline}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => finishOpening("skip")}
                  className="mt-7 inline-flex min-h-12 items-center gap-3 bg-ink px-5 py-3 font-sans text-sm font-medium text-paper transition-colors hover:bg-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
                >
                  Enter the gallery <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : sceneIndex === 0 ? (
              <button
                type="button"
                onClick={handleEnter}
                className="mt-9 inline-flex min-h-12 items-center gap-3 border-b border-accent pb-2 font-sans text-sm font-medium text-ink transition-colors hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none sm:mt-11"
              >
                Enter the world <span aria-hidden="true" className="transition-transform hover:translate-x-1">↗</span>
              </button>
            ) : (
              <span className="mt-10 inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted sm:mt-12">
                <span className="h-px w-8 bg-border-strong/70" aria-hidden="true" />
                The exhibition unfolds
                <span className="h-px w-8 bg-border-strong/70" aria-hidden="true" />
              </span>
            )}
          </main>

          <div className="grid grid-cols-[1fr_auto] items-end gap-6 border-t border-border/70 pt-4 sm:grid-cols-3 sm:pt-5">
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-text-muted sm:block sm:text-xs">
              Artwork · Stories · Commissions
            </span>
            <div className="flex items-center gap-3 justify-self-start sm:justify-self-center" aria-label={"Opening scene " + (sceneIndex + 1) + " of " + KARYORA_OPENING_SCENES.length}>
              <span className="font-mono text-[10px] tabular-nums text-text-muted">
                {String(sceneIndex + 1).padStart(2, "0")}
              </span>
              <span className="karyora-opening-progress-track block h-px w-20 bg-border sm:w-28" aria-hidden="true">
                <span
                  className="karyora-opening-progress-fill block h-px bg-accent"
                  style={{ width: ((sceneIndex + 1) / KARYORA_OPENING_SCENES.length) * 100 + "%" }}
                />
              </span>
              <span className="font-mono text-[10px] tabular-nums text-text-muted">
                {String(KARYORA_OPENING_SCENES.length).padStart(2, "0")}
              </span>
            </div>
            <span className="justify-self-end text-right font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted sm:text-xs">
              {reducedMotion ? "Reduced motion" : "Opening sequence"}
            </span>
          </div>
        </div>
      )}
    </KaryoraOpeningSequenceContext.Provider>
  );
}
