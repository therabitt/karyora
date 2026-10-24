import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getPublicProfile } from "@/lib/data/profile";
import { getFeaturedPublishedArtworks } from "@/lib/data/artworks";
import { getStoragePublicUrl } from "@/lib/storage/urls";

export default async function HomePage() {
  const profile = await getPublicProfile();
  const featuredArtworks = await getFeaturedPublishedArtworks();

  const isCommissionOpen = profile.commission_availability === "open";
  const isWaitlist = profile.commission_availability === "waitlist";

  return (
    <div className="flex flex-col gap-24 py-8 md:py-16">
      {/* Editorial Index Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between border-b border-border pb-3 text-[11px] uppercase tracking-[0.2em] text-text-muted font-medium">
          <div className="flex items-center gap-3">
            <span className="text-accent font-semibold">Portfolio & Studio</span>
            <span className="hidden sm:inline-block text-border-strong">/</span>
            <span className="hidden sm:inline-block">Original Works</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={profile.commission_availability}>
              {profile.commission_availability === "open"
                ? "● Commissions Open"
                : profile.commission_availability === "waitlist"
                ? "● Waitlist Open"
                : "○ Currently Closed"}
            </Badge>
          </div>
        </div>
      </section>

      {/* Editorial Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Expressive Typography */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold">
                Independent Artist & Illustrator
              </span>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-ink tracking-tight leading-[0.98]">
                Where <span className="italic font-normal text-accent">imagination</span> finds its deliberate form.
              </h1>
            </div>

            <p className="text-lg sm:text-xl text-ink-soft leading-relaxed max-w-xl font-normal">
              {profile.bio ||
                "Welcome to Karyora. Explore curated original character art, digital paintings, and illustrative works shaped with intent and narrative depth."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-sm bg-accent text-white hover:bg-accent-hover transition-all shadow-xs gap-2"
              >
                <span>Explore Gallery</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/commission"
                className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-all"
              >
                Commission Info
              </Link>
            </div>
          </div>

          {/* Right: Asymmetric Artwork Plate */}
          <div className="lg:col-span-5">
            {featuredArtworks.length > 0 ? (
              (() => {
                const heroArtwork = featuredArtworks[0];
                const heroImageUrl = getStoragePublicUrl(heroArtwork.public_image_path);
                return (
                  <div className="space-y-3">
                    <Link
                      href={`/artworks/${heroArtwork.slug}`}
                      className="group block relative aspect-4/5 bg-surface-muted border border-border overflow-hidden shadow-md"
                    >
                      {heroImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={heroImageUrl}
                          alt={heroArtwork.alt_text}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <span className="text-xs uppercase tracking-widest text-white font-medium">
                          View Artwork Details →
                        </span>
                      </div>
                    </Link>

                    {/* Editorial Plate Label */}
                    <div className="flex items-baseline justify-between pt-1 border-t border-border/80">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold block">
                          Featured Study
                        </span>
                        <Link
                          href={`/artworks/${heroArtwork.slug}`}
                          className="font-serif text-xl text-ink hover:text-accent transition-colors block mt-0.5"
                        >
                          {heroArtwork.title}
                        </Link>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-text-muted">
                        № 01
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="relative aspect-4/5 bg-surface-muted border border-border flex items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-xs">
                  <div className="w-14 h-14 mx-auto rounded-full bg-accent-soft flex items-center justify-center text-accent font-serif text-2xl">
                    K
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif text-xl text-ink">Curated Exhibition Space</p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Featured works selected by the artist appear here.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Selected Works Gallery Teaser */}
      {featuredArtworks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
                01 / Curated Selection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink">Selected Works</h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs uppercase tracking-widest font-semibold text-accent hover:text-accent-hover inline-flex items-center gap-2 transition-colors pb-1 border-b border-accent/40 hover:border-accent"
            >
              <span>View All Archive</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredArtworks.map((artwork, idx) => {
              const cardImageUrl = getStoragePublicUrl(artwork.public_image_path);
              const formattedIndex = String(idx + 1).padStart(2, "0");

              return (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.slug}`}
                  className="group block space-y-3"
                >
                  {/* Floating Artwork Plate */}
                  <div className="relative aspect-4/3 bg-surface-muted border border-border overflow-hidden">
                    {cardImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cardImageUrl}
                        alt={artwork.alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center">
                        <span className="font-serif text-lg text-ink/70">
                          {artwork.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-paper/90 backdrop-blur-xs text-[10px] font-mono text-ink tracking-wider border border-border/80">
                      № {formattedIndex}
                    </div>
                  </div>

                  {/* Metadata & Title */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">
                      <span className="capitalize">{artwork.category.replace("-", " ")}</span>
                      <span>·</span>
                      <span className="capitalize">{artwork.medium.replace("-", " ")}</span>
                    </div>
                    <h3 className="font-serif text-xl text-ink group-hover:text-accent transition-colors flex items-center justify-between">
                      <span>{artwork.title}</span>
                      <span className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" aria-hidden="true">
                        →
                      </span>
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Commission Inquiry Call-to-Action */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="border border-border bg-surface p-8 sm:p-14 relative overflow-hidden shadow-xs">
          {/* Subtle Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              02 / Commission Consideration
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
              {isCommissionOpen
                ? "Have a project or vision in mind?"
                : isWaitlist
                ? "Join the Commission Waitlist"
                : "Commissions are Currently Closed"}
            </h2>

            <p className="text-base text-ink-soft leading-relaxed max-w-xl mx-auto">
              {profile.availability_message ||
                "Review available commission offerings, starting rates, and guidelines, then submit an inquiry for consideration."}
            </p>

            <div className="pt-4">
              <Link
                href="/commission"
                className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-sm bg-accent text-white hover:bg-accent-hover transition-all shadow-xs gap-2"
              >
                <span>
                  {isCommissionOpen
                    ? "View Offerings & Inquire"
                    : isWaitlist
                    ? "Join Waitlist"
                    : "View Offerings Guide"}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}