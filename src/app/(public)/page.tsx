import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ArtworkStageShowcase } from "@/components/gallery/ArtworkStageShowcase";
import { getPublicProfile } from "@/lib/data/profile";
import { getFeaturedPublishedArtworks } from "@/lib/data/artworks";

export default async function HomePage() {
  const profile = await getPublicProfile();
  const featuredArtworks = await getFeaturedPublishedArtworks(8);

  const isCommissionOpen = profile.commission_availability === "open";
  const isWaitlist = profile.commission_availability === "waitlist";

  return (
    <div className="flex flex-col gap-16 md:gap-24 py-8 md:py-16">
      {/* Editorial Index Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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

      {/* Hero Headline Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center space-y-6">
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold">
          Independent Digital & Traditional Artist
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-ink tracking-tight leading-[0.98] max-w-4xl mx-auto">
          Where <span className="italic font-normal text-accent">imagination</span> finds its deliberate form.
        </h1>
        <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl mx-auto font-normal">
          {profile.bio ||
            "Welcome to Karyora. Explore curated character art, digital paintings, and illustrative works shaped with intent and narrative depth."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-sm border border-ink bg-ink text-surface hover:bg-accent hover:border-accent transition-all shadow-xs gap-2"
          >
            <span>View Complete Archive</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/commission"
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-all"
          >
            Commission Guide
          </Link>
        </div>
      </section>

      {/* ─── Alan Menken + Kern Inc Interactive Stage Showcase ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
              01 / Spotlight Exhibition
            </span>
            <span className="text-xs font-mono text-text-muted hidden sm:inline-block">
              Interactive Ribbon · Click strip or dock to focus
            </span>
          </div>

          <ArtworkStageShowcase artworks={featuredArtworks} />
        </div>
      </section>

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