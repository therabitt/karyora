import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ArtworkStageShowcase } from "@/components/gallery/ArtworkStageShowcase";
import { getPublicProfile } from "@/lib/data/profile";
import { getFeaturedPublishedArtworks } from "@/lib/data/artworks";

interface HomePageProps {
  searchParams?: Promise<{
    item?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialIndex = params?.item ? Math.max(0, Number(params.item) - 1) : 0;
  const profile = await getPublicProfile();
  // Fetch up to 5 featured published artworks for the exhibition stage
  const featuredArtworks = await getFeaturedPublishedArtworks(5);

  const isCommissionOpen = profile.commission_availability === "open";
  const isWaitlist = profile.commission_availability === "waitlist";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10 sm:gap-14 pt-3 sm:pt-5 pb-16">
      {/* ─── Integrated First Viewport: Editorial Statement & Exhibition Stage ─── */}
      <section className="space-y-4 sm:space-y-5">
        {/* Compact Asymmetric Masthead Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-3.5">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">
              <span>{profile.display_name || "Karyora Studio"}</span>
              <span className="text-border-strong font-normal">/</span>
              <span className="text-text-muted">Featured Exhibition</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight leading-[1.1]">
              Where <span className="italic font-normal text-accent">imagination</span> finds its deliberate form.
            </h1>
          </div>

          {/* Availability Status & Archive Action */}
          <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
            <Badge variant={profile.commission_availability}>
              {isCommissionOpen
                ? "● Commissions Open"
                : isWaitlist
                ? "● Waitlist Open"
                : "○ Currently Closed"}
            </Badge>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-xs border border-ink bg-ink text-surface hover:bg-accent hover:border-accent transition-all shadow-xs gap-1.5"
            >
              <span>Archive</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Featured Artwork Stage Showcase */}
        <ArtworkStageShowcase artworks={featuredArtworks} initialIndex={initialIndex} />
      </section>

      {/* ─── Commission Consideration (Art-Led Editorial Invitation) ─── */}
      <section className="border-t border-border pt-8 sm:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center bg-surface border border-border p-6 sm:p-8 lg:p-10 rounded-xs shadow-xs">
          <div className="md:col-span-8 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              02 / Commission Consideration
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
              {isCommissionOpen
                ? "Have a project or vision in mind?"
                : isWaitlist
                ? "Join the Commission Waitlist"
                : "Commissions are Currently Closed"}
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xl font-normal">
              {profile.availability_message ||
                "Review available commission offerings, starting rates, and guidelines, then submit an inquiry for consideration."}
            </p>
          </div>

          <div className="md:col-span-4 flex md:justify-end">
            <Link
              href="/commission"
              className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-3 rounded-xs bg-accent text-white hover:bg-accent-hover transition-all shadow-xs gap-2"
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
      </section>
    </div>
  );
}
