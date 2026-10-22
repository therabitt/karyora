"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log sanitized error details to console
    console.error("Recoverable application error:", error.digest || error.message);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-danger font-semibold">
          Error Encountered
        </span>
        <h1 className="font-serif text-3xl text-ink">Something went wrong</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          An unexpected error occurred while loading this view. You can try
          reloading the page or returning home.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => reset()}>
            Try Again
          </Button>
          <Button variant="primary" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
