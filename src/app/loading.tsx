export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading content"
        />
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
