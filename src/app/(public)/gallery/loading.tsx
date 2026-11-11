export default function GalleryLoading() {
  return (
    <div className="camera-room relative flex h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden bg-paper text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-12">
        <div className="h-3 w-12 animate-pulse rounded-2xs bg-surface-muted" />
        <div className="absolute left-1/2 top-1/2 h-7 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-xs bg-surface-muted sm:h-8 sm:w-64" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="flex min-w-max items-center gap-10 px-[12vw] sm:gap-16 sm:px-[10vw]">
            {[
              "h-[48vh] w-[34vw] max-w-[360px]",
              "h-[58vh] w-[39vw] max-w-[430px]",
              "h-[40vh] w-[28vw] max-w-[300px]",
              "h-[52vh] w-[36vw] max-w-[390px]",
              "h-[44vh] w-[31vw] max-w-[330px]",
            ].map((size, index) => (
              <div
                key={index}
                className={`shrink-0 animate-pulse border border-border/60 bg-surface-muted/70 p-3 sm:p-4 ${size}`}
              >
                <div className="h-full w-full bg-paper/60" />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <div className="h-3 w-64 animate-pulse rounded-2xs bg-surface-muted sm:w-80" />
        </div>
      </main>
    </div>
  );
}
