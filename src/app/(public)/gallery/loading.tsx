const SKELETON_ROWS: { width: string; height: string }[][] = [
  [
    { width: "22%", height: "17vh" },
    { width: "6%", height: "11vh" },
    { width: "13%", height: "14vh" },
    { width: "14%", height: "13vh" },
    { width: "11%", height: "12vh" },
    { width: "9%", height: "14vh" },
  ],
  [
    { width: "19%", height: "16vh" },
    { width: "5%", height: "10vh" },
    { width: "11%", height: "14vh" },
    { width: "7%", height: "12vh" },
    { width: "12%", height: "14vh" },
    { width: "15%", height: "16vh" },
    { width: "6%", height: "10vh" },
  ],
  [
    { width: "18%", height: "16vh" },
    { width: "6%", height: "9vh" },
    { width: "10%", height: "13vh" },
    { width: "7%", height: "11vh" },
    { width: "11%", height: "13vh" },
    { width: "20%", height: "16vh" },
  ],
];

export default function GalleryLoading() {
  return (
    <div
      className="camera-room relative h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-paper text-ink"
      role="status"
      aria-label="Loading the Salon Wall"
    >
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex h-16 items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-12">
        <div className="h-9 w-24 animate-pulse rounded-full bg-surface-muted/60" aria-hidden="true" />
        <div className="absolute left-1/2 top-1/2 h-7 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-xs bg-surface-muted sm:h-8 sm:w-64" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
      </header>

      <main className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center gap-3 px-[5vw] sm:gap-5 sm:px-[7vw]">
          {SKELETON_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center justify-center gap-2 sm:gap-3"
              style={{ marginLeft: rowIndex === 1 ? "3%" : 0 }}
            >
              {row.map((item, index) => (
                <div
                  key={index}
                  className="animate-pulse border border-border/50 bg-surface-muted/60 p-1.5 sm:p-2.5"
                  style={{ width: item.width, height: item.height }}
                >
                  <div className="h-full w-full bg-paper/50" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <div className="h-3 w-64 animate-pulse rounded-2xs bg-surface-muted sm:w-80" />
        </div>
      </main>
    </div>
  );
}
