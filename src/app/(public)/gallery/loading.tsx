export default function GalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14 w-full space-y-8 sm:space-y-10 animate-pulse">
      {/* Masthead Skeleton */}
      <div className="border-b border-border pb-6 sm:pb-8 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-36 bg-surface-muted rounded-2xs" />
            <div className="h-10 w-64 sm:w-80 bg-surface-muted rounded-xs" />
          </div>
          <div className="h-7 w-40 bg-surface-muted rounded-xs" />
        </div>
        <div className="h-4 w-full max-w-xl bg-surface-muted rounded-2xs" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <div className="h-8 w-24 bg-surface-muted rounded-xs shrink-0" />
          <div className="h-8 w-28 bg-surface-muted rounded-xs shrink-0" />
          <div className="h-8 w-24 bg-surface-muted rounded-xs shrink-0" />
          <div className="h-8 w-24 bg-surface-muted rounded-xs shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 bg-surface-muted rounded-xs" />
          <div className="h-8 w-32 bg-surface-muted rounded-xs" />
        </div>
      </div>

      {/* Living Index Skeleton (Desktop split: 7 cols list, 5 cols preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* Left: List Skeleton */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-t border-b border-border divide-y divide-border">
            <div className="py-6 px-4 space-y-2">
              <div className="h-3 w-28 bg-surface-muted rounded-2xs" />
              <div className="h-8 w-64 bg-surface-muted rounded-xs" />
              <div className="h-4 w-40 bg-surface-muted rounded-2xs" />
            </div>
            <div className="py-6 px-4 space-y-2">
              <div className="h-3 w-28 bg-surface-muted rounded-2xs" />
              <div className="h-8 w-56 bg-surface-muted rounded-xs" />
              <div className="h-4 w-40 bg-surface-muted rounded-2xs" />
            </div>
            <div className="py-6 px-4 space-y-2">
              <div className="h-3 w-28 bg-surface-muted rounded-2xs" />
              <div className="h-8 w-72 bg-surface-muted rounded-xs" />
              <div className="h-4 w-40 bg-surface-muted rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Right: Preview Skeleton */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          <div className="border border-border bg-surface p-5 rounded-xs space-y-4">
            <div className="aspect-4/3 w-full bg-surface-muted rounded-2xs" />
            <div className="space-y-2 pt-1">
              <div className="h-3 w-32 bg-surface-muted rounded-2xs" />
              <div className="h-7 w-48 bg-surface-muted rounded-xs" />
              <div className="h-4 w-full bg-surface-muted rounded-2xs" />
              <div className="h-10 w-full bg-surface-muted rounded-xs pt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
