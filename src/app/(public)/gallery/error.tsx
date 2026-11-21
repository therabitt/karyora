"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "The Salon Wall could not load its collection:",
      error.digest || error.message,
    );
  }, [error]);

  return (
    <main className="camera-room flex min-h-[100dvh] flex-col bg-paper text-ink">
      <header className="flex h-16 shrink-0 items-center justify-center px-4 sm:h-[72px] sm:px-8">
        <span className="font-brand text-[26px] leading-none tracking-tight sm:text-3xl lg:text-[40px]">
          The Salon Wall
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div
          role="alert"
          className="w-full max-w-lg border-y border-border py-10 text-center sm:py-14"
        >
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-hover">
            The wall is unavailable
          </p>
          <h1 className="mt-4 font-artwork-title text-4xl leading-tight sm:text-5xl">
            The exhibition could not be opened.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-text-muted sm:text-base">
            The collection could not be loaded right now. The wall is still
            here — try again in a moment.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:border-accent-hover hover:bg-accent-hover focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center border border-border-strong/50 px-5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
