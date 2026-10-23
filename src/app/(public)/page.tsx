import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { getPublicProfile } from "@/lib/data/profile";
import { getFeaturedPublishedArtworks } from "@/lib/data/artworks";
import { getStoragePublicUrl } from "@/lib/storage/urls";

export default async function HomePage() {
  const profile = await getPublicProfile();
  const featuredArtworks = await getFeaturedPublishedArtworks();

  const isCommissionOpen = profile.commission_availability === "open";
  const isWaitlist = profile.commission_availability === "waitlist";

  return (
    <div className="flex flex-col gap-20 py-12 md:py-20">
      {/* Editorial Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <Badge variant={profile.commission_availability}>
                {profile.commission_availability === "open"
                  ? "Commissions Open"
                  : profile.commission_availability === "waitlist"
                  ? "Waitlist Open"
                  : "Commissions Closed"}
              </Badge>
              <span className="text-xs text-text-muted">Independent Digital & Traditional Artist</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.08]">
              Where imagination finds its deliberate form.
            </h1>

            <p className="text-lg text-ink-soft leading-relaxed max-w-xl">
              {profile.bio || "Welcome to Karyora. Explore curated original character art, digital paintings, and illustrative works."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/gallery">
                <Button variant="primary" size="lg">
                  Explore Gallery
                </Button>
              </Link>
              <Link href="/commission">
                <Button variant="outline" size="lg">
                  Commission Information
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            {featuredArtworks.length > 0 ? (
              (() => {
                const heroArtwork = featuredArtworks[0];
                const heroImageUrl = getStoragePublicUrl(heroArtwork.public_image_path);
                return (
                  <Link
                    href={`/artworks/${heroArtwork.slug}`}
                    className="group block relative aspect-4/5 rounded-2xl bg-surface-muted border border-border overflow-hidden hover:border-border-strong transition-all shadow-md"
                  >
                    {heroImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroImageUrl}
                        alt={heroArtwork.alt_text}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    )}
                    <div className="relative w-full h-full p-8 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/40 to-transparent text-white">
                      <div className="space-y-1.5">
                        <span className="text-xs uppercase tracking-wider text-accent-soft font-semibold">
                          Featured Work
                        </span>
                        <h3 className="font-serif text-2xl group-hover:text-accent-soft transition-colors">
                          {heroArtwork.title}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-2">
                          {heroArtwork.alt_text}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })()
            ) : (
              <div className="relative aspect-4/5 rounded-2xl bg-surface-muted border border-border overflow-hidden flex items-center justify-center p-8 text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft flex items-center justify-center text-accent font-serif text-2xl">
                    K
                  </div>
                  <p className="font-serif text-xl text-ink">Curated Exhibition Space</p>
                  <p className="text-xs text-text-muted max-w-xs">
                    Published works marked as featured by the artist appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Selected Works Gallery Teaser */}
      {featuredArtworks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-serif text-3xl text-ink">Selected Works</h2>
              <p className="text-sm text-text-muted mt-1">
                Curated paintings and character studies.
              </p>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-medium text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Works</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArtworks.map((artwork) => {
              const cardImageUrl = getStoragePublicUrl(artwork.public_image_path);
              return (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden group-hover:border-border-strong transition-all h-full flex flex-col justify-between">
                    <div className="relative aspect-4/3 bg-surface-muted flex items-center justify-center overflow-hidden">
                      {cardImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cardImageUrl}
                          alt={artwork.alt_text}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="p-4 text-center">
                          <span className="font-serif text-lg text-ink/70 group-hover:text-accent transition-colors">
                            {artwork.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span className="capitalize">{artwork.category.replace("-", " ")}</span>
                        <span className="capitalize">{artwork.medium.replace("-", " ")}</span>
                      </div>
                      <h3 className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                        {artwork.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Commission Inquiry Call-to-Action */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-surface rounded-2xl border border-border p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <Badge variant={profile.commission_availability}>
            {profile.commission_availability.toUpperCase()}
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink">
            {isCommissionOpen
              ? "Have a project or vision in mind?"
              : isWaitlist
              ? "Join the Commission Waitlist"
              : "Commissions are Currently Closed"}
          </h2>
          <p className="text-base text-ink-soft leading-relaxed max-w-xl mx-auto">
            {profile.availability_message ||
              "Review available commission offerings, starting rates, and terms of service, then submit an inquiry for consideration."}
          </p>
          <div className="pt-2">
            <Link href="/commission">
              <Button variant="primary" size="lg">
                {isCommissionOpen
                  ? "View Offerings & Inquire"
                  : isWaitlist
                  ? "Join Waitlist"
                  : "View Offerings Guide"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
